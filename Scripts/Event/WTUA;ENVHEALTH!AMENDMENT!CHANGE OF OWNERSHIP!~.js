try
{
	if (wfStatus == "Approved")
	{
		var ContactEmail = aa.bizDomain.getBizDomain("CONTACT_UPDATE_INTERNAL_EMAIL");
		if (!ContactEmail || !ContactEmail.getSuccess())
		{
			logDebug("Standard Choice 'CONTACT_UPDATE_INTERNAL_EMAIL' not defined.");
			cancel=true;
		}
		var InternalEmail = ContactEmail.getOutput().toArray();
		if (!InternalEmail || InternalEmail.length == 0)
		{
			logDebug("No criteria defined in Standard Choice 'CONTACT_UPDATE_INTERNAL_EMAIL'.");
			cancel=true;
		}
		logDebug(InternalEmail[i].getDescription());
		var replyTo = "noreply@accela.com";
			var mSubj = "Change of Ownership";
			var mText = "Ownership has been changed.";

		aa.sendMail(replyTo, InternalEmail[i].getDescription(), "", mSubj, mText);
		logDebug("Change of Ownership mail sent to: ysadhu@septechconsulting.com");
	}	
}
catch(err)
{
	logDebug("An error occurred in WTUA:EnvHealth/Amendment/Change of Ownership/* : " + err.message);
	logDebug(err.stack);	
}
