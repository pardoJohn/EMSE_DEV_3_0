function doConfigurableScriptActions(){
try{
	logDebug("Vote for Pedro!");
	var module = false;
	if(appTypeArray && appTypeArray[0] != undefined){
		module = appTypeArray[0];
	}
	if(module == null || module == undefined){
		var iCap = aa.cap.getCap(capId)
		if(iCap.getSuccess()){
			var itemCap = iCap.getOutput();
			var itemCapModel = itemCap.getCapModel();
			module = itemCapModel.getModuleName();
		}else{
			logDebug("Error retrieving module value: " + iCap.getErrorMessage());
			return false;
		}
	}
	rulesetName = "CONFIGURABLE_RULESET_" + module;
	rulesetName = rulesetName.toUpperCase();
	logDebug("rulesetName: " + rulesetName);
		var configRuleset = getScriptText(rulesetName);
		if (configRuleset == ""){
			logDebug("No JSON file exists for this module.");
		}else{
		 var configJSON = JSON.parse(configRuleset);
 
	 // match event, run appropriate configurable scripts
		 settingsArray = [];
		 if(configJSON[controlString]) {
			 var ruleSetArray = configJSON[controlString];
			 var scriptsToRun = ruleSetArray.StandardScripts;
			 
			 for (s in scriptsToRun){
				 logDebug("doConfigurableScriptActions scriptsToRun[s]: " + scriptsToRun[s]);
				 var script = scriptsToRun[s];
				 var validScript = getScriptText(script);
				 if (validScript == ""){
					 logDebug("Configurable script " + script + " does not exist.");
				 }else{
					 eval(getScriptText(scriptsToRun[s]));
				 }
			 }
		 }
	 }
}
catch(err){
	logDebug("ERROR: doConfigurableScriptActions " + rulesetName + " Error Message:" + err.message);
}} 
 