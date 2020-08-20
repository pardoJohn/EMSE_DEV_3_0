/*------------------------------------------------------------------------------------------------------/
| Program: BATCH_EXPIRATION
| Client:  Marion
|
| Version 1.0 - Base Version. 
|
| Script to run nightly to send notice of license expiring or to expire the license
|  
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var emailText = "";   
var errLog = "";
var debugText = "";
var showDebug = true;	
SENDEMAILS = true;	
sepMsg="VFP";
var showMessage = false;
var message = "";
var br = "<br>";
var useAppSpecificGroupName = false;
var publicUser = false;
/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID()
batchJobName = "" + aa.env.getValue("BatchJobName");
wfObjArray = null;
debug="";
currentUserID="ADMIN";

eval(getMasterScriptText("INCLUDES_ACCELA_FUNCTIONS"));
//eval(getScriptText("INCLUDES_BATCH"));
eval(getMasterScriptText("INCLUDES_CUSTOM"));

override = "function logDebug(dstr){ if(showDebug) { aa.print(dstr); emailText+= dstr + \"<br>\"; } }";
eval(override);

function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";
}
	
function getMasterScriptText(vScriptName) {
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
    return emseScript.getScriptText() + "";
}


/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
/* test params
 */
aa.env.setValue("ModuleName", "EnvHealth");
aa.env.setValue("BatchJobID", "ALL_BATCHES");
aa.env.setValue("BatchJobID", "About_To_Expire_Pumper_Trk_Permit,Expired_Pumper_Trk,Delinquent_Pumper_Trk");
aa.env.setValue("BatchJobID", "About_To_Expire_Small_Water");
aa.env.setValue("BatchJobID", "About_To_Expire");

batchJobResult = aa.batchJob.getJobID()
batchJobName = "" + aa.env.getValue("BatchJobName");
if (batchJobResult.getSuccess())
  {
  batchJobRes = batchJobResult.getOutput();
  //logDebug("!!!VOTE FOR PEDRO THIRD UPDATE!!!!");
  logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobRes);
  }
else{
  logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());
}


/* test parameters 
aa.env.setValue("lookAheadDays", "0");
aa.env.setValue("daySpan", "0");
aa.env.setValue("gracePeriodDays", "0");
aa.env.setValue("recordGroup", "EnvHealth");
aa.env.setValue("recordType", "Food");
aa.env.setValue("recordSubType", "*");
aa.env.setValue("recordCategory", "Permit");
aa.env.setValue("expirationStatus", "About to Expire");
aa.env.setValue("newExpirationStatus", "Expired");
aa.env.setValue("newApplicationStatus", "Expired");
aa.env.setValue("createNotifySets", "Y");
aa.env.setValue("setType", "Renewal");
aa.env.setValue("setStatus", "New");
aa.env.setValue("setPrefix", "AnnFoodLicRenew");
aa.env.setValue("skipAppStatusArray", "Denied,Withdrawn,Disqualified,Inactive,Revoked,Suspended");
aa.env.setValue("emailAddress", "lwacht@septechconsulting.com");
aa.env.setValue("sendEmailToContactTypes", "");
aa.env.setValue("emailTemplate","");
aa.env.setValue("sysFromEmail", "no_reply@septechconsulting.com");
aa.env.setValue("sendEmailNotifications","N");
aa.env.setValue("reportName", "");
aa.env.setValue("taskToAssign", "");
aa.env.setValue("assignTaskTo", "");
aa.env.setValue("setParentWorkflowTaskAndStatus", "");
aa.env.setValue("respectNotifyPrefs", "Y");

aa.env.setValue("paramStdChoice", "EH_FOOD_RENEW_DELINQ_CONFIG");
 
var paramStdChoice = getJobParam("paramStdChoice")  // use this standard choice for parameters instead of batch jobs
var fromDate = getJobParam("fromDate"); // Hardcoded dates.   Use for testing only
var toDate = getJobParam("toDate"); // ""
var lookAheadDays = getJobParam("lookAheadDays");
var daySpan = getJobParam("daySpan");
var appGroup = getJobParam("recordGroup");
var appTypeType = getJobParam("recordType");
var appSubtype = getJobParam("recordSubType");
var appCategory = getJobParam("recordCategory");
var expStatus = getJobParam("expirationStatus"); //   test for this expiration status
var newExpStatus = getJobParam("newExpirationStatus"); //   update to this expiration status
var newAppStatus = getJobParam("newApplicationStatus"); //   update the CAP to this status
var setPrefix = getJobParam("setPrefix");
var gracePeriodDays = getJobParam("gracePeriodDays"); //	bump up expiration date by this many days
var inspSched = getJobParam("inspSched"); //   Schedule Inspection
var skipAppStatusArray = getJobParam("skipAppStatus").split(","); //   Skip records with one of these application statuses
var emailAddress = getJobParam("emailAddress"); // email to send report
var sendEmailToContactTypes = getJobParam("sendEmailToContactTypes"); // ALL,PRIMARY, or comma separated values
var emailTemplate = getJobParam("emailTemplate"); // email Template
var taskToAssign = getJobParam("taskToAssign"); 
var assignTaskTo = getJobParam("assignTaskTo"); 
var deactivateLicense = getJobParam("deactivateLicense").substring(0, 1).toUpperCase().equals("Y"); // deactivate the LP
var lockParentLicense = getJobParam("lockParentLicense").substring(0, 1).toUpperCase().equals("Y"); // add this lock on the parent license
var createRenewalRecord = getJobParam("createTempRenewalRecord").substring(0, 1).toUpperCase().equals("Y"); // create a temporary record
var feeSched = getJobParam("feeSched"); //
var feeList = getJobParam("feeList"); // comma delimted list of fees to add to renewal record
var feePeriod = getJobParam("feePeriod"); // fee period to use {LICENSE}
var parentFeeSched = getJobParam("parentFeeSched"); //
var parentFeeList = getJobParam("parentFeeList"); // comma delimted list of fees to add to renewal record
var parentFeePeriod = getJobParam("parentFeePeriod"); // fee period to use {LICENSE}
var respectNotifyPrefs = getJobParam("respectNotifyPrefs").substring(0, 1).toUpperCase().equals("Y"); // respect contact notification preferences
var createNotifySets = getJobParam("createNotifySets").substring(0, 1).toUpperCase().equals("Y") ; // different sets based on notification preferences
var setType = getJobParam("setType"); // Sets will be created with this type
var setStatus = getJobParam("setStatus"); // Sets will be created with this initial status
var setParentWorkflowTaskAndStatus = getJobParam("setParentWorkflowTaskAndStatus").split(","); // update workflow task/status, comma separated.
var filterExpression = getJobParam("filterExpression"); // JavaScript used to filter records.   Evaluating to false will skip the record, for example:   getAppSpecific("FieldName").toUpperCase() == "TEST"
var actionExpression = getJobParam("actionExpression"); // JavaScript used to perform custom action, for example:   addStdCondition(...)
var sendEmailNotifications = getJobParam("sendEmailNotifications").substring(0, 1).toUpperCase().equals("Y");
var sysFromEmail = getJobParam("sysFromEmail");
var rptName = getJobParam("reportName");
var appType = appGroup + "/" + appTypeType + "/" + appSubtype + "/" + appCategory;
//if(appTypeType=="*") appTypeType="";
//if(appSubtype=="*")  appSubtype="";
//if(appCategory=="*") appCategory="";
 */

/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/

var mailFrom = lookup("ACA_EMAIL_TO_AND_FROM_SETTING", "RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
var acaSite = lookup("ACA_CONFIGS", "ACA_SITE");
acaSite = acaSite.substr(0, acaSite.toUpperCase().indexOf("/ADMIN"));

var systemUserObj = aa.person.getUser("ADMIN").getOutput();




/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

logDebug("Start of Job");

try {
	var startDate = new Date();
	var startTime = startDate.getTime(); // Start timer
	var arrJobs = [];
	var emailAddress = "";
	arrJobs = findSWADDLERecsToProcess();
	if(arrJobs){
		var batchId = getJobParam("BatchJobID");
		if(batchId.indexOf(",")>-1){
			var arrBatchId = [];
			arrBatchId = batchId.split(",");
		}
		var SEPInfo =[];
		loadAppSpecific(SEPInfo);
		var fromDate = "";
		var toDate = "";
		var expStatus = "";

		for (job in arrJobs){
			thisJob = arrJobs[job];
			var isActive = ""+thisJob["Active"];
			var thisBatchId = ""+thisJob["Batch ID"];
			if(isActive=="Yes" && (batchId=="ALL_BATCHES" || matches(batchId,"","undefined",null,thisBatchId) || exists(thisBatchId,arrBatchId))){
				if(job>0){
					var oldFromDate = fromDate;
					var oldToDate = toDate;
					var oldexpStatus = expStatus;
				}else{
					var oldFromDate = false;
					var oldexpStatus = false;
				}					
				fromDate = ""+thisJob["fromDate"]; // Hardcoded dates.   Use for testing only
				toDate = ""+thisJob["toDate"]; // ""
				lookAheadDays = ""+thisJob["Look Ahead Days"];
				daySpan = ""+thisJob["Day Span"];
				expStatus = ""+thisJob["Expiration Status"]; //   test for this expiration status
				newExpStatus = ""+thisJob["New Expiration Status"]; //   update to this expiration status
				newAppStatus = ""+thisJob["New Application Status"]; //   update the CAP to this status
				setPrefix = ""+thisJob["Set Prefix"];
				gracePeriodDays = ""+thisJob["Grace Period Days"]; //	bump up expiration date by this many days
				inspSched = ""+thisJob["Inspection to Schedule"]; //   Schedule Inspection
				skipAppStatusArray = ""+thisJob["Skip Application Statuses"]; //   Skip records with one of these application statuses
				skipAppStatusArray = skipAppStatusArray.split(","); //   Skip records with one of these application statuses
				emailAddress = ""+thisJob["Send Batch Logs To"]; // email to send report
				sendEmailToContactTypes = ""+thisJob["Contacts Receiving Notice"]; // ALL,PRIMARY, or comma separated values
				emailTemplate = ""+thisJob["Email Template"]; // email Template
				taskToAssign = ""+thisJob["Task to Assign"]; 
				assignTaskTo = ""+thisJob["Assign Task To"]; 
				deactivateLicense = ""+thisJob["Deactivate License"]; // deactivate the LP
				deactivateLicense = deactivateLicense.substring(0, 1).toUpperCase().equals("Y"); // deactivate the LP
				lockParentLicense = ""+thisJob["Parent License Condition"]; // add this lock on the parent license
				lockParentLicense = lockParentLicense.substring(0, 1).toUpperCase().equals("Y"); // add this lock on the parent license
				createRenewalRecord = ""+thisJob["Create Renewal Record"]; // create a temporary record
				createRenewalRecord = createRenewalRecord.substring(0, 1).toUpperCase().equals("Y"); // create a temporary record
				feeSched = ""+thisJob["Fee Schedule"]; //
				feeList = ""+thisJob["List of Fees"]; // comma delimted list of fees to add to renewal record
				feePeriod = ""+thisJob["Fee Period"]; // fee period to use {LICENSE}
				parentFeeSched = ""+thisJob["Parent Fee Schedule"]; //
				parentFeeList = ""+thisJob["Parent Fee List"]; // comma delimted list of fees to add to renewal record
				parentFeePeriod = ""+thisJob["Parent Fee Period"]; // fee period to use {LICENSE}
				respectNotifyPrefs = ""+thisJob["Respect Notify Preferences"]; // respect contact notification preferences
				respectNotifyPrefs = respectNotifyPrefs.substring(0, 1).toUpperCase().equals("Y"); // respect contact notification preferences
				createNotifySets = ""+thisJob["Create A Set"] ; // different sets based on notification preferences
				createNotifySets = createNotifySets.substring(0, 1).toUpperCase().equals("Y") ; // different sets based on notification preferences
				setType = ""+thisJob["Set Type"]; // Sets will be created with this type
				setStatus = ""+thisJob["Set Status"]; // Sets will be created with this initial status
				setParentWorkflowTaskAndStatus = ""+thisJob["Set Parent Task/Status"]; // update workflow task/status, comma separated.
				setParentWorkflowTaskAndStatus = setParentWorkflowTaskAndStatus.split(","); // update workflow task/status, comma separated.
				filterExpression = ""+thisJob["Filter Expression"]; // JavaScript used to filter records.   
				actionExpression = ""+thisJob["Addtl Action to Perform"]; // JavaScript used to perform custom action, for example:   addStdCondition(...)
				sendEmailNotifications = ""+thisJob["Send Email Notifications"];
				sendEmailNotifications = sendEmailNotifications.substring(0, 1).toUpperCase().equals("Yes");
				sysFromEmail = SEPInfo["Agency From Email"];
				rptName = ""+thisJob["Report Name"];
				appType = ""+thisJob["Record Type"];
				arrAppType = appType.split("/");
				fromDate = dateAdd(null, parseInt(lookAheadDays))
				toDate = dateAdd(null, parseInt(lookAheadDays) + parseInt(daySpan));
				//don't keep pulling the same record set
				logDebug("" );
				logDebug("================== BATCH " + thisBatchId + " ======================");
				//logDebug("batchId: " + thisBatchId);
				logDebug(expStatus + " for Date Range -- fromDate: " + fromDate + ", toDate: " + toDate);
				if(!oldFromDate || oldFromDate!=fromDate || oldToDate!=toDate || oldexpStatus!=expStatus){
					findExpRecdsToProcess();
				}
				mainProcess();
			}
		}
		logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");
		if (emailAddress.length ) {
			aa.sendMail(sysFromEmail, emailAddress, "", batchJobName + " Results", emailText);
			if(errLog != "") {
				aa.sendMail(sysFromEmail, emailAddress, "", batchJobName + " Errors", errLog);
			}
		}
	}
} catch (err) {
	logDebug("ERROR: BATCH_EXPIRATION_SWADDLE: " + err.message + " In " + batchJobName + " Line " + err.lineNumber);
	logDebug("Stack: " + err.stack);
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/


function findSWADDLERecsToProcess(){
try{
	//see if any records are set up--module can be specific or "ALL", look for both
	//var modName = getJobParam("ModuleName"); 
	var modName = "ALL";
	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", modName);
	if(sepScriptConfig.getSuccess()){
		var sepScriptConfigArr = sepScriptConfig.getOutput();
		if(sepScriptConfigArr.length>0){
			for(sep in sepScriptConfigArr){
				var cfgCapId = sepScriptConfigArr[sep].getCapID();
				capId = cfgCapId;
				var sepBatch = loadASITable("BATCH - RENEWALS",cfgCapId);
				return sepBatch;
			}
		}
	}
	return false;
}catch(err){
	logDebug("A JavaScript Error occurred: findSWADDLERecsToProcess: " + err.message);
	logDebug(err.stack)
}}

function findExpRecdsToProcess(){
try{
	// Obtain the array of records to loop through.   This can be changed as needed based on the business rules
	//
	var expResult = aa.expiration.getLicensesByDate(expStatus, fromDate, toDate);
	if (expResult.getSuccess()) {
		arrExpRecds = expResult.getOutput();
		logDebug("Processing " + arrExpRecds.length + " expiration records");
	} else {
		logDebug("ERROR: Getting Expirations, reason is: " + expResult.getErrorType() + ":" + expResult.getErrorMessage());
		return false
	}
}catch(err){
	logDebug("A JavaScript Error occurred: findExpRecdsToProcess: " + err.message);
	logDebug(err.stack)
}}

function mainProcess() {
try{
	var capPermApp = 0;
	var capFilterType = 0;
	var capFilterInactive = 0;
	var capFilterError = 0;
	var capFilterStatus = 0;
	var capFilterExpression = 0;
	var capDeactivated = 0;
	var capCount = 0;
	var inspDate;
	var setName;
	var setDescription;
	var setCreated = false;
	// prep the set prefix for all sets
	/*if (setPrefix != "") {
		var yy = startDate.getFullYear().toString().substr(2, 2);
		var mm = (startDate.getMonth() + 1).toString();
		if (mm.length < 2)
			mm = "0" + mm;
		var dd = startDate.getDate().toString();
		if (dd.length < 2)
			dd = "0" + dd;
		var hh = startDate.getHours().toString();
		if (hh.length < 2)
			hh = "0" + hh;
		var mi = startDate.getMinutes().toString();
		if (mi.length < 2)
			mi = "0" + mi;
		setPrefix+= ":" + yy + mm + dd + hh + mi;
	}*/
	//  create Set of Sets if we are using notify sets
	var masterSet = false;
	//if (setPrefix != "" && createNotifySets) {
	//	var masterSet = setPrefix + ":MASTER";
	//	aa.set.createSet(masterSet,masterSet,"SETS","Contains all sets created by Batch Job " + batchJobName + " Job ID " + batchJobID);
	for (thisExp in arrExpRecds) // for each b1expiration (effectively, each license app)
	{
		b1Exp = arrExpRecds[thisExp];
		var expDate = b1Exp.getExpDate();
		if (expDate) {
			var b1ExpDate = expDate.getMonth() + "/" + expDate.getDayOfMonth() + "/" + expDate.getYear();
			//b1ExpDate = dateAdd(b1ExpDate,1);
		}
		var b1Status = b1Exp.getExpStatus();
		var renewalCapId = null;
		capId = aa.cap.getCapID(b1Exp.getCapID().getID1(), b1Exp.getCapID().getID2(), b1Exp.getCapID().getID3()).getOutput();
		var AInfo =[];
		loadAppSpecific(AInfo);
		if (!capId) {
			logDebug("Could not get a Cap ID for " + b1Exp.getCapID().getID1() + "-" + b1Exp.getCapID().getID2() + "-" + b1Exp.getCapID().getID3());
			continue;
		}
		altId = capId.getCustomID();
		logDebug("----------: " + altId + " :----------");
		logDebug("     " +"Renewal Status : " + b1Status + ", Expires on " + b1ExpDate);
		var capResult = aa.cap.getCap(capId);
		if (!capResult.getSuccess()) {
			logDebug("     " +"skipping, Record is deactivated");
			capDeactivated++;
			continue;
		} else {
			var cap = capResult.getOutput();
		}
		 fileDateObj = cap.getFileDate();
		 fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
		 fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(),fileDateObj.getDayOfMonth(),fileDateObj.getYear(),"YYYY-MM-DD");
		var capStatus = cap.getCapStatus();
		appTypeResult = cap.getCapType(); //create CapTypeModel object
		appTypeString = appTypeResult.toString();
		appTypeArray = appTypeString.split("/");
		// Filter by CAP Type
		if(arrAppType.length == 4){
			if (appType.length && !appMatch(appType) ) {
				capFilterType++;
				logDebug("     " +"skipping, Application Type does not match");
				continue;
			}
		}else{
			capFilterType++;
			logDebug("     " +"skipping, Record Type Formatted incorrectly: " + appType);
			continue;
		}
		// Filter by CAP Status
		if (exists(capStatus, skipAppStatusArray)) {
			capFilterStatus++;
			logDebug("     " +"skipping, due to application status of " + capStatus)
			continue;
		}
		// custom filter  
		if (filterExpression.length > 0) {
			var result = eval(filterExpression);
			if (!result) {
				capFilterExpression++;
				//logDebug("Veterans Exemption: " + AInfo["Veterans Exemption"]);
				//logDebug("Is this Caterer located within Solano County: " + AInfo["Is this Caterer located within Solano County"]);
				//logDebug("Non Profit: " + AInfo["Non Profit"]);
				logDebug("skipping, due to:  " + filterExpression + " = " + eval(result));
				continue;
			}
		}
		// done filtering, so increase the record count to include this record.
		capCount++;
		// Actions start here:
		var refLic = getRefLicenseProf(altId); // Load the reference License Professional
		if (refLic && deactivateLicense) {
			refLic.setAuditStatus("I");
			aa.licenseScript.editRefLicenseProf(refLic);
			logDebug( "deactivated linked License");
		}
		// update expiration status
		if (newExpStatus.length > 0) {
			b1Exp.setExpStatus(newExpStatus);
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
			logDebug("Update expiration status: " + newExpStatus);
		}
		// update expiration date based on interval
		if (parseInt(gracePeriodDays) != 0) {
			newExpDate = dateAdd(b1ExpDate, parseInt(gracePeriodDays));
			b1Exp.setExpDate(aa.date.parseDate(newExpDate));
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());

			logDebug("updated CAP expiration to " + newExpDate);
			if (refLic) {
				refLic.setLicenseExpirationDate(aa.date.parseDate(newExpDate));
				aa.licenseScript.editRefLicenseProf(refLic);
				logDebug("updated License expiration to " + newExpDate);
			}
		}
		// assign task
		if (taskToAssign.length > 0) {
			updateTaskDepartment(taskToAssign, assignTaskTo);
			logDebug( taskToAssign + " assigned to " + assignTaskTo);
		}
		// update CAP status
		if (newAppStatus.length > 0) {
            updateAppStatus(newAppStatus, "");
		}
		// schedule Inspection
		if (inspSched.length > 0) {
			//lwacht: this check is specific to EnvHealth and should be removed for other implementations
			if(getAppSpecific("Non Profit")!="CHECKED" && appType.indexOf("School")<0){
				//lwacht: end custom solution
				scheduleInspection(inspSched, "1");
				inspId = getScheduledInspId(inspSched);
				if (inspId) {
					autoAssignInspection(inspId);
				}
				logDebug("Scheduled " + inspSched + ", Inspection ID: " + inspId);
			}
		}
		if (createNotifySets && setPrefix != "") {
			var setCreationFailure = false;
			if(!setCreated) {
				var vExpSet =  createExpirationSet(setPrefix);
				if(vExpSet){
					var sExpSet = vExpSet.toUpperCase();
					var setHeaderSetType = aa.set.getSetByPK(sExpSet).getOutput();
					setHeaderSetType.setRecordSetType(setType);
					setHeaderSetType.setSetStatus(setStatus);
					updResult = aa.set.updateSetHeader(setHeaderSetType);
					setCreated = true;
				}else{
					logDebug("*****SET NOT CREATED****");
					setCreationFailure = true;
				}
			}
			if (masterSet) {
				var setResult = aa.set.addSetofSetMember(masterSet, s.id); 
				if (!setResult.getSuccess()) {
					logDebug("Warning: could not add channel set to master set " + setResult.getErrorMessage());
					}
				}
			} 
			if(createNotifySets && !setCreationFailure){
				setAddResult=aa.set.add(sExpSet,capId);
				if(!setAddResult.getSuccess()){
					logDebug("Warning: error adding record to set " + setAddResult.getErrorMessage());
				}else{
					logDebug("Successfully added record to set.")
				}
			}
		// Add to the overall Set
		/*if (setPrefix != "") {
			var s = new capSet(setPrefix + ":ALL",setPrefix + ":ALL",setType,"All Records Processed by Batch Job " + batchJobName + " Job ID " + batchJobID);
			s.status = setStatus;
			s.update(); logDebug("Set Status = " + s.status);
			s.add(capId);
			if (masterSet) {
				aa.set.addSetofSetMember(masterSet, s.id); 
				}
			}*/
		// update workflow tasks, statuses.    There can be more than one pair.
		// modified 3.22.16, wiping out parameter values for subsequent records.  Make local copy. -JEC
		var localSetParentWorkflowTaskAndStatus = new Array();
		for (i=0; i<setParentWorkflowTaskAndStatus.length; i++) {
			localSetParentWorkflowTaskAndStatus[i] = setParentWorkflowTaskAndStatus[i];
		}	
		while (localSetParentWorkflowTaskAndStatus.length > 1) {
			logDebug("Setting workflow task " + localSetParentWorkflowTaskAndStatus[0] + " to " + localSetParentWorkflowTaskAndStatus[1] );
			resultWorkflowTask(localSetParentWorkflowTaskAndStatus[0], localSetParentWorkflowTaskAndStatus[1], "Updated by batch job "+ batchJobName + " Job ID " + batchId, "");
			localSetParentWorkflowTaskAndStatus.splice(0, 2); // pop these off the queue
		}
		// lock Parent License
		if (lockParentLicense) {
			licCap = getLicenseCapId("*/*/*/*");

			if (licCap) {
				logDebug(licCap + ": adding Lock : " + lockParentLicense);
				addStdCondition("Suspension", lockParentLicense, licCap);
			} else
				logDebug("Can't add Lock, no parent license found");
		}
		// add fees to parent
		// this section may need to include a call to a custom function or explicit code before the if(parentFeeList.length... clause if the
		// renewal fees are based on ASI.  Use the parameter ONLY if that fee is to be applied to ALL records that qualify for processing.
		if (parentFeeList.length > 0) {
			for (var fe in parentFeeList.split(",")) {
				logDebug("Adding fee: " + parentFeeList.split(",")[fe] + " to parent record");	
				//Alternate to add fees by date.  Useful if fee changes are coming soon
				//var feObj = addFeeByDate(capId, b1ExpDate, parentFeeList.split(",")[fe], parentFeeSched, parentFeePeriod, 1, "N");
				//var feObj = addFee(parentFeeList.split(",")[fe], parentFeeList, parentFeeList, 1, "Y", capId);
				var feObj = addFee(parentFeeList.split(",")[fe], parentFeeSched, parentFeePeriod, 1, "Y", capId);
			}
		}
		// execute custom expression
		if (actionExpression.length > 0) {
			feeSeqList = []; 
			paymentPeriodList = [];
			logDebug("Executing action expression : " + actionExpression);
			var result = eval(actionExpression);
		}
		// create renewal record and add fees
		if (createRenewalRecord) {
			createResult = aa.cap.createRenewalRecord(capId);
			if (!createResult.getSuccess() || !createResult.getOutput()) {
				logDebug("Could not create renewal record.   This could be due to EMSE errors on record creation : " + createResult.getErrorMessage());
			} else {
				renewalCapId = createResult.getOutput();
				renewalCap = aa.cap.getCap(renewalCapId).getOutput();
				if (renewalCap.isCompleteCap()) {
					logDebug("Renewal Record already exists : " + renewalCapId.getCustomID());
				} else {
					logDebug("created Renewal Record " + renewalCapId.getCustomID());

					// add fees
					// this section may need to include a call to a custom function or explicit code before the if(feeList.length... clause if the
					// renewal fees are based on ASI.  Use the parameter ONLY if that fee is to be applied to ALL records that qualify for processing.
					if (feeList.length > 0) {
						for (var fe in feeList.split(",")) {
							logDebug("Adding fee: " + feeList.split(",")[fe] + " to renewal record");
							var feObj = addFee(feeList.split(",")[fe], feeSched, feePeriod, 1, "Y", renewalCapId);
							//Alternate to add fees by date.  Useful if fee changes are coming soon
							//var feObj = addFeeByDate(capId, b1ExpDate, feeList.split(",")[fe], feeSched, feePeriod, 1, "N");
						}
					}
				}
			}
		}
		if (sendEmailToContactTypes.length > 0 && emailTemplate.length > 0 ) {
			var conTypeArray = sendEmailToContactTypes.split(",");
			var sendAllContacts = conTypeArray.indexOf("ALL") >= 0 || conTypeArray.indexOf("All") >= 0 || conTypeArray.indexOf("all") >= 0;
			var sendPrimaryContact = conTypeArray.indexOf("PRIMARY") >= 0 || conTypeArray.indexOf("Primary") >= 0 || conTypeArray.indexOf("primary") >= 0;
			// create an array of contactObjs
			var conArray = [];

			var capContactResult = aa.people.getCapContactByCapID(capId);
			if (capContactResult.getSuccess()) {
				var capContactArray = capContactResult.getOutput();
			}
			if (capContactArray) {
				for (var yy in capContactArray) {
					conArray.push(new contactObj(capContactArray[yy]));

				}
			}
			// filter based on business rules in params
			var sendArray = [];
			for (thisCon in conArray) {
				var c = conArray[thisCon];  
				//if ((c.primary && sendPrimaryContact) || sendAllContacts) {
				//logDebug("c.people.getFlag(): " + c.people.getFlag());
				if ((c.people.getFlag()=="Y" && sendPrimaryContact) || sendAllContacts) {
					sendArray.push(c); 
				}
				if (conTypeArray.length > 0) {
					for (thisType in conTypeArray) {
						if (c.type == conTypeArray[thisType]) {
							sendArray.push(c);							
						}
					}
				}
			}
			// process each qualified contact
			var arrSendEmails = "";
			for (var i in sendArray) {
				//  create set  
				var channel = ("" + lookup("CONTACT_PREFERRED_CHANNEL","" + sendArray[i].capContact.getPreferredChannel())).toUpperCase();
				var email = sendArray[i].capContact.getEmail();
				arrSendEmails += email+"; ";
				var cFName = sendArray[i].capContact.firstName;
				var cLName = sendArray[i].capContact.lastName;
				//logDebug("Notification requested for " + sendArray[i] + " preferred channel: " + channel);
				if (!respectNotifyPrefs || sendArray[i].capContact.getPreferredChannel()==0 || (channel.indexOf("EMAIL") >= 0 || channel.indexOf("E-MAIL") >= 0 || channel.indexOf("Email") >= 0)) {
					if (!email) {
						logDebug("Email channel detected but contact has no email address--adding to notification set");
						continue;
					}else {
						//currentUserID = "ADMIN";
						//runReportAttach(capId,rptName, "altId", capId.getCustomID()); 
						var eParams = aa.util.newHashtable(); 
						//add email template notifications params here
						
						//added code to get location information
						var fcapAddressObj = null;
						var capAddResult = aa.address.getAddressByCapId(capId);
						if (capAddResult.getSuccess())
						{
						  var fcapAddressObj = capAddResult.getOutput();
				    	       for(I in fcapAddressObj)
					      var location = fcapAddressObj[I];
						}
						
						else
                        var location = "";
                        
						//Added code to get Record Alias
						
						var recordCap = aa.cap.getCap(capId).getOutput();
						var capAlias = recordCap.getCapType().getAlias();
						
						addParameter(eParams, "$$fileDateYYYYMMDD$$", fileDateYYYYMMDD);
						addParameter(eParams, "$$altID$$", capId.getCustomID());
						addParameter(eParams, "$$capID$$", capId.getCustomID());
						addParameter(eParams, "$$capType$$", capAlias);
						addParameter(eParams, "$$expirationDate$$", b1ExpDate);
						addParameter(eParams, "$$contactFirstName$$", cFName);
						addParameter(eParams, "$$contactFirstName$$", cLName);
						addParameter(eParams, "$$location$$", location);
						addParameter(eParams, "$$balanceDue$$", feeBalance());
						logDebug("feeBalance(): " + feeBalance());
						var rFiles = [];
						logDebug("rptName: " + rptName);
						if(!matches(rptName, null, "", "undefined")){
							var rFile;
							var rptParams = aa.util.newHashMap();
							//add report params here
							rFile = generateReport(capId,rptName,"Licenses",rptParams);
							if (rFile) {
								rFiles.push(rFile);
							}
						}
					}
				}else{
					logDebug("Preferred channel is ignored, adding to notification set.");
				}
			}
			sendNotification(sysFromEmail,arrSendEmails,"",emailTemplate,eParams, rFiles,capId);
			logDebug(altId + ": Sent Email template " + emailTemplate + " to " + conTypeArray[thisType] + " : " + arrSendEmails);
		}
	}
	logDebug("----------------------------------------");
	logDebug("Total CAPS qualified date range: " + arrExpRecds.length);
	logDebug("Ignored due to application type: " + capFilterType);
	logDebug("Ignored due to CAP Status: " + capFilterStatus);
	logDebug("Ignored due to Deactivated CAP: " + capDeactivated);
	logDebug("Ignored due to Custom Filter Expression: " + capFilterExpression);
	
	logDebug("Total CAPS processed: " + capCount);
	logDebug("========================================");
}catch (err){
	logDebug("ERROR: BATCH_EXPIRATION_SWADDLE: " + err.message + " In " + batchJobName);
	logDebug("Stack: " + err.stack);
}}


function getJobParam(pParamName){ //gets parameter value and logs message showing param value
try{
	var ret;
	if (aa.env.getValue("paramStdChoice") != "") {
		var b = aa.bizDomain.getBizDomainByValue(aa.env.getValue("paramStdChoice"),pParamName);
		if (b.getSuccess()) {
			ret = b.getOutput().getDescription();
			}	

		ret = ret ? "" + ret : "";   // convert to String
		
		logDebug("Parameter (from std choice " + aa.env.getValue("paramStdChoice") + ") : " + pParamName + " = " + ret);
		}
	else {
			ret = "" + aa.env.getValue(pParamName);
			logDebug("Parameter (from batch job) : " + pParamName + " = " + ret);
		}
	return ret;
}catch (err){
	logDebug("ERROR: getJobParam: " + err.message + " In " + batchJobName);
	logDebug("Stack: " + err.stack);
}}

function createExpirationSet( prefix ){
// Create Set
try{
	if (prefix != ""){
		var yy = startDate.getFullYear().toString().substr(2,2);
		var mm = (startDate.getMonth() +1 ).toString(); //getMonth() returns (0 - 11)
		if (mm.length<2)
			mm = "0"+mm;
		var dd = startDate.getDate().toString();
		if (dd.length<2)
			dd = "0"+dd;
		var hh = startDate.getHours().toString();
		if (hh.length<2)
			hh = "0"+hh;
		var mi = startDate.getMinutes().toString();
		if (mi.length<2)
			mi = "0"+mi;
		//var setName = prefix.substr(0,5) + yy + mm + dd;
		var setName = prefix + "_" + yy + mm + dd;
		setDescription = prefix + " : " + mm + dd + yy;
		setResult = aa.set.getSetByPK(setName);
		setExist = false;
		setExist = setResult.getSuccess();
		if (!setExist) {
			//var setCreateResult= aa.set.createSet(setName,setDescription);
			//var s = new capSet(setName,prefix,"License Notifications", "Notification records processed by Batch Job " + batchJobName + " Job ID " + batchJobID);
			var setCreateResult= aa.set.createSet(setName,prefix,"License Notifications","Created via batch script " + batchJobName);
			if( setCreateResult.getSuccess() ){
				logDebug("New Set ID "+setName+" created for CAPs processed by this batch job.<br>");
				return setName;
			}else{
				logDebug("ERROR: Unable to create new Set ID "+setName+" for CAPs processed by this batch job.");
				return false;
			}
		}else{
			logDebug("Set " + setName + " already exists and will be used for this batch run<br>");
			return setName;
		}
	}
}catch (err){
	logDebug("ERROR: createExpirationSet: " + err.message + " In " + batchJobName);
	logDebug("Stack: " + err.stack);
}}

function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000)
}
