try{
	var inCapScriptModel = aa.cap.getCap(capId).getOutput();
	if(inCapScriptModel){
		var tempCapModel = inCapScriptModel.getCapModel();
		if(tempCapModel.getCapClass()=="COMPLETE"){
			updateAppStatus("Additional Info Received", "Updated via Script");
		}
	}
}catch(err){
	logDebug("A JavaScript Error occurred: DUA:EnvHealth/~/~/~: " + err.message);
	logDebug(err.stack);
}