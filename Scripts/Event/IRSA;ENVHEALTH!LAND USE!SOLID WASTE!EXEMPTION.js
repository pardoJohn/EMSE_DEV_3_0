try
{	
    var inspFreq = parseInt(getGuidesheetASIValue(inspId, "TECH Garbage Exemption", "Frequency of Reinspection", "INSP FREQ", "INSPECTION FREQUENCY", "Inspection Frequency"));	
	if (!isNaN(inspFreq))
	{
	  editAppSpecific("Inspection Frequency", inspFreq);
	}	
}
catch(err)
{
	logDebug("An error occurred in IRSA:EnvHealth/Land Use/Solid Waste/Exemption : " + err.message);
	logDebug(err.stack);	
}