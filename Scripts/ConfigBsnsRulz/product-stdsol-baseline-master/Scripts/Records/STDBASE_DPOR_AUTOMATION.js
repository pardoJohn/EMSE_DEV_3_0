/*
Title : DPOR Automation (After)
Purpose : Validate LP class (rank) and Speciality against DPOR data.
Author: Yazan Barghouth
Functional Area : ApplicationSubmitAfter, ConvertToRealCapAfter, WorkflowTaskUpdateAfter
Description : JSON Example :
{
  "Building/Electrical/NA/NA": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
		  "description": "Validate LP with DPOR interface, update local LPs and add condition(s) if required",
          "operators": {
          }
        },
        "criteria": {
        	"task":[],
        	"status":[]
        },
        "preScript": "",
        "action": {
          "enforceRank":true,
		  "enforceSpecialty":true,
		  "enforceStatus":true,
		  "enforceExpiry":true,
		  "useValueForRankMap": true;								// If true then value field from DPOR_RATE_MAPPING will be used, else will use the Desc field
		  "conditionTypeRankViolation":"",
		  "conditionNameRankViolation":"",
		  "conditionTypeSpecialtyViolation":"",
		  "conditionNameSpecialtyViolation":"",
		  "conditionTypeStatusViolation":"",
		  "conditionNameStatusViolation":"",
		  "conditionTypeExpiryViolation":"",
		  "conditionNameExpiryViolation":"",
		  "rejectLpWithStatuses":["Withdrawn","Expired"],
		  "rejectLpExpiresWithinDays": 20,									//rejected using OR
		  "specialtyValidationScope":"Record Type|Custom Field|Custom List",		//Method for capturing scope
		  "specialtyValidationRecordTypes":{									//based on method selected above, one of below is used
			"Building/Electrical/Residential/NA":["ELE","MELE"],
			"Building/Electrical/Commercial/NA":["ELE"],
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
		  
		  "jobValueSource":"calculated|estimated|highest|lowest|...",
		  "lpUpdateRefFromCap": false,									// If true then Ref LP will be updated from CAP LP information
          "lpUpdateRefFromCapRecordStatus": [							// if lpUpdateRefFromCap true then it will get the LP information from the CAP that have on of these statuses.
            "Submitted"
          ],
          "lpUpdateCapFromRef": true									// if lpUpdateRefFromCap is false and this item is true then it will update CAP LP from Ref LP
        },
        "postScript": ""
      }
    ]
  }
}

Property Options:
- specialtyValidationScope: Record Type, Custom Field or Custom List
- if scope = Record Type, property specialtyValidationRecordTypes is required
- if scope = Custom Field, property specialtyValidationCustomFields is required
- if scope = Custom List, property specialtyValidationCustomList is required
- specialtyValidationRecordTypes supports wildcards, 1st match is taken
- jobValueSource: calculated, estimated, highest or lowest
- useValueForRankMap: true/false ; Optional; set the value of the rank as is from dpor or its mapping from the STD choice DPOR_RATE_MAPPING

Standard Choice Dependencies:
1- DPOR_INTERFACE: (SERVICE_URL and SERVICE_TOKEN)
2- DPOR_LICENSE_TYPES: which License type to check with DPOR (empty or not exist means ALL)
3- DPOR_FIELD_MAPPING: (Optional) mapping between Accela DB fields and DPOR response fields,
   if not configured, a default mapping is used (hard coded).
   - For people attribute mapping, the field need to be prefixed with "$$PeopleAttribute$$.", example "$$PeopleAttribute$$.field1"
   - For custom fields mapping, the field need to be prefixed with "$$CustomAttribute$$.", example "$$CustomAttribute$$.field1"
4- DPOR_MAX_PERMIT_RATE_MAPPING
5- 
Script Dependencies:
1- DPOR_INTERFACE


- DPOR_FIELD_MAPPING Standard Choice Entries (Value : Desc)
Address Line 1 : license.addr.addrLine1
Address Line 2 : license.addr.addrLine2
Business Name : license.addr.keyNme
City : license.addr.addrCty
DBA/Trade Name (Business Name 2) : license.addr.dba
DPOR Exp Date (Birth Date) : license.exprDte
DPOR Status (Title) : license.licStaDesc
First Name : license.addr.firstNme
Last Name : license.addr.lastNme
Licensing Board : license.boardNme
Middle Name : license.addr.middleNme
Rank/ Contractor Class (Salutation) : license.rankCde
Specialties (Comments) : specialty.modDesc
State : license.addr.stCde
ZipCode : license.addr.addrZip


- Lic State field is required and it is populated with the same value used in "State" field, kindly note that "Lic State" is a required field which means it will crash if it got null value.
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

var scriptSuffix = "DPOR_AUTOMATION";

//Global Variables, to be initialized once (better performance)
var dporLpTypes = null;
var maxRateMappingAry = null;
var fieldsMapping = null;

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

		automateDpor(rules);

		if (!matches(rules.postScript, null, "")) {
			eval(getScriptText(rules.postScript, null, false));
		}
	}//for all settings
} catch (ex) {
	logDebug("**ERROR:Exception while verificaiton the rules for " + scriptSuffix + ". Error: " + ex);
}

/**
 * 
 * @param rules
 * @returns {Boolean}
 */
function automateDpor(rules) {
	var lpArray = getLicenseProfessional(capId);
	
	if (lpArray == null) {
		logDebug("**INFO no license found on record, capId=" + capId);
		return;
	}

	for (p in lpArray) {
		if (!isDporValidateRequired(lpArray[p].getLicenseType()))
			continue;

		//get DPOR response for this LP:
		var dporRespObj = callDporApi(lpArray[p].getLicenseNbr());
		if (dporRespObj.isErr) {
			logDebug("**WARN DPOR api error: " + dporRespObj.errorMessage);
			continue;
		}

		//Update Local LPs from DPOR response:
		updateLicenseProffs(rules, dporRespObj, lpArray[p]);

		//Validate LPs and add conditions if not valid
		//validate Status and Expiry Date
		var statusAndExpResult = isValidStatusAndExpiry(rules, dporRespObj.respObj);

		//validateRank
		if (rules.action.enforceRank) {
			var rankValidationResult = isValidRank(rules, dporRespObj.respObj);
			if (rankValidationResult != "") {
				var condType = rules.action.conditionTypeRankViolation;
				var condName = rules.action.conditionNameRankViolation;
				if (!isEmptyOrNull(condType) && !isEmptyOrNull(condName))
					addStdCondition(condType, condName);
			}//result !empty
		}//enforceRank

		//validateSpecialties
		if (rules.action.enforceSpecialty) {
			var specialityResult = isValidSpeciality(rules, dporRespObj.respObj);
			if (specialityResult != "") {
				var condType = rules.action.conditionTypeSpecialtyViolation;
				var condName = rules.action.conditionNameSpecialtyViolation;
				if (!isEmptyOrNull(condType) && !isEmptyOrNull(condName))
					addStdCondition(condType, condName);
			}//result !empty
		}//enforceSpecialty
	}//for all LPs on cap
}

function updateLicenseProffs(rules, dporRespObj, capLpItem) {

	var licenseNbr = capLpItem.getLicenseNbr();
	var licType = capLpItem.getLicenseType();

	var refLicScriptModel = null;
	var result = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(), licenseNbr);
	if (result.getSuccess()) {
		var tmp = result.getOutput();
		for (lic in tmp) {
			refLicScriptModel = tmp[lic];
			break;
		}
	}

	//Update/Create Ref License From DPOR:
	if (refLicScriptModel != null) {
		refLicScriptModel = fillLicenseScriptModelFromDpor(rules,refLicScriptModel, dporRespObj);
		var editResult = aa.licenseScript.editRefLicenseProf(refLicScriptModel);
		if (!editResult.getSuccess()) {
			logDebug("**WARN update Ref license from DPOR failed " + editResult.getErrorMessage());
		}
	} else {
		var refLicScriptModel = aa.licenseScript.createLicenseScriptModel();
		refLicScriptModel.setAgencyCode(aa.getServiceProviderCode());
		refLicScriptModel.setAuditDate(sysDate);
		refLicScriptModel.setAuditID(currentUserID);
		refLicScriptModel.setAuditStatus("A");
		refLicScriptModel.setLicenseType(licType);
		refLicScriptModel.setStateLicense(licenseNbr);
		refLicScriptModel = fillLicenseScriptModelFromDpor(rules,refLicScriptModel, dporRespObj);
		var createResult = aa.licenseScript.createRefLicenseProf(refLicScriptModel);
		if (!createResult.getSuccess()) {
			logDebug("**WARN create new license failed " + createResult.getErrorMessage());
		}else{
			capLpItem.getLicenseProfessionalModel().setLicSeqNbr(refLicScriptModel.getLicSeqNbr());
		}
		
	}

	//Update Cap License From DPOR:
	capLpItem = fillLicenseScriptModelFromDpor(rules,capLpItem, dporRespObj);
	var editResult = aa.licenseProfessional.editLicensedProfessional(capLpItem);
	if (!editResult.getSuccess()) {
		logDebug("**WARN edit cap license failed " + editResult.getErrorMessage());
	}

	//Update License: Ref from Cap or Vice versa
	if (rules.action.lpUpdateRefFromCap) {

		var doUpdate = true;

		//check if cap status matches
		var reqCapStatusArray = rules.action.lpUpdateRefFromCapRecordStatus;
		if (reqCapStatusArray && reqCapStatusArray.length > 0) {
			doUpdate = arrayContainsValue(reqCapStatusArray, cap.getCapStatus());
		}

		if (refLicScriptModel != null && doUpdate) {
			refLicScriptModel.setFax(capLpItem.getFax());
			refLicScriptModel.setPhone1(capLpItem.getPhone1());
			refLicScriptModel.setPhone2(capLpItem.getPhone2());
			refLicScriptModel.setEMailAddress(capLpItem.getEmail());
			var editResult = aa.licenseScript.editRefLicenseProf(refLicScriptModel);
			if (!editResult.getSuccess()) {
				logDebug("**WARN Edit Ref From Cap LP Failed, Error: " + editResult.getErrorMessage());
			}
		}
	} else {
		if (rules.action.lpUpdateCapFromRef) {
			if (refLicScriptModel != null) {
				capLpItem.setFax(refLicScriptModel.getFax());
				capLpItem.setPhone1(refLicScriptModel.getPhone1());
				capLpItem.setPhone2(refLicScriptModel.getPhone2());
				capLpItem.setEmail(refLicScriptModel.getEMailAddress());
				var editResult = aa.licenseProfessional.editLicensedProfessional(capLpItem);
				if (!editResult.getSuccess()) {
					logDebug("**WARN edit cap license failed " + editResult.getErrorMessage());
				}
			}
		}//if lpUpdateCapFromRef
	}//updateCapFromRef
	
	var primaryFlag =capLpItem.getPrintFlag();
	updateTemplateAttribute(capLpItem,dporRespObj,primaryFlag);
	updateCustomFields(capLpItem,dporRespObj,primaryFlag);
}

/**
 * fill License object from DPOR response using default fields mapping, or using (DPOR_FIELD_MAPPING) config if set
 */
function fillLicenseScriptModelFromDpor(rules,lpScrModel, dporSoapResp) {
	if (lpScrModel == null || dporSoapResp == null) {
		return lpScrModel;
	}

	
	var rankMapped ;
	if(rules.action.hasOwnProperty("useValueForRankMap")){
		if(!rules.action.useValueForRankMap){
			rankMapped = lookup("DPOR_RATE_MAPPING", dporSoapResp.respObj.rank);
		}
	}else{
		rankMapped = lookup("DPOR_RATE_MAPPING", dporSoapResp.respObj.rank);
	}
	
	if (!rankMapped) {
		rankMapped = dporSoapResp.respObj.rank;
	}

	//load once (better performance)
	if (fieldsMapping == null) {
		fieldsMapping = aa.bizDomain.getBizDomain("DPOR_FIELD_MAPPING");
		if (fieldsMapping.getSuccess()) {
			fieldsMapping = fieldsMapping.getOutput().toArray();
		} else {
			logDebug("**WARN lookup 'DPOR_FIELD_MAPPING' error: " + fieldsMapping.getErrorMessage());
		}
	}//fieldsMapping = null

	if (fieldsMapping.length > 0) {
		return fillLicenseScriptModelFromDporConfMapping(lpScrModel, dporSoapResp, rankMapped, fieldsMapping, "dporSoapResp.respObj.");
	}

	lpScrModel.setLicenseBoard(dporSoapResp.respObj.boardNme);
	lpScrModel.setContactFirstName(dporSoapResp.respObj.fName);
	lpScrModel.setContactMiddleName(dporSoapResp.respObj.mName);
	lpScrModel.setContactLastName(dporSoapResp.respObj.lName);
	lpScrModel.setBusinessName(dporSoapResp.respObj.busName);

	lpScrModel.setAddress1(dporSoapResp.respObj.address1);
	lpScrModel.setAddress2(dporSoapResp.respObj.address2);

	lpScrModel.setCity(dporSoapResp.respObj.city);
	lpScrModel.setState(dporSoapResp.respObj.state);
	lpScrModel.setZip(dporSoapResp.respObj.zip);
	if (lpScrModel.getClass().toString().indexOf("LicenseScriptModel") != -1) {
		lpScrModel.getLicenseModel().setSalutation(rankMapped);
		lpScrModel.getLicenseModel().setComment(dporSoapResp.respObj.comments);
		lpScrModel.getLicenseModel().setTitle(dporSoapResp.respObj.licStatus);
		lpScrModel.getLicenseModel().setBirthDate(convertDate(dporSoapResp.respObj.expireDate));
		lpScrModel.setBusinessName2(dporSoapResp.respObj.DBATradeName);
		lpScrModel.setLicState(dporSoapResp.respObj.state);
	} else if (lpScrModel.getClass().toString().indexOf("LicenseProfessionalScriptModel") != -1) {
		lpScrModel.setBusName2(dporSoapResp.respObj.DBATradeName);
		lpScrModel.getLicenseProfessionalModel().setSalutation(rankMapped);
		lpScrModel.getLicenseProfessionalModel().setComment(dporSoapResp.respObj.comments);
		lpScrModel.getLicenseProfessionalModel().setTitle(dporSoapResp.respObj.licStatus);
		var tmpDt = aa.date.getScriptDateTime(aa.util.parseDate(dporSoapResp.respObj.expireDate));
		lpScrModel.setBirthDate(tmpDt);
	}

	return lpScrModel;
}

/**
 * fill License object from DPOR response based on configured mapping standard choice (DPOR_FIELD_MAPPING)
 */
function fillLicenseScriptModelFromDporConfMapping(lpScrModel, dporSoapResp, rankMapped, fieldsMapping, respObjectPrefix) {
	for (b in fieldsMapping) {
		if (fieldsMapping[b].getAuditStatus() == "A") {
			var accelaLbl = fieldsMapping[b].getBizdomainValue();
			if(!accelaLbl.toLowerCase().startsWith("$$peopleattribute$$") 
				&& !accelaLbl.toLowerCase().startsWith("$$customattribute$$ "))
			{
				var apiField = fieldsMapping[b].getDescription();

				var setterMethod = getAccelaSetter(accelaLbl);
				var getterMethod = getApiGetter(apiField, respObjectPrefix);

				if (!isEmptyOrNull(setterMethod) && !isEmptyOrNull(getterMethod)) {

					var specialSetter = getSecialSetter(setterMethod, lpScrModel);

					var evalString = "";
					if (specialSetter == "") {
						if(setterMethod=="setState"){
							if (lpScrModel.getClass().toString().indexOf("LicenseScriptModel") != -1) {
								var evaledVal = eval(getterMethod);
								lpScrModel.setLicState(evaledVal);
							}
						}
						evalString = "lpScrModel." + setterMethod + "(" + getterMethod + ");";
					} else {
						if (setterMethod == "setBirthDate") {
							if (lpScrModel.getClass().toString().indexOf("LicenseScriptModel") != -1) {
								evalString = "lpScrModel." + specialSetter + "(convertDate(" + getterMethod + "));";
							} else if (lpScrModel.getClass().toString().indexOf("LicenseProfessionalScriptModel") != -1) {
								var evaledVal = eval(getterMethod);
								var tmpDt = aa.date.getScriptDateTime(aa.util.parseDate(evaledVal));
								evalString = "lpScrModel." + specialSetter + "(tmpDt);";
							}
						} else if (setterMethod == "setSalutation") {
							evalString = "lpScrModel." + specialSetter + "(rankMapped);";
						} else {//birthDate
							evalString = "lpScrModel." + specialSetter + "(" + getterMethod + ");";
						}
						evalString = evalString + " // -- SPECIAL";
					}
					eval(evalString);
				} else {
					logDebug("**WARN failed to load config for item: " + fieldsMapping[b].getBizdomainValue() + "/" + fieldsMapping[b].getDescription());
				}//mapping !OK
			}// Is not template attribute or custom field
		}//is Active
	}//for all entries
	return lpScrModel;
}

/**
 * get setter method name for special fields, special field because property setter may change, sub-model getter may change, parameter type may change
 * @param setterMethod
 * @param lpScrModel
 * @returns {String} special setter method name, or empty string if method is not special
 */
function getSecialSetter(setterMethod, lpScrModel) {
	if (lpScrModel.getClass().toString().indexOf("LicenseScriptModel") != -1) {
		if (setterMethod == "setSalutation") {
			return "getLicenseModel().setSalutation";
		} else if (setterMethod == "setComment") {
			return "getLicenseModel().setComment";
		} else if (setterMethod == "setTitle") {
			return "getLicenseModel().setTitle";
		} else if (setterMethod == "setBirthDate") {
			return "getLicenseModel().setBirthDate";
		} else if (setterMethod == "setBusinessName2") {
			return "setBusinessName2";
		} else {
			return "";
		}
	} else if (lpScrModel.getClass().toString().indexOf("LicenseProfessionalScriptModel") != -1) {

		if (setterMethod == "setSalutation") {
			return "getLicenseProfessionalModel().setSalutation";
		} else if (setterMethod == "setComment") {
			return "getLicenseProfessionalModel().setComment";
		} else if (setterMethod == "setTitle") {
			return "getLicenseProfessionalModel().setTitle";
		} else if (setterMethod == "setBirthDate") {
			return "setBirthDate";
		} else if (setterMethod == "setBusinessName2") {
			return "setBusName2";
		} else {
			return "";
		}
	}
}

/**
 * returns accela object setter method name based on label
 * @param label
 * @returns setter name or null
 */
function getAccelaSetter(label) {
	var ACCELA_SETTER = new Array();
	//ACCELA_SETTER['License Type'] = 'LicenseType';
	//ACCELA_SETTER['State License # (License #)'] = 'LicenseNbr';
	ACCELA_SETTER['DPOR Exp Date (Birth Date)'] = 'BirthDate';
	ACCELA_SETTER['DPOR Status (Title)'] = 'Title';
	ACCELA_SETTER['Licensing Board'] = 'LicenseBoard';
	ACCELA_SETTER['First Name'] = 'ContactFirstName';
	ACCELA_SETTER['Middle Name'] = 'ContactMiddleName';
	ACCELA_SETTER['Last Name'] = 'ContactLastName';
	ACCELA_SETTER['Business Name'] = 'BusinessName';
	ACCELA_SETTER['DBA/Trade Name (Business Name 2)'] = 'BusinessName2';
	ACCELA_SETTER['Address Line 1'] = 'Address1';
	ACCELA_SETTER['Address Line 2'] = 'Address2';
	ACCELA_SETTER['City'] = 'City';
	ACCELA_SETTER['State'] = 'State';
	ACCELA_SETTER['ZipCode'] = 'Zip';
	ACCELA_SETTER['Rank/ Contractor Class (Salutation)'] = 'Salutation';
	ACCELA_SETTER['Specialties (Comments)'] = 'Comment';

	if (!ACCELA_SETTER[label]) {
		return null;
	}
	return "set" + ACCELA_SETTER[label];
}

/**
 * returns API field name based on API label
 * @param label
 * @param respObjectPrefix response object and sub object string to be appended to field name, ex 'soapRes.respObj'
 * @returns
 */
function getApiGetter(label, respObjectPrefix) {
	var API_FIELD = new Array();
	//API_FIELD['<Set by user>'] = '';
	//API_FIELD['license.licNbr'] = 'licNbr';
	API_FIELD['license.exprDte'] = 'expireDate';
	API_FIELD['license.licStaDesc'] = 'licStatus';
	API_FIELD['license.boardNme'] = 'boardNme';
	API_FIELD['license.addr.firstNme'] = 'fName';
	API_FIELD['license.addr.middleNme'] = 'mName';
	API_FIELD['license.addr.lastNme'] = 'lName';
	API_FIELD['license.addr.keyNme'] = 'busName';
	API_FIELD['license.addr.dba'] = 'DBATradeName';
	API_FIELD['license.addr.strAddrNbr'] = 'address1';
	API_FIELD['license.addr.addrLine1'] = 'address1';
	API_FIELD['license.addr.addrLine2'] = 'address2';
	API_FIELD['license.addr.addrCty'] = 'city';
	API_FIELD['license.addr.stCde'] = 'state';
	API_FIELD['license.addr.addrZip'] = 'zip';
	API_FIELD['license.rankCde'] = 'rank';
	API_FIELD['specialty.modDesc'] = 'comments';
	if (!API_FIELD[label]) {
		return null;
	}
	return respObjectPrefix + API_FIELD[label];
}

/**
 * Validate if required Specialities are available on the LP (using DPOR response data)
 * @param rules JSON rules item
 * @param dporRespObj dpor response Soap Result
 * @returns {String} empty string if valid, an error message otherwise
 */
function isValidSpeciality(rules, dporRespObj) {
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
	if (rules.action.enforceStatus) {
		//check if reject by status rejectLpWithStatuses
		var rejectByStatus = rules.action.rejectLpWithStatuses;
		for (s in rejectByStatus) {
			if (rejectByStatus[s] == dporRespObj.licStatus) {
				var condType = rules.action.conditionTypeStatusViolation;
				var condName = rules.action.conditionNameStatusViolation;
				if (!isEmptyOrNull(condType) && !isEmptyOrNull(condName))
					addStdCondition(condType, condName);
				return "The Status of this contractor's License " + rejectByStatus[s] + " is not permited for this work";
			}
		}//for all rejectLpWithStatuses
	}

	if (rules.action.enforceExpiry) {
		//check if reject by expiration days remaining rejectLpExpiresWithinDays
		var expDate = dporRespObj.expireDate;
		var daysToExpire = dateDiff(aa.util.now(), expDate);
		daysToExpire = Math.ceil(daysToExpire);

		if (rules.action.rejectLpExpiresWithinDays >= daysToExpire) {
			var condType = rules.action.conditionTypeExpiryViolation;
			var condName = rules.action.conditionNameExpiryViolation;
			if (!isEmptyOrNull(condType) && !isEmptyOrNull(condName))
				addStdCondition(condType, condName);
			return "This contractor's License will expire within " + rules.action.rejectLpExpiresWithinDays + " Days";
		}
	}

	return "";
}
/**
 * Updates tempate attribute
 * @param lpItem license professional item
 * @param dporSoapResp dpor response Soap Result
 * @returns {Boolean}
 */
function updateTemplateAttribute(lpItem,dporSoapResp,primaryFlag) {
	var attributeMapping = getTemplateAttributeMapping(dporSoapResp)
	var attributeMappingKeys = Object.keys(attributeMapping);
	if(attributeMappingKeys.length == 0 ){
		return false;
	}
	lpLicSeqNbr = lpItem.getLicenseProfessionalModel().getLicSeqNbr();
	lpLicNbr = lpItem.getLicenseNbr();
	lpLicSeqNbr = lpLicSeqNbr * 1;
	
	if (lpLicSeqNbr == null) {
		logDebug("**WARN updateTemplateAttribute() could not find license of type= " + refLicType + " recordID=" + itemCapId.getCustomID());
		return false;
	}
	var refLP = aa.licenseScript.getRefLicenseProfBySeqNbr(aa.getServiceProviderCode(), lpLicSeqNbr);
	if (!refLP.getSuccess()) {
		logDebug("**WARN updateTemplateAttribute() failed to get Ref-LP, error: " + refLP.getErrorMessage());
		return false;
	}
	refLP = refLP.getOutput();
	var contactAttrModels = refLP.getPeopleAttributeScriptModels();
	for ( var c in contactAttrModels) {
		contactAttrModel = contactAttrModels[c];
		var attributeName = contactAttrModel.getAttributeName().toLowerCase();
		if(exists(attributeName,attributeMappingKeys)){
			var evalString = attributeMapping[attributeName];
			var attributeValue = eval(evalString);
			contactAttrModel.setAttributeValue(attributeValue);
		}		
	}//tempalte fields loop

	if(primaryFlag.toUpperCase()=="Y"){
		lpItem.setPrintFlag("N");
		aa.licenseProfessional.editLicensedProfessional(lpItem);
	}
	aa.licenseScript.editRefLicenseProf(refLP);

	var licProObj = new licenseProfObject(lpLicNbr, lpItem.getLicenseType());
	licProObj.copyToRecord(capId, true);
	
	updatePrimaryFlagForLicProf(lpLicNbr,lpItem.getLicenseType(),primaryFlag);
	return true;
}
function updatePrimaryFlagForLicProf(lpLicNbr,lpType,primaryFlag,vCapId)
{
			var itemCap = (vCapId) ? vCapId : capId;

			var capLicenseResult = aa.licenseProfessional.getLicenseProf(itemCap);
			var capLicenseArr = new Array();
			if (capLicenseResult.getSuccess()) {
				capLicenseArr = capLicenseResult.getOutput();
			}

			if (capLicenseArr != null) {
				for (capLic in capLicenseArr) {
					if (capLicenseArr[capLic].getLicenseNbr() + "" == lpLicNbr + ""
						 && capLicenseArr[capLic].getLicenseType() + "" == lpType + "") {
						 capLicenseArr[capLic].setPrintFlag(primaryFlag);
							aa.licenseProfessional.editLicensedProfessional(capLicenseArr[capLic]);
					 }
				 }
			 }
						 
}
/**
 * Updates tempate attribute
 * @param lpItem license professional item
 * @param dporSoapResp dpor response Soap Result
 * @returns {Boolean}
 */
function updateCustomFields(lpItem,dporSoapResp,primaryFlag) {
	var attributeMapping = getCustomFieldsMapping(dporSoapResp)
	var attributeMappingKeys = Object.keys(attributeMapping);
	if(attributeMappingKeys.length == 0 ){
		return false;
	}
	
	lpLicSeqNbr = lpItem.getLicenseProfessionalModel().getLicSeqNbr();
	lpLicNbr = lpItem.getLicenseNbr();
	lpLicSeqNbr = lpLicSeqNbr * 1;
		
	if (lpLicSeqNbr == null) {
		logDebug("**WARN updateCustomFields() could not find license of type= " + refLicType + " recordID=" + itemCapId.getCustomID());
		return false;
	}
	
	for(i in attributeMappingKeys){
		var attrName = attributeMappingKeys[i];
		var evalString =attributeMapping[attrName];
		var attributeValue = eval(evalString);
		editReflPTemplateFields(lpLicNbr, attrName,attributeValue)
	}
	var refLP = aa.licenseScript.getRefLicenseProfBySeqNbr(aa.getServiceProviderCode(), lpLicSeqNbr);
	if (!refLP.getSuccess()) {
		logDebug("**WARN updateCustomFields() failed to get Ref-LP, error: " + refLP.getErrorMessage());
		return false;
	}
	if(primaryFlag.toUpperCase()=="Y"){
		lpItem.setPrintFlag("N");
		aa.licenseProfessional.editLicensedProfessional(lpItem);
	}

	refLP = refLP.getOutput();
	aa.licenseScript.editRefLicenseProf(refLP);
	
	var licProObj = new licenseProfObject(lpLicNbr, lpItem.getLicenseType());
	licProObj.copyToRecord(capId, true);
	updatePrimaryFlagForLicProf(lpLicNbr,lpItem.getLicenseType(),primaryFlag);
	return true;
	
}

function getCustomFieldsMapping(dporSoapResp) {
	var data = {};
	var fieldsMapping = aa.bizDomain.getBizDomain("DPOR_FIELD_MAPPING");
	if (fieldsMapping.getSuccess()) {
		fieldsMapping = fieldsMapping.getOutput().toArray();
	} else {
		logDebug("**WARN lookup 'DPOR_FIELD_MAPPING' error: " + fieldsMapping.getErrorMessage());
		return data;
	}
	for (b in fieldsMapping) {
		if (fieldsMapping[b].getAuditStatus() == "A") {
			var accelaLbl = fieldsMapping[b].getBizdomainValue();
			if(accelaLbl.toLowerCase().startsWith("$$customattribute$$") )
			{
				var apiField = fieldsMapping[b].getDescription();
				accelaLbl = accelaLbl.substring(20);
				
				var getterMethod = getApiGetter(apiField, "dporSoapResp.respObj.");
				if (!isEmptyOrNull(getterMethod)) {
					data[accelaLbl] = getterMethod;
				} else {
					logDebug("**WARN failed to load config for item: " + fieldsMapping[b].getBizdomainValue() + "/" + fieldsMapping[b].getDescription());
				}//mapping !OK
			} // is a people attribute
		}//is Active
	}//for all entries
	return data;
}
function getTemplateAttributeMapping( dporSoapResp) {
	var data = {};
	var fieldsMapping = aa.bizDomain.getBizDomain("DPOR_FIELD_MAPPING");
	if (fieldsMapping.getSuccess()) {
		fieldsMapping = fieldsMapping.getOutput().toArray();
	} else {
		logDebug("**WARN lookup 'DPOR_FIELD_MAPPING' error: " + fieldsMapping.getErrorMessage());
		return data;
	}
	for (b in fieldsMapping) {
		if (fieldsMapping[b].getAuditStatus() == "A") {
			var accelaLbl = fieldsMapping[b].getBizdomainValue();
			if(accelaLbl.toLowerCase().startsWith("$$peopleattribute$$") )
			{
				var apiField = fieldsMapping[b].getDescription();
				accelaLbl = accelaLbl.toLowerCase().replace("$$peopleattribute$$.","");
				
				//var setterMethod = getAccelaSetter(accelaLbl);
				var getterMethod = getApiGetter(apiField, "dporSoapResp.respObj.");
				if (!isEmptyOrNull(getterMethod)) {
					data[accelaLbl] = getterMethod;
				} else {
					logDebug("**WARN failed to load config for item: " + fieldsMapping[b].getBizdomainValue() + "/" + fieldsMapping[b].getDescription());
				}//mapping !OK
			} // is a people attribute
		}//is Active
	}//for all entries
	return data;
}

/**
 * validate license rank with Job Value of record.
 * @param rules JSON rules item
 * @param dporRespObj dpor response Soap Result
 * @returns {String} empty string if valid, an error message otherwise
 */
function isValidRank(rules, dporRespObj) {
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

function editReflPTemplateFields(licenseNumber, fieldName, fieldValue) {
	var licObj = getRefLicenseProf(licenseNumber);
	if (licObj != null)
		var refLicenseObject = aa.licenseScript.getRefLicenseProfBySeqNbr("", licObj.getLicSeqNbr()).getOutput();
	if (refLicenseObject != null) {
		var template = refLicenseObject.getLicenseModel().getTemplate();
		if (template != null && template != "") {
			var formGroupsObj = template.getTemplateForms();
			var formGroupsObjtemp = template.getTemplateForms();
			var formGroups = formGroupsObj.toArray()
			for (grp in formGroups) {
				if (formGroups[grp] != null) {
					var subgroupsObj = formGroups[grp].getSubgroups();
					var subgroupsObjlist = formGroups[grp].getSubgroups();
					if (subgroupsObj != null) {
						var subgroups = subgroupsObj.toArray();
						for (sgrp in subgroups) {
							var sgrpName = subgroups[sgrp].getSubgroupName();
							var fields = subgroups[sgrp].getFields().toArray();
							var templateFields = subgroups[sgrp].getFields();
							templateFields.clear();
							for (fld in fields) {
								if (fields[fld].getFieldName() == fieldName) {
												fields[fld].setDefaultValue(fieldValue);
								}
								templateFields.add(fields[fld]);
							}
							subgroups[sgrp].setFields(templateFields);
							subgroupsObjlist.add(subgroups[sgrp]);
						}
						template.setTemplateForms(formGroupsObjtemp);
					} else {
						logDebug("group code is not exists");
					}
				} else {
					logDebug("formGroups[grp] is null ");
				}
			}
			refLicenseObject.getLicenseModel().setTemplate(template);
			aa.licenseScript.editRefLicenseProf(refLicenseObject);
		} else {
			logDebug("there is no template assigned to this license " + licenseNumber);
		}
	} else {
		logDebug("there is no reference license linked to this license " + licenseNumber);
	}
}

