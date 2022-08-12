try
{
	if (!publicUser) {
		if(AInfo["Food"] == "CHECKED")
		{
			// Check for mandatory fields for Complainant
			var CFName = aa.env.getValue("ApplicantFirstName"); 
			var CLName = aa.env.getValue("ApplicantLastName");
			var CBName = aa.env.getValue("ApplicantBusinessName");
			var CPhone1 = aa.env.getValue("ApplicantPhone1");
	// YS 28 Jan 21. Removed the condition for Org Name as per SUAT-71
			if (matches(CFName, "", null) || matches(CLName, "", null) || matches(CPhone1, "", null))
			{
				cancel = true;
				showMessage = true;
				comment("Complainant Contact Type details are required to submit a Food complaint.");
			}
		}
	}
}
catch(err)
{
	logDebug("An error occurred in ASB:EnvHealth/Enforcement/Complaint/NA : " + err.message);
	logDebug(err.stack);	
}