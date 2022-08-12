var workflowStopped = false;
//stop progress if any of the required fees/inspections/documents are not taken care of
try{
	workflowStopped = sepStopWorkflow();
}catch(err){
	logDebug("A JavaScript Error occurred: WTUB:*/*/*/*: " + err.message);
	logDebug(err.stack)
}

//stop progress if any of the required documents are missing
try{
	if(!workflowStopped){
		var reqDocs = sepGetReqdDocs();
		if(reqDocs.length>0){
			workflowStopped = true;
			cancel = true;
			showMessage = true;
			logDebug("The following documents are required: ");
			for (x in reqDocs){
				logDebug(reqDocs[x]["docGroup"] + " - " + reqDocs[x]["docType"]  + br);
			}
		}
	}
}catch(err){
	logDebug("A JavaScript Error occurred: WTUB:*/*/*/*: " + err.message);
	logDebug(err.stack)
}

//assess fees
try{
	if(!workflowStopped){
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
					var sepFees = loadASITable("FEES - WORKFLOW",cfgCapId);
					if(sepFees.length>0){
						sepUpdateFeesWkfl(sepFees);
					}
				}
			}
		}
	}
}catch(err){
	logDebug("A JavaScript Error occurred: WTUB:*/*/*/*: Assess Fees: " + err.message);
	logDebug(err.stack)
}
