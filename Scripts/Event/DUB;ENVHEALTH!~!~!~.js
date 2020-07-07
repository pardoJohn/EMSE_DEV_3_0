if(publicUser)
{
	try{
		var inCapScriptModel = aa.cap.getCap(capId).getOutput();
		if(inCapScriptModel){
			var tempCapModel = inCapScriptModel.getCapModel();
			if(tempCapModel.getCapClass()=="COMPLETE"){
				if (capStatus != "Additional Info Required"){
					cancel = true;
					showMessage = true;
					comment("Record must have the status 'Additional Info Required' before documents can be uploaded.");
				}
			}
		}
	}catch(err){
	  logDebug("A JavaScript Error occurred: DUB:EnvHealth/~/~/~: " + err.message);
	  logDebug(err.stack)
	}
}