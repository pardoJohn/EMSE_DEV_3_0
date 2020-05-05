/**
 * STDBASE_BATCH_LIEN_PROCESS
 * This batch script will find records with a CF Next Notification Date = Today
 * DEPENDENCIES:
- THIS BATCH SCRIPT
- BATCH CONFIGURATION SCRIPT(S): CONF_LICENSING_LICENSE_EXPIRATION_NOTICE
- BATCH RESULT NOTIFICATION TEMPLATE:  BATCH_LICENSE_RENEWAL_RESULTS
- ASI SUBGROUP: RENEWAL INFO (NEXT NOTIFICATION, NEXT NOTIFICATION DATE)
	** Update the Next Notification DDL values to match the notification frequencies in
		CONF_LIC_RENEWAL
- SET TYPE: RENEWAL
- SET STATUSES: Open, Ready for Mailing, Completed
- Set Saved Search: Renewal Mass Mailer - Open, Renewal Mass Mailer - Ready for Mailing, Renewal Mass Mailer - Completed
 */

//setValue was on script already, i added this to make it as Default (if not provided by batch parameters from UI)
if (aa.env.getValue("confScriptName") == null || aa.env.getValue("confScriptName") == "") {
	aa.env.setValue("confScriptName", "CONF_BATCH_LIEN_SEARCH");
}
var confScriptName = aa.env.getValue("confScriptName");

var batchProcess = "Batch Lien Process"
var publicUser = "";
var useAppSpecificGroupName = false;
var currentUserID = aa.getAuditID();
aa.env.setValue("CurrentUserID", "ADMIN");
if (currentUserID != null) {
	systemUserObj = aa.person.getUser(currentUserID).getOutput(); // Current User Object
}
var br = "\n";
var startDate = new Date();
var startTime = startDate.getTime();
emailText = "";

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

eval(getScriptText("INCLUDES_RECORD"));
eval(getScriptText("INCLUDES_BASEBATCH"));

Batch.prototype.execute = function() {
	try {
		//execute main()
		if (!confScriptName) {
			logDebug("ERROR: Missing required batch parameter confScriptName: " + confScriptName);
			return false;
		}
		processRecords(confScriptName);

	} catch (e) {
		this.log("ERROR: ", e + "");
	}

}
run();

// end user code
aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", message);
if (showDebug)
	aa.env.setValue("ScriptReturnMessage", debug);

/**
 * processExpiration
 * 
 * @param {*} confScriptName 
 */
function processRecords(confSearchScriptName) {

	try {

		// get configuration
		var searchRuleConf = "batchLienSearch";
		logDebug("Using Search Rule: " + searchRuleConf + " in " + confSearchScriptName);
		var cfgJsonStr = getScriptText(confSearchScriptName);
		var searchRules = JSON.parse(cfgJsonStr)
		if (!searchRules) {
			logDebug("ERROR: Search rules not found. Script Name: " + confSearchScriptName);
			return false;
		}

		var ruleSet = searchRules[searchRuleConf];
		var thisSearchRule = ruleSet["searchCriteria"];

		//prepare search rule parameters
		var searchByRecordGroup = thisSearchRule.searchByRecordGroup;
		var searchByRecordType = thisSearchRule.searchByRecordType;
		var searchByRecordSubType = thisSearchRule.searchByRecordSubType;
		var searchByRecordCategory = thisSearchRule.searchByRecordCategory;
		var searchStatus = thisSearchRule.searchStatus;
		var fromDate = thisSearchRule.searchByFromDate;
		var toDate = thisSearchRule.searchByToDate;
		var lookAheadDays = 0;
		var searchDays = thisSearchRule.searchByDaysOut;
		var notificationConfScript = thisSearchRule.notificationConfScript;

		var nextDateField = null;
		if (thisSearchRule.hasOwnProperty("nextDateField") && thisSearchRule.nextDateField != null && thisSearchRule.nextDateField != "") {
			nextDateField = thisSearchRule.nextDateField;
		} else {
			nextDateField = "PAYMENT NOTICE.Next Notification Date";
		}
		var nextNotificationField = thisSearchRule.nextNotificationField;

		/**
		 * TO DO:
		 * 		1) Ability to disable this logging
		 */
		logDebug("searchByRecordGroup: " + searchByRecordGroup);
		logDebug("searchByRecordType: " + searchByRecordType);
		logDebug("searchByRecordSubType: " + searchByRecordSubType);
		logDebug("searchByRecordCategory: " + searchByRecordCategory);
		logDebug("searchStatus: " + searchStatus);
		logDebug("fromDate: " + fromDate);
		logDebug("toDate: " + toDate);
		logDebug("searchDays: " + searchDays);
		logDebug("notificationConfScript: " + notificationConfScript);

		logDebug("nextDateField: " + nextDateField);
		logDebug("nextNotificationField: " + nextNotificationField);

		if ((nextDateField && nextDateField.indexOf(".") == -1) || (nextNotificationField && nextNotificationField.indexOf(".") == -1)) {
			logDebug("**WARN invalid value for parameters nextDateField and nextNotificationField, correct value: SUBGROUP_NAME.FIELD_NAME");
			return false;
		}

		/**
		 * TO DO: 
		 * 		1) Add validation for params from rules
		 */

		// calculate from and to dates if searchDays is used
		if (!fromDate || fromDate.length < 10) // no "from" date, assume today + number of days to look ahead
			fromDate = dateAdd(null, parseInt(lookAheadDays))

		if (!toDate || toDate.length < 10) { // no "to" date, assume today + number of look ahead days + span
			toDate = dateAdd(null, parseInt(lookAheadDays) + parseInt(searchDays));
		}
		logDebug("Date Range -- fromDate: " + fromDate + ", toDate: " + toDate)

		/**
		 * TO DO:
		 * 		1) CHANGE EMSE API WHEN NEW API IS AVAILABLE WITH CAP MODEL
		 * 		2) BUILD CAP MODEL TO USE IN SEARCH: use searchByRecord_ to build capModel
		 *
		 * 
		 * EXAMPLE:
		 * 
		 * 		var searchResult = aa.expiration.getLicensesByDateAndModel(capModel, searchStatus, fromDate, toDate);
		 */

		// execute record search
		var fromDate = aa.date.parseDate(fromDate);
		var toDate = aa.date.parseDate(toDate);
		var nextDateFiledInfo = nextDateField.split(".");
		var searchResult = aa.cap.getCapIDsByAppSpecificInfoDateRange(nextDateFiledInfo[0], nextDateFiledInfo[1], fromDate, toDate);
		if (searchResult.getSuccess()) {
			searchResultArray = searchResult.getOutput();
			logDebug("Processing " + searchResultArray.length + " records");
		} else {
			logDebug("ERROR: Getting Records, reason is: " + searchResult.getErrorType() + ":" + searchResult.getErrorMessage());
			return false
		}

		// if records were found, execute processBatchNotification
		if (searchResultArray.length > 0) {

			// get JSON notification rules script
			var cfgNoticeJsonStr = getScriptText(notificationConfScript);
			var noticeRules = JSON.parse(cfgNoticeJsonStr)
			if (!noticeRules) {
				logDebug("ERROR: Cannot find configuration rules for notifications. Script: " + notificationConfScript);
				return false;
			}

			processBatchNotification(searchResultArray, thisSearchRule, noticeRules);
		}

	} catch (e) {
		logDebug("ERROR: " + e + "");
	}
}
