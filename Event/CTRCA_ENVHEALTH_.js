//showDebug = true;
//logDebug("publicUser:"+publicUser);
if(publicUser)
{	
	var emailTo = "";
	if(appMatch("EnvHealth/Amendment/*/*",capId))			emailTo = "Consumer@SolanoCounty.com";
	if(appMatch("EnvHealth/Enforcement/*/*",capId))			emailTo = "EHComplaints@solanocounty.com";
	if(appMatch("EnvHealth/Food Retail/*/*",capId))			emailTo = "Consumer@SolanoCounty.com";
	if(appMatch("EnvHealth/Food/*/*",capId))				emailTo = "Consumer@SolanoCounty.com";
	if(appMatch("EnvHealth/Hazmat/*/*",capId))				emailTo = "HazMat@SolanoCounty.com";
	if(appMatch("EnvHealth/Housing/*/*",capId))				emailTo = "Consumer@SolanoCounty.com";
	if(appMatch("EnvHealth/Institutions/*/*",capId))		emailTo = "Consumer@SolanoCounty.com";
	if(appMatch("EnvHealth/Land Use/*/*",capId))			emailTo = "EHTechnical@SolanoCounty.com";
	if(appMatch("EnvHealth/Personal Services/*/*",capId))	emailTo = "Consumer@SolanoCounty.com";
	if(appMatch("EnvHealth/Rec Health/*/*",capId))			emailTo = "Consumer@SolanoCounty.com";

	var emailSender 	= "Auto_Sender@accela.com"
	var emailTemplate 	= "APP_SUBMITTED_ACA";
	var eParams = aa.util.newHashtable(); 
	var rFiles = [];
	var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(),capId.getID2(),capId.getID3());

	var myCap = aa.cap.getCap(capId).getOutput();
	
	addParameter(eParams, "$$altID$$", capId.getCustomID());
	addParameter(eParams, "$$status$$", capStatus);
	//addParameter(eParams, "$$balanceDue$$", feeTotal);
	addParameter(eParams, "$$recordAlias$$", myCap.getCapType().getAlias());
	if(emailTo!="")	aa.document.sendEmailAndSaveAsDocument(emailSender, emailTo, "", emailTemplate, eParams, capIDScriptModel, rFiles);
		
}