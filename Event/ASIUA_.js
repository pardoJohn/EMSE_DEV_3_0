logDebug("Parent:"+getParent());


function createAssetToCapId()//Optional, capId to Related with the Asset
{
	
	if(arguments.length > 0)
	{
		pCapId = arguments[0];
	}
	else
	{
		pCapId = capId;
	}
	
	logDebug("PCapId:"+pCapId);
	
	var assetDataService = null;
	var cacheService = null;
	
	if (cacheService == null) 
	{
		cacheService = com.accela.aa.emse.dom.service.CachedService.getInstance();
		assetDataService = cacheService.getAssetDataService();
	}
	
	var newAssetDataModel = aa.asset.newAssetScriptModel();
	if (newAssetDataModel.getSuccess()) 
	{
		newAssetDataModel = newAssetDataModel.getOutput().getAssetDataModel();
	}
	
	var now = new Date();

	timestamp = now.getYear().toString(); // 2011
	timestamp += now.getMonth().toString(); // JS months are 0-based, so +1 and pad with 0's
	timestamp += now.getDate().toString();
	timestamp += now.getHours().toString();
	timestamp += now.getMinutes().toString();
	timestamp += now.getSeconds().toString();
	
	logDebug("timestamp:"+timestamp);
	
	var assetMasterModel = aa.proxyInvoker.newInstance("com.accela.ams.asset.AssetMasterModel").getOutput();
	assetMasterModel.setServiceProviderCode(aa.getServiceProviderCode());
	assetMasterModel.setG1AssetGroup("Facilities");
	assetMasterModel.setG1AssetType("Building");
	assetMasterModel.setRecFulNam("ADMIN");
	assetMasterModel.setG1ClassType("Polygon");
	assetMasterModel.setG1AssetStatus("Active");
	assetMasterModel.setG1AssetID(timestamp);
	//assetMasterModel.setG1AssetID(capId.getCustomID());
	assetMasterModel.setG1AssetStatus("Active");
	
	var capBasicInfo = aa.cap.getCapBasicInfo(capId).getOutput();
	assetMasterModel.setG1AssetName(capBasicInfo.getSpecialText());
	
	var capAddresses = aa.address.getAddressByCapId(capId, null)
	if (capAddresses.getSuccess()) 
	{
		capAddresses = capAddresses.getOutput();
	}
	
	var sAddressCapId = "";
	
	//it will copy just the primary address
	for(xx in capAddresses)
	{
		if(capAddresses[xx].getPrimaryFlag()=="Y")
		{
			sAddressCapId = capAddresses[0].getAddressModel();
		}
	}
	
	assetMasterModel.setG1Description(sAddressCapId);
	assetMasterModel.setG1AssetComments(workDescGet(capId));
	
	newAssetDataModel.setAssetMaster(assetMasterModel);
		
	try 
	{
		assetSeqNum = assetDataService.createAssetDataWithoutEvent(newAssetDataModel);
		logDebug("Asset Created. Seq Num:"+assetSeqNum);
		//logDebug("Asset PK."+assetMasterModel.getAssetPK());
		
	} 
	catch (err) 
	{
		logDebug("**Exception while creating asset:" + err.message + " Error:" + err.stack);
		return;
	}
	
	//Creation of the relation between the Record and the Asset.
	var workOrderAsset = aa.asset.newWorkOrderAssetScriptModel().getOutput();
	workOrderAsset.setCapID(pCapId);
	workOrderAsset.setAssetPK(assetMasterModel.getAssetPK());
	var linked = aa.asset.createWorkOrderAsset(workOrderAsset.getWorkOrderAssetModel());
	if (!linked.getSuccess()) 
	{
		logDebug("**WARN failed to link asset with record=" + linked.getErrorMessage());
	}
}

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
	
