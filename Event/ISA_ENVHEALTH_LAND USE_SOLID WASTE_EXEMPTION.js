try{
	updateGuidesheetASIField(inspId,"TECH Garbage Exemption", "Frequency of Reinspection", "INSP FREQ", "INSPECTION FREQUENCY", "Inspection Frequency",AInfo["Inspection Frequency"]);
}catch(err){
	logDebug("An error occurred in ISA:EnvHealth/Land Use/Solid Waste/Exemption: Update Guidesheet ASI: " + err.message);
	logDebug(err.stack);	
}

