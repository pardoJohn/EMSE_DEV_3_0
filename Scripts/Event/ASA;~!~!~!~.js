
//assess fees test
try{
	//see if any records are set up--module can be specific or "ALL", look for both
	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", appTypeArray[0]);
	if(sepScriptConfig.getSuccess()){
		var sepScriptConfigArr = sepScriptConfig.getOutput();
		if(!matches(sepScriptConfigArr,null,"","undefined")){
			if(sepScriptConfigArr.length<1){
				var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", "ALL");
				if(sepScriptConfig.getSuccess()){
					var sepScriptConfigArr = sepScriptConfig.getOutput();
				}
			}
			if(sepScriptConfigArr.length>0){
				for(sep in sepScriptConfigArr){
					var cfgCapId = sepScriptConfigArr[sep].getCapID();
					var sepFees = loadASITable("FEES - APP SUBMITTAL",cfgCapId);
					if(sepFees){
						if(sepFees.length>0){
							sepUpdateFeesAppSub(sepFees);
						}
					}
				}
			}
		}
	}
}catch(err){
	logDebug("A JavaScript Error occurred: ASA:*/*/*/*: Assess Fees: " + err.message);
	logDebug(err.stack)
}

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
				var sepNotifList = loadASITable("INSPECTIONS - APP SUBMITTAL",cfgCapId);
				for(row in sepNotifList){
					if(sepNotifList[row]["Active"]=="Yes"){
						sepSchedInspectionAppSub(sepNotifList[row]["Record Type"], sepNotifList[row]["Inspection Group"], sepNotifList[row]["Inspection to Schedule"], sepNotifList[row]["Pending/Schedule"], sepNotifList[row]["Custom Field Name"], sepNotifList[row]["Custom Field Value"], sepNotifList[row]["Days Ahead To Schedule"], sepNotifList[row]["Calendar/Work Days"], sepNotifList[row]["Inspector"], sepNotifList[row]["Additional Query"]);
					}
				}
			}
		}
	}
}catch(err){
	logDebug("A JavaScript Error occurred: ASA:*/*/*/*: Schedule Inspections: " + err.message);
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
				var sepNotifList = loadASITable("NOTIFICATIONS - APP SUBMITTAL",cfgCapId);
				for(row in sepNotifList){
					if(sepNotifList[row]["Active"]=="Yes"){
						sepEmailNotifContactAppSub(sepNotifList[row]["Record Type"], sepNotifList[row]["Contact Type"], sepNotifList[row]["Respect Preferred Channel"], sepNotifList[row]["Notification Name"], sepNotifList[row]["Report Name"], getAppSpecific("Agency From Email",cfgCapId), sepNotifList[row]["Additional Query"]);
					}
				}
			}
		}
	}
}catch(err){
	logDebug("A JavaScript Error occurred: ASA:*/*/*/*: Send Notifications: " + err.message);
	logDebug(err.stack)
}