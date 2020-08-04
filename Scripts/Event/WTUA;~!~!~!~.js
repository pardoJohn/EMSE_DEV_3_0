//showDebug=true;
//schedule inspections
try{
	//see if any records are set up--module can be specific or "ALL", look for both
	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", appTypeArray[0]);
	if(sepScriptConfig.getSuccess()){
		var sepScriptConfigArr = sepScriptConfig.getOutput();
		if(sepScriptConfigArr.length<1){
			var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", "ALL");
			if(sepScriptConfig.getSuccess()){
				var sepScriptConfigArr = sepScriptConfig.getOutput();
			}
		}
		if(sepScriptConfigArr.length>0){
			for(sep in sepScriptConfigArr){
				var cfgCapId = sepScriptConfigArr[sep].getCapID();
				var sepNotifList = loadASITable("INSPECTIONS - WORKFLOW",cfgCapId);
				for(row in sepNotifList){
					if(sepNotifList[row]["Active"]=="Yes"){
						sepSchedInspectionWkfl(sepNotifList[row]["Record Type"], sepNotifList[row]["Task Name"], sepNotifList[row]["Task Status"], sepNotifList[row]["Inspection Group"], sepNotifList[row]["Inspection Type"],  sepNotifList[row]["Pending/Schedule"], sepNotifList[row]["Custom Field Name"], sepNotifList[row]["Custom Field Value"], sepNotifList[row]["Months/Days"], sepNotifList[row]["When to Schedule"], sepNotifList[row]["Calendar/Work Days"], sepNotifList[row]["Inspector"], sepNotifList[row]["Additional Query"]);
					}
				}
			}
		}
	}
}catch(err){
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Schedule Inspections: " + err.message);
	logDebug(err.stack)
}



//issue license
try{
	sepIssueLicenseWorkflow();
}catch(err){
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Issue license: " + err.message);
	logDebug(err.stack)
}

//renew license
try{
	sepRenewLicenseWorkflow();
}catch(err){
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Renew license: " + err.message);
	logDebug(err.stack)
}
//send notifications--should always be the last script, especially if the notification is based on fees or other logic.
try{
	//see if any records are set up--module can be specific or "ALL", look for both
	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", appTypeArray[0]);
	if(sepScriptConfig.getSuccess()){
		var sepScriptConfigArr = sepScriptConfig.getOutput();
		if(sepScriptConfigArr.length<1){
			var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", "ALL");
			if(sepScriptConfig.getSuccess()){
				var sepScriptConfigArr = sepScriptConfig.getOutput();
			}
		}
		if(sepScriptConfigArr.length>0){
			for(sep in sepScriptConfigArr){
				var cfgCapId = sepScriptConfigArr[sep].getCapID();
				var sepNotifList = loadASITable("NOTIFICATIONS - WORKFLOW",cfgCapId);
				for(row in sepNotifList){
					if(sepNotifList[row]["Active"]=="Yes"){
						sepEmailNotifContactWkfl(sepNotifList[row]["Record Type"], sepNotifList[row]["Contact Type"], sepNotifList[row]["Respect Preferred Channel"], sepNotifList[row]["Notification Name"], sepNotifList[row]["Report Name"], sepNotifList[row]["Task Name"], sepNotifList[row]["Task Status"], getAppSpecific("Agency From Email",cfgCapId), sepNotifList[row]["Additional Query"]);
					}
				}
			}
		}
	}
}catch(err){
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Send Notifications: " + err.message);
	logDebug(err.stack)
}