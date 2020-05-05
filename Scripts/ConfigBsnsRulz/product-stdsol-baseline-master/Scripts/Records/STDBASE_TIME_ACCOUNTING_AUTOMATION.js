/*
Title   : STDBASE_TIME_ACCOUNTING_AUTOMATION
Purpose : Handling Time Accounting Based Fees
Author  : Ali Hasan

Functional Area :

JSON Example : 
{
  "EnvHealth/*//*/*": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Assess Time Accounting Based Fees",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Time Entry Review"
          ],
          "status": [
            "Approved"
          ]
        },
        "action": {          
        },
        "postScript": ""
      }
    ]
  }
}

- Workflow Task and Status must be set in JSON file to specify which task/status invoke this code
*/
var scriptSuffix = "TIME_ACCOUNTING_AUTOMATION";

try {
	// This should be included in all Configurable Scripts
	eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
			
	var settingsArray = [];
	if (isConfigurableScript(settingsArray, scriptSuffix)) {

		for (s in settingsArray) {

			var rules = settingsArray[s];

			//Execute PreScript
			if (!isEmptyOrNull(rules.preScript)) {
				eval(getScriptText(rules.preScript));
			}

			if (cancelCfgExecution) {
				logDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
				cancelCfgExecution = false;
				continue;
			}

			assessTimeAccountingFees(capId);

			//Execute Post Script
			if (!isEmptyOrNull(rules.postScript)) {
				eval(getScriptText(rules.postScript));
			}
		}
	}
} catch (ex) {
	logDebug("**ERROR: Exception while verification the rules for " + scriptSuffix + ". Error: " + ex);
}

/*function assessFees(capId)
{
	//time account review sets
	assignTimeReviewSets(capId);
	// time accounting billing
	if (wfTask == "Time Entry Review" && wfStatus == "Approved") {
	        assessTimeAccountingFees(capId);
	}
}*/
/* 
###### Begin Time Accounting Functions #####
*/ 
// This function takes all unlocked billable time accounting entires and attempts to assess/invoice associated fees
// if successful, the fee sequence will be noted on the time entry and the entry will be locked
// relies on the standard choice TIME_ACCOUNTING_FEE_CODE to map time types to fees
// capId - capId object to perform assessment on
function assessTimeAccountingFees(capId){
	var baseFeeArr = new Array();
	var timeFeeArr = new Array();
	var baseFeeBalance = 0; 
	var timeEntriesArr = new Array();
	var timeEnts = aa.timeAccounting.getTimeLogModelByEntity(capId, null, null, null, null).getOutput();
	var tlmlIterator = timeEnts.iterator();
	while (tlmlIterator.hasNext()) {
		var timeLogModel = tlmlIterator.next();
        var timeLogSeq = timeLogModel.getTimeLogSeq();
		// we have to get the model again using the seq because	the other function doesn't populate the object fully
		var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
		if (tResult.getSuccess()) {
			var timeLogModel = tResult.getOutput();
			if (timeLogModel != null) {
				//we branch here if this is a base fee model vs normal billable time
				var timeTypeModel = timeLogModel.getTimeTypeModel();
				var timeType = "" + timeTypeModel.getDispTimeTypeName();
				try{
					var feeInfoStr = lookup("TIME_ACCOUNTING_FEE_CODE",timeType);
					var feeInfoArr = feeInfoStr.split("|");
					logDebug("feeInfoStr:"+ feeInfoStr) ;
				}
					catch(eLook){
					logDebug("Fee configuration is not valid for time type (" + timeType + ") : " + eLook);
					continue;
				}
				//normal billing
				if (feeInfoArr.length == 4)	{
					if(timeLogModel.getBillable() == "Y" && timeLogModel.getTimeLogStatus()!="L"){
						var duration = parseInt(timeLogModel.getTotalMinutes());
						try{
							
							var feeSchedule = feeInfoArr[0];
							var feeCode = feeInfoArr[1];
							var feePeriod = feeInfoArr[2];
							var rateBased = feeInfoArr[3].toLowerCase();//ignore case of rateBased preference
							
							//determine fee input for rate based vs. basic
							var quantity = 0;
							if (rateBased == true){
								var username = timeLogModel.getTimeLogModel().getUserName();
								var entryDate = timeLogModel.getTimeLogModel().getDateLogged();
								var rate  = getRateByUser(username,entryDate);
								
								if (rate) {
									quantity = parseFloat(duration/60) * rate;
								}
								else{
									logDebug("Error assessing fee; user " + username + " does not have a billing rate configured");
									continue;
								}
								
								logDebug("rate:" + rate + " quantity:" +quantity) ;
							}
							else{
								quantity = parseFloat(duration/60);
							}
							//add the fee item, make notation of the fee ID, and lock the time entry
							logDebug("Fee Schedule:" + feeSchedule + " Fee Code:" + feeCode + " amount: " + quantity);
							var feeSeqNumber = addFee(feeCode, feeSchedule, feePeriod, quantity, "Y", capId);
							timeLogModel.setNotation(feeSeqNumber);
							timeLogModel.setTimeLogStatus("L");
							if(feeSeqNumber != null)
								{
								 fsm = aa.finance.getFeeItemByPK(capId, feeSeqNumber).getOutput().getF4FeeItem();
								var cost = fsm.getFee(); 
								timeLogModel.setEntryCost(cost) ;
								logDebug("Time Entry Cost:" + cost) ;
								}
							aa.timeAccounting.updateTimeLogModel(timeLogModel);
						}
						catch(timeErr){
							logDebug("Error assessing fee for time type " + timeType);
							logDebug("    " + timeErr);
						}
					}
				}			
			}	
		}
	}	
}

//adds a record to a time accounting review set
function assignTimeReviewSets(capId){
	var timeEntriesArr = new Array();
	var timeGrpsArr = new Array();
	var timeEnts = aa.timeAccounting.getTimeLogModelByEntity(capId, null, null, null, null).getOutput();
	var tlmlIterator = timeEnts.iterator();
	while (tlmlIterator.hasNext()) {
		var timeLogModel = tlmlIterator.next();
		var timeLogSeq = timeLogModel.getTimeLogSeq();
		// we have to get the model again using the seq because	the other function doesn't populate the object fully
		var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
		if (tResult.getSuccess()) {
			var timeLogModel = tResult.getOutput();
			if (timeLogModel != null) {
				if(timeLogModel.getBillable() == "Y" && timeLogModel.getTimeLogStatus()!="L"){
					//add to the array because this group needs review
					var timeGrp = getTimeGroupName(timeLogModel.getTimeGroupSeq());
					timeGrpsArr[timeGrp] = timeGrp;
				}
			}
		}
	}
	//process the array and add to sets
	var setType = "Time Entry Review";
	var jsDate = new Date();
	var year = jsDate.getYear() + 1900;
	for (var g in timeGrpsArr) {
		//Check to see if this group is subject to Review;
		if (typeof lookup("TimeReviewGroups",timeGrpsArr[g]) == "string"){
			//Build set name based on group and date
			var setName = timeGrpsArr[g] + " " + year + "." + getWeekOfYear(jsDate);
			logDebug("Generated set name: " + setName);
			var recSet = new capSet(setName);
			recSet.name = timeGrpsArr[g];
			recSet.type = setType;
			recSet.status = "Active";
			recSet.update();
			var newMemeber = true;
			//this is a new set
			if (recSet.members.length==0) {
				logDebug("adding " + capId + " to set");
				var rec = aa.set.addCapSetMember(setName,capId).getOutput();
				recSet.updateMemberStatus(capId,"Pending");
				newMemeber = false;
			}
			//the record already exists in the existing set
			for (var m in recSet.members){
				if (recSet.members[m].getID1() == capId.getID1() && recSet.members[m].getID2() == capId.getID2() && recSet.members[m].getID3() == capId.getID3()){
					logDebug("record is already in the set");
					recSet.updateMemberStatus(capId,"Pending");
					newMemeber = false;
					break;
				}
			}
			//the record is a new member of an existing set 
			if (newMemeber){
				logDebug("adding " + capId + " to set");
				var rec = aa.set.addCapSetMember(setName,capId).getOutput();
				recSet.updateMemberStatus(capId,"Pending");
			}
		}
	}
}


// Get the hourly rate from the User time accounting profile
// username - Accela username to lookup the rate
// entryDate - date of the time entry (SQL formatted string)
function getRateByUser(username, entryDate){
	try {
		var hourlyRate=0;
		var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
		var ds = initialContext.lookup("java:/AA");
		var conn = ds.getConnection();
		var servProvCode = aa.getServiceProviderCode();
		//build query
		var selectString = "Select R1_RATE_SEQ, R1_UNIT_COST From RCOST_RATE Where R1_COST_ITEM = ? And SERV_PROV_CODE = ? And Rec_Status = 'A' And (R1_ACTIVE_DATE <= ? Or R1_ACTIVE_DATE Is Null) And (R1_EXPIRED_DATE > ? Or R1_EXPIRED_DATE Is Null)";
		var SQLStatement = conn.prepareStatement(selectString);
		SQLStatement.setString(1, username.toUpperCase());
		SQLStatement.setString(2, servProvCode);
		SQLStatement.setTimestamp(3, entryDate);
		SQLStatement.setTimestamp(4, entryDate);
		//get results
		var rSet = SQLStatement.executeQuery();
		while (rSet.next()) {
			var profileId = rSet.getString("R1_RATE_SEQ");
			var unitCostStr = rSet.getString("R1_UNIT_COST");
			var unitCost = parseFloat(unitCostStr);
			if (unitCost == 'NaN') {
				continue;
			}
			hourlyRate = unitCost;
			break;
		}
		return (hourlyRate);
	}
	catch (e) {
		logDebug("Exception getting time accounting profile: " + e.message);
	}
	finally {
		if (initialContext) {
			initialContext.close();
		}
		if (SQLStatement) {
			SQLStatement.close();

			if (rSet) {
				rSet.close();
			}
		}
		if (conn) {
			conn.close();
		}
	}
}

//This function will return the time group name based on the time group sequence number 
function getTimeGroupName(groupSeqNum){
	var grpMod = aa.timeAccounting.getTimeGroupTypeModel().getOutput();
	grpMod.setTimeGroupSeq(groupSeqNum);
	var grps = aa.timeAccounting.getTimeGroupTypeModels(grpMod).getOutput();
	return grps[0].getTimeGroupName();
}

// Takea a javascript date and returns an int representing the week of the year
function getWeekOfYear(jsDate){
	var target  = new Date(jsDate.valueOf());  
	// ISO week date weeks start on monday  
	// so correct the day number  
	var dayNr   = (jsDate.getDay() + 6) % 7;  
	// Set the target to the thursday of this week so the  
	// target date is in the right year  
	target.setDate(target.getDate() - dayNr + 3);  
	// ISO 8601 states that week 1 is the week  
	// with january 4th in it  
	var jan4    = new Date(target.getFullYear(), 0, 4);  
	// Number of days between target date and january 4th  
	var dayDiff = (target - jan4) / 86400000;
   	// Calculate week number: Week 1 (january 4th) plus the    
	// number of weeks between target date and january 4th    
	var weekNr = 1 + Math.ceil(dayDiff / 7);    
	return weekNr;    
}

//End Script Code: