/*Title : DPOR Validation (AV (Before), Pageflow (Before Button))
Purpose : Validate LP class (rank) and Speciality against DPOR data.

Author: Yazan Barghouth
Functional Area :
Description : JSON Example :

{
  "Building/Electrical/NA/NA": {
    "WorkflowTaskUpdateBefore": [
      {
        "metadata": {
		  "description": "Validate LP with DPOR interface (Before)",
          "operators": {
            
          }
        },
        "criteria": {
        	"task":["task1"],
        	"status":["status-a"]
        },
        "preScript": "",
        "action": {
          "validateRank":true,
		  "validateSpecialties":true,
		  
		  "rejectLpWithStatuses":["Withdrawn","Expired"],
		  "rejectLpExpiresWithinDays": 20,									//rejected using OR
		  
		  "specialtyValidationScope":"Custom Field",		//Method for capturing scope
		  "specialtyValidationRecordTypes":{									//based on method selected above, one of below is used
			"Building/Electrical/ * /NA":["ELE","MELE"],
			"Building/Electrical/Mechanical/NA":["MECH"],
		  },
		  "specialtyValidationCustomFields":{
			"fieldName":"Type of Work",
			"Water Heater":["ELE","MELE"],
			"Water Pump":["ELE"]
		  },
		  "specialtyValidationCustomList":{
			"tableName":"tab_123",
			"columnName":"col_123",
			"Water Heater":["ELE","MELE"],
			"Water Pump":["ELE"]
		  },
		  
		  "jobValueSource":"estimated"
        },
        "postScript": ""
      }
    ]
  }
}

Property Options:
- specialtyValidationScope: Record Type, (Custom Field or ASI), (Custom List or ASIT) [case insensitive, spaces between phrases are ignored]
- if scope = Record Type, property specialtyValidationRecordTypes is required
- if scope = Custom Field, property specialtyValidationCustomFields is required
- if scope = Custom List, property specialtyValidationCustomList is required
- specialtyValidationRecordTypes supports wildcards, 1st match is taken
- jobValueSource: calculated, estimated, highest or lowest

Standard Choice Dependencies:
1- DPOR_INTERFACE: (SERVICE_URL and SERVICE_TOKEN)
2- DPOR_LICENSE_TYPES which License type to check with DPOR (empty or not exist means ALL)
3- DPOR_MAX_PERMIT_RATE_MAPPING: contain entries for Rank and Max allowed Job Value per permit, A is not included (unlimited) example: Value=B, Desc=120000.

Script Dependencies:
1- DPOR_INTERFACE

 */

// this function is added so this script would work on pageflow
function getScriptText(vScriptName, servProvCode, useProductScripts) {
	if (!servProvCode)
		servProvCode = aa.getServiceProviderCode();
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		if (useProductScripts) {
			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
		} else {
			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
		}
		return emseScript.getScriptText() + "";
	} catch (err) {
		return "";
	}
}

var scriptSuffix = "DPOR_VALIDATION";

//Global Variables, to be initialized once (better performance)
var dporLpTypes = null;
var maxRateMappingAry = null;

try {
	eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
	var settingsArray = [];
	isConfigurableScript(settingsArray, scriptSuffix);
	for (s in settingsArray) {
		var rules = settingsArray[s];

		if (!matches(rules.preScript, null, "")) {
			eval(getScriptText(rules.preScript, null, false));
		}

		if (cancelCfgExecution) {
			logDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
			cancelCfgExecution = false;
			continue;
		}

		validateDpor(rules);

		if (!matches(rules.postScript, null, "")) {
			eval(getScriptText(rules.postScript, null, false));
		}
	}//for all settings
} catch (ex) {
	logDebug("**ERROR:Exception while verificaiton the rules for " + scriptSuffix + ". Error: " + ex);
	//showValidationResult("**ERROR: " + scriptSuffix + ". Exception: " + ex);
}

/**
 * 
 * @param rules
 * @returns {Boolean}
 */
function validateDpor(rules) {
	var lpArray = new Array();
	getLPFields(lpArray);
	for (p in lpArray) {
		if (!isDporValidateRequired(lpArray[p]["licType"]))
			continue;

		//get DPOR response for this LP:
		var dporRespObj = callDporApi(lpArray[p]["licenseNbr"]);
		if (dporRespObj.isErr) {
			showValidationResult(dporRespObj.errorMessage);
			return false;
		}

		var validationMessage = "";

		//validate Status and Expiry Date
		validationMessage = isValidStatusAndExpiry(rules, dporRespObj.respObj);
		if (!isEmptyOrNull(validationMessage)) {
			showValidationResult(validationMessage);
			return false;
		}

		//validateRank
		if (rules.action.validateRank) {
			validationMessage = isValidRank(rules, lpArray[p], dporRespObj.respObj);
		}
		if (!isEmptyOrNull(validationMessage)) {
			showValidationResult(validationMessage);
			return false;
		}

		//validateSpecialties
		if (rules.action.validateSpecialties) {
			validationMessage = isValidSpeciality(rules, lpArray[p], dporRespObj.respObj);
		}

		if (!isEmptyOrNull(validationMessage)) {
			showValidationResult(validationMessage);
			return false;
		}
	}//for all LPs on cap
}

/**
 * Validate if required Specialities are available on the LP (using DPOR response data)
 * @param rules JSON rules item
 * @param lpItem LP object
 * @param dporRespObj dpor response Soap Result
 * @returns {String} empty string if valid, an error message otherwise
 */
function isValidSpeciality(rules, lpItem, dporRespObj) {
	var captureScope = rules.action.specialtyValidationScope;
	if (isEmptyOrNull(captureScope)) {
		captureScope = "";
	}
	captureScope = captureScope.toLowerCase();

	var requiredSpecArray = null;
	var appTypeArrayLocal = null;

	if (captureScope == "record type" || captureScope == "recordtype") {
		if (isPublicUser) {
			//ACA, cap initialized in CONFIGURABLE_SCRIPT_COMMON
			appTypeArrayLocal = cap.getCapType().getValue().split("/");
		} else {
			//AV
			appTypeArrayLocal = appTypeArray;
		}
		for (s in rules.action.specialtyValidationRecordTypes) {
			var tmpX = s.split("/");
			if ((tmpX[0] == appTypeArrayLocal[0] || tmpX[0] == "*") && (tmpX[1] == appTypeArrayLocal[1] || tmpX[1] == "*") && (tmpX[2] == appTypeArrayLocal[2] || tmpX[2] == "*")
					&& (tmpX[3] == appTypeArrayLocal[3] || tmpX[3] == "*")) {
				requiredSpecArray = rules.action.specialtyValidationRecordTypes[s];
				break;
			}
		}
	} else if (captureScope == "custom field" || captureScope == "customfield" || captureScope == "asi") {
		var scopeConf = rules.action.specialtyValidationCustomFields
		var fieldValue = GetASIValue(scopeConf.fieldName);
		requiredSpecArray = rules.action.specialtyValidationCustomFields[fieldValue];
	} else if (captureScope == "custom list" || captureScope == "customlist" || captureScope == "asit") {
		var tblName = rules.action.specialtyValidationCustomList.tableName;
		var colName = rules.action.specialtyValidationCustomList.columnName;
		var tableValue = getASITable(tblName);
		requiredSpecArray = new Array();
		for (i in tableValue) {
			var colVal = tableValue[i][colName];
			var tmpReqAry = rules.action.specialtyValidationCustomList[colVal];
			for (tt in tmpReqAry) {
				//duplicates may exist, but it's insignificant to performance
				requiredSpecArray.push("(" + tmpReqAry[tt] + ")");
			}//for all items in conf SpecReq Array
		}//for all ASIT rows
	} else {
		return "Unsupported specialtyValidationScope: " + captureScope;
	}
	if (requiredSpecArray == null || requiredSpecArray.length == 0) {
		return "";
	}

	for (r in requiredSpecArray) {
		if (dporRespObj.comments.indexOf("(" + requiredSpecArray[r] + ")") == -1) {
			return "This contractor is not licensed to perform: " + requiredSpecArray[r];
		}
	}

	return "";
}

/**
 * Validate if LP has one of the Not Allowed Statuses, or if it will expire before certain number of days
 * @param rules JSON rules item
 * @param dporRespObj dpor response Soap Result
 * @returns {String} empty string if valid, an error message otherwise
 */
function isValidStatusAndExpiry(rules, dporRespObj) {
	//check if reject by status rejectLpWithStatuses
	var rejectByStatus = rules.action.rejectLpWithStatuses;
	for (s in rejectByStatus) {
		if (rejectByStatus[s] == dporRespObj.licStatus) {
			return "The Status of this contractor's License " + rejectByStatus[s] + " is not permited for this work";
		}
	}//for all rejectLpWithStatuses

	//check if reject by expiration days remaining rejectLpExpiresWithinDays
	var expDate = dporRespObj.expireDate;
	var daysToExpire = dateDiff(aa.util.now(), expDate);
	daysToExpire = Math.ceil(daysToExpire);

	if (rules.action.rejectLpExpiresWithinDays >= daysToExpire) {
		return "This contractor's License will expire within " + rules.action.rejectLpExpiresWithinDays + " Days";
	}

	return "";
}

/**
 * validate license rank with Job Value of record.
 * @param rules JSON rules item
 * @param lpItem LP object
 * @param dporRespObj dpor response Soap Result
 * @returns {String} empty string if valid, an error message otherwise
 */
function isValidRank(rules, lpItem, dporRespObj) {
	var bValScriptObjResult = aa.cap.getBValuatn4AddtInfo(capId);
	var jobValue = 0;
	if (bValScriptObjResult.getSuccess()) {
		bValScriptObjResult = bValScriptObjResult.getOutput();
		if (String(rules.action.jobValueSource).toLowerCase() == "calculated")
			jobValue = bValScriptObjResult.getCalculatedValue();
		else if (String(rules.action.jobValueSource).toLowerCase() == "estimated")
			jobValue = bValScriptObjResult.getEstimatedValue();
		else if (String(rules.action.jobValueSource).toLowerCase() == "highest")
			jobValue = Math.max(bValScriptObjResult.getCalculatedValue(), bValScriptObjResult.getEstimatedValue());
		else if (String(rules.action.jobValueSource).toLowerCase() == "lowest")
			jobValue = Math.min(bValScriptObjResult.getCalculatedValue(), bValScriptObjResult.getEstimatedValue());
	} else {
		return "";
	}
	if (String(jobValue) == null || String(jobValue) == "")
		jobValue = "0";

	jobValue = parseFloat(jobValue);
	if (maxRateMappingAry == null) {
		maxRateMappingAry = new Array();
		var bizDomScriptResult = aa.bizDomain.getBizDomain("DPOR_MAX_PERMIT_RATE_MAPPING");
		if (bizDomScriptResult.getSuccess()) {
			var bizDomScriptObj = bizDomScriptResult.getOutput().toArray();
			var maxRateMappingAry = new Array();
			for (b in bizDomScriptObj) {
				if (bizDomScriptObj[b].getAuditStatus() == "A") {
					maxRateMappingAry[bizDomScriptObj[b].getBizdomainValue()] = bizDomScriptObj[b].getDescription();
				}
			}//for all entries
		}//success
	}
	if (dporRespObj.rank == "A") {
		//A unlimited
		return "";
	} else {

		//other than A, B, C, TRAD
		if (!maxRateMappingAry[dporRespObj.rank]) {
			return "This contractor's rank does not permit work that exceeds: $" + jobValue.toFixed(2);
		}

		//B, C, TRAD
		if (jobValue > parseFloat(maxRateMappingAry[dporRespObj.rank])) {
			return "This contractor's rank does not permit work that exceeds: $" + jobValue.toFixed(2);
		}
	}

	return "";
}

/**
 * check if this LP needs to be validated with DPOR, depends on lookup 'DPOR_LICENSE_TYPES'
 * @param lpType license type to check
 * @returns {Boolean} true if required, false otherwise
 */
function isDporValidateRequired(lpType) {
	//init once
	if (dporLpTypes == null) {
		dporLpTypes = aa.bizDomain.getBizDomain("DPOR_LICENSE_TYPES");
		if (dporLpTypes.getSuccess()) {
			dporLpTypes = dporLpTypes.getOutput().toArray();
		} else {
			logDebug("**WARN failed to get lookup 'DPOR_LICENSE_TYPES', validating all types, Err: " + dporLpTypes.getErrorMessage());
			return true;
		}
	}

	//if empty or not found, all types require DPOR validate
	if (dporLpTypes.length == 0) {
		return true;
	}

	for (t in dporLpTypes)
		if (dporLpTypes[t].getBizdomainValue() == lpType && dporLpTypes[t].getAuditStatus() == "A") {
			return true;
		}
	return false;
}

/**
 * Displays a message based on Context (ACA or AV)
 * @param msg message text to display
 */
function showValidationResult(msg) {
	showMessage = true;
	cancel = true;
	if (isPublicUser) {
		aa.env.setValue("ErrorCode", "1");
		aa.env.setValue("ErrorMessage", msg);
	} else {
		comment(msg);
	}
}
