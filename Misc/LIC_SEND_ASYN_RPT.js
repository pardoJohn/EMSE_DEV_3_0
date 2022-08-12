//John Pardo 04/12/2021
//This script execute the report and send the email in a asynchrony way.
//All the parameter in the next section need to be setup before execute.

try{
	var itemCapId = aa.env.getValue("CapID");
	var rptAltId = aa.env.getValue("CustomCapId");
	var reportName = aa.env.getValue("ReportName");
	var ReportParameters = aa.env.getValue("ReportParameters");
	
	var wTime = aa.env.getValue("WaitTime");
	var emailFrom = aa.env.getValue("EmailFrom");
	var emailTo = aa.env.getValue("EmailTo");
	var emailTemplate = aa.env.getValue("EmailTemplate");
	var emailParameters = aa.env.getValue("EmailParameters");
	var currentUserID = aa.env.getValue("currentUserID");
	
	//var Module = aa.env.getValue("Module");
	
	var envAltId ="";
	
	var rFiles = new Array();
	
	//This section is to debug via mail
	var pText1="";
	pText1=pText1+"-"+itemCapId;
	pText1=pText1+"-"+rptAltId;
	pText1=pText1+"-"+reportName;
	pText1=pText1+"-"+ReportParameters;	
	pText1=pText1+"-"+wTime;
	pText1=pText1+"-"+emailFrom;
	pText1=pText1+"-"+emailTo;
	pText1=pText1+"-"+emailTemplate;
	pText1=pText1+"-"+emailParameters;
	
	//aa.sendMail("Auto_Sender@accela.com", "jpardo@septechconsulting.com", "", "DEBUG1", pText1);
	
	
	if (itemCapId == null)
	{
		envAltId = "Alt ID Empty";
	}
	else
	{
	envAltId = itemCapId.getCustomID();
	}
	
	pCapObj = aa.cap.getCap(itemCapId).getOutput();
	pAppTypeResult = pCapObj.getCapType();
	pAppTypeString = pAppTypeResult.toString().split("/");
	currentApp = pAppTypeString[0] + "/" + pAppTypeString[1] + "/" + pAppTypeString[2] + "/" + pAppTypeString[3];
	
	var conspicuousRecs = ["EnvHealth/Food/Cottage/Permit","EnvHealth/Food/Cottage/Registration","EnvHealth/Food/Garden/Registration","EnvHealth/Food Retail/Caterer/Permit","EnvHealth/Food Retail/Caterer/Application","EnvHealth/Food Retail/Farm Stands/Permit",
				"EnvHealth/Food Retail/Farm Stands/Application","EnvHealth/Food Retail/Farmers Market/Permit","EnvHealth/Food Retail/Farmers Market/Application","EnvHealth/Food Retail/Food Facility/Permit","EnvHealth/Food Retail/Food Facility/Application","EnvHealth/Food Retail/Mobile Food/Permit",
				"EnvHealth/Food Retail/Mobile Food/Permit","EnvHealth/Food Retail/Mobile Food/Application","EnvHealth/Food Retail/Mobile Food/Renewal","EnvHealth/Food Retail/Restricted Food Service/Permit","EnvHealth/Food Retail/Restricted Food Service/Application","EnvHealth/Food Retail/Temporary Food Establishment/Permit",
				"EnvHealth/Food Retail/Temporary Food Establishment/Application","EnvHealth/Food Retail/Temporary Food Establishment/Renewal","EnvHealth/Food Retail/Vending Machine/Permit","EnvHealth/Food Retail/Vending Machine/Application","EnvHealth/Land Use/CAFO/Permit","EnvHealth/Land Use/CAFO/Application",
				"EnvHealth/Land Use/Chemical Toilet Facility/Permit", "EnvHealth/Land Use/Chemical Toilet Facility/Application","EnvHealth/Personal Services/Body Art/Permit","EnvHealth/Personal Services/Body Art/Application","EnvHealth/Personal Services/Body Art/Renewal","EnvHealth/Personal Services/Body Art Practitioner/Registration"];
				
				var conspicuousFlag = "No";
				
				if (exists(currentApp,conspicuousRecs)) {
					conspicuousFlag = "Yes";
				}

	//----------------------
	//Wait Time
	//----------------------
	if (wTime == null)
	{
		wTime = 5000;
	}
	else
	{
		wTime = parseInt(wTime);
	}

	var start = new Date().getTime();
	var end = start;
	while(end < start + wTime) 
	{
		end = new Date().getTime();
	}
	//----------------------
	//Wait Time
	//----------------------

	var reportFile = "";
	var reportResult1 = aa.reportManager.getReportInfoModelByName(reportName);

	var report = reportResult1.getOutput(); 

	report.setModule("EnvHealth"); 
	report.setCapId(itemCapId.getID1() + "-" + itemCapId.getID2() + "-" + itemCapId.getID3()); 		
	report.getEDMSEntityIdModel().setAltId(itemCapId.getCustomID());		

	var parameters = aa.util.newHashMap();
	parameters.put("altId",rptAltId);
	parameters.put("conspicuous",conspicuousFlag);
	//parameters.put("ServProvCode","SOLANOCO");
	//report.setReportParameters(parameters);

	report.setReportParameters(ReportParameters);


	//aa.print("Module"+Module);
	//aa.print("envAltId"+envAltId);
	//aa.print("reportName"+reportName);
	//aa.print("parameters"+parameters);


	//logDebug("Module"+Module);
	//logDebug("envAltId"+envAltId);
	//logDebug("reportName"+reportName);
	//logDebug("parameters"+parameters);

	var pText = "";

	//This section is to debug via mail
	//pText=pText+"Module: "+Module;
	pText=pText+"envAltId: "+envAltId;
	pText=pText+"reportName: "+reportName;
	pText=pText+"parameters: "+parameters;
	
	//aa.print("pText"+pText);
	//aa.print("E-"+aa.sendMail("Auto_Sender@accela.com", "jpardo@septechconsulting.com", "", "DEBUG", pText).getOutput());

	
	var permit = aa.reportManager.hasPermission(reportName,"ADMIN");
	if(permit.getOutput().booleanValue())
	{ 
		var reportResult2 = aa.reportManager.getReportResult(report);
		reportResult2 = reportResult2.getOutput();
		pText=pText+"reportResult2: "+reportResult2;

		if (reportResult2 != null)
		{
	
			reportFile = aa.reportManager.storeReportToDisk(reportResult2);
			reportFile = reportFile.getOutput();
			pText=pText+"reportFile: "+reportFile;
			
			rFiles.push(reportFile);
			
		}
	}

	pText=pText+"Report File: "+rFiles;

	//aa.sendMail("Auto_Sender@accela.com", "jpardo@septechconsulting.com", "", "DEBUG2", pText);

	//aa.print("emailFrom      "+emailFrom); 
	//aa.print("emailTo        "+emailTo); 
	//aa.print("emailTemplate  "+emailTemplate);
	//aa.print("emailParameters"+emailParameters);
	//aa.print("rFiles         "+rFiles);

	var capIDScriptModel = aa.cap.createCapIDScriptModel(itemCapId.getID1(), itemCapId.getID2(), itemCapId.getID3());
	//aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, "", emailTemplate, null, capIDScriptModel, rFiles);
	
	aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, "", emailTemplate, emailParameters, capIDScriptModel, rFiles);
	//Asset creation
	createAssetToCapId();
}
catch (err){
	
	sEText = " ";
	sEText = "-"+sEText+"-"+err.message;
	sEText = "-"+sEText+"-"+err.stack;
	
	//aa.sendMail("Auto_Sender@accela.com", "dmontoya@septechconsulting.com", "", "Solano - ERROR LIC_SEND", sEText);
	//logDebug("An error occurred in sepUpdateFeesWkfl: " + err.message);
	//logDebug(err.stack);
}

function createAssetToCapId()//Optional, capId to Related with the Asset
{
	
	/*if(arguments.length > 0)
	{
		pCapId = arguments[0];
	}
	else
	{
		pCapId = capId;
	}*/
	
	capId = itemCapId;
	
	var pText = "";

	//This section is to debug via mail
	//pText=pText+"Module: "+Module;
	pText=pText+"capId: "+capId;
	
	//logDebug("PCapId:"+pCapId);
	
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
	
	//logDebug("timestamp:"+timestamp);
	pText=pText+"timestamp: "+timestamp;
	

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
		//logDebug("Asset Created. Seq Num:"+assetSeqNum);
		
		//logDebug("Asset PK."+assetMasterModel.getAssetPK());
		//aa.sendMail("Auto_Sender@accela.com", "jpardo@septechconsulting.com", "", "DEBUG1-assetSeqNum", pText);
		
	} 
	catch (err) 
	{
		//logDebug("**Exception while creating asset:" + err.message + " Error:" + err.stack);
		
		return;
	}
	
	pText=pText+"workDescGet(capId): "+workDescGet(capId);
	
	//aa.print("pText"+pText);
	//aa.print("E-"+aa.sendMail("Auto_Sender@accela.com", "jpardo@septechconsulting.com", "", "DEBUG", pText).getOutput());

	
	//Creation of the relation between the Record and the Asset.
	var workOrderAsset = aa.asset.newWorkOrderAssetScriptModel().getOutput();
	
	pText = pText + "Parent:"+getParentByCapId(capId);
	
	//aa.sendMail("Auto_Sender@accela.com", "jpardo@septechconsulting.com", "", "DEBUG-before create", pText);
	
	workOrderAsset.setCapID(capId);
	workOrderAsset.setAssetPK(assetMasterModel.getAssetPK());
	var linked = aa.asset.createWorkOrderAsset(workOrderAsset.getWorkOrderAssetModel());
	if (linked.getSuccess()) 
	{
		pText = pText +" linked result:"+linked;
		//aa.sendMail("Auto_Sender@accela.com", "jpardo@septechconsulting.com", "", "DEBUG-createWorkOrderAsset", pText);
		
		//logDebug("**WARN failed to link asset with record=" + linked.getErrorMessage());
	}
	else
	{
		//aa.sendMail("Auto_Sender@accela.com", "dmontoya@septechconsulting.com", "", "SOLANO ASYNC - Line 284 - DEBUG-createWorkOrderAsset-Error", linked.getErrorMessage());	
	}
		
}


function workDescGet(pCapId)
{
	//Gets work description
	//07SSP-00037/SP5017
	var workDescResult = aa.cap.getCapWorkDesByPK(pCapId);
	
	if (!workDescResult.getSuccess())
	{
		//logDebug("**ERROR: Failed to get work description: " + workDescResult.getErrorMessage()); 
		return false;
	}
		
	var workDescObj = workDescResult.getOutput();
	var workDesc = workDescObj.getDescription();
	
	return workDesc;
}


function getParentByCapId(itemCap) 
{
	// returns the capId object of the parent.  Assumes only one parent!
	getCapResult = aa.cap.getProjectParents(itemCap,1);
	if (getCapResult.getSuccess())
	{
		parentArray = getCapResult.getOutput();
		if (parentArray.length)
			return parentArray[0].getCapID();
		else
		{
			//logDebug( "**WARNING: GetParent found no project parent for this application");
			return false;
		}
	}
	else
	{ 
		//logDebug( "**WARNING: getting project parents:  " + getCapResult.getErrorMessage());
		return false;
	}
}

function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}