//schedule inspections



var sepScriptConfigArr;
try
{	 
	//see if any records are set up--module can be specific or "ALL", look for both
	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", appTypeArray[0]);
	if(sepScriptConfig.getSuccess())
	{
		sepScriptConfigArr = sepScriptConfig.getOutput();
		if(sepScriptConfigArr.length<1)
		{
			var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", "ALL");
			if(sepScriptConfig.getSuccess())
			{
				sepScriptConfigArr = sepScriptConfig.getOutput();
			}
		}
	}
}
catch(err)
{
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Loading AUTOMATE21-001: " + err.message);
	logDebug(err.stack)
}


//assess fees
try
{	 
	if(sepScriptConfigArr.length>0)
	{
		for(sep in sepScriptConfigArr)
		{
			var cfgCapId = sepScriptConfigArr[sep].getCapID();
			var sepFees = loadASITable("FEES - WORKFLOW",cfgCapId);
			if(sepFees.length>0)
			{
				sepUpdateFeesWkfl(sepFees);	
			}
		}
	}	
}
catch(err)
{
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Assess Fees: " + err.message);
	logDebug(err.stack)
}
 


 
//schedule inspections
try
{
	if(sepScriptConfigArr.length>0){
		for(sep in sepScriptConfigArr){
			var cfgCapId = sepScriptConfigArr[sep].getCapID();
			var sepNotifList = loadASITable("INSPECTIONS - WORKFLOW",cfgCapId);
			for(row in sepNotifList){
				if(sepNotifList[row]["Active"]=="Yes"){
					sepSchedInspectionWkfl(sepNotifList[row]["Record Type"], sepNotifList[row]["Task Name"], sepNotifList[row]["Task Status"], sepNotifList[row]["Inspection Group"], sepNotifList[row]["Inspection Type"],  sepNotifList[row]["Pending/Schedule"], sepNotifList[row]["Custom Field Name"], sepNotifList[row]["Custom Field Value"], sepNotifList[row]["Months/Days"], sepNotifList[row]["When to Schedule"], sepNotifList[row]["Calendar/Work Days"], sepNotifList[row]["Inspector"], sepNotifList[row]["Additional Query"]);
				}
			}
		}
	}
}
catch(err){
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Schedule Inspections: " + err.message);
	logDebug(err.stack)
}

//issue license
try
{
	sepIssueLicenseWorkflow();
/*
	var parCapId = getParent();

	logDebug(parCapId);
	logDebug(parCapId.getCustomID());

	var priContact = getContactObj(capId,"Environmental Health Applicant");

	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", appTypeArray[0]);
	if(sepScriptConfig.getSuccess()){
		var sepScriptConfigArr = sepScriptConfig.getOutput();
		if(sepScriptConfigArr.length < 1){
			var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", "ALL");
			if(sepScriptConfig.getSuccess()){
				var sepScriptConfigArr = sepScriptConfig.getOutput();
			}
		}
		if(sepScriptConfigArr.length > 0)
		{
			for(sep in sepScriptConfigArr)
			{
				var cfgCapId = sepScriptConfigArr[sep].getCapID();
				var sepNotifList = loadASITable("LICENSE ISSUANCE - ON WORKFLOW", cfgCapId);
				var sysFromEmail = getAppSpecific("Agency From Email", cfgCapId);

				for(row in sepNotifList)
				{
					if(sepNotifList[row]["Active"]=="Yes")
					{
						var notName = "" + sepNotifList[row]["Notification Name"];
						var rName = "" + sepNotifList[row]["Report Name"];
						if(!matches(notName, "","undefined",null))
						{
							var cntType = ""+sepNotifList[row]["Contacts Receiving Notice"];
							var priContact = getContactObj(capId, cntType);
							sepSendPermitReport(sysFromEmail, priContact, notName, rName, parCapId);
						}
						else
						{
							logDebug("No notification name. No email sent.");
						}						
					}
				}
			}
		}
	}
*/
}
catch(err)
{
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Issue license: " + err.message);
	logDebug(err.stack)
}

//renew license
try
{
	sepRenewLicenseWorkflow();
}
catch(err)
{
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Renew license: " + err.message);
	logDebug(err.stack)
}

//send notifications--should always be the last script, especially if the notification is based on fees or other logic.
try
{
	if(sepScriptConfigArr.length>0){
		for(sep in sepScriptConfigArr){
			var cfgCapId = sepScriptConfigArr[sep].getCapID();
			var sepNotifList = loadASITable("NOTIFICATIONS - WORKFLOW",cfgCapId);
			for(row in sepNotifList){
				if(sepNotifList[row]["Active"]=="Yes"){
					sepEmailNotifContactWkfl(sepNotifList[row]["Record Type"], sepNotifList[row]["Contact Type"], sepNotifList[row]["Respect Preferred Channel"], sepNotifList[row]["Notification Name"], sepNotifList[row]["Report Name"], sepNotifList[row]["Task Name"], sepNotifList[row]["Task Status"], getAppSpecific("Agency From Email",cfgCapId), sepNotifList[row]["Additional Query"]);
				}
			}
		}
	}
}
catch(err)
{
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Send Notifications: " + err.message);
	logDebug(err.stack)
}



//Creation of Asset for the record.
if(wfTask == "Permit Issuance" && wfStatus == "Issued")
{
	logDebug("Parent:"+getParent());
	logDebug("Record:"+capId);
	//createAssetToCapId(getParent());
}



function sepSendPermitReport(emailFrom,priContact,notName,rName,parCapId)
{
    try
    {
        var id1 = capId.ID1;
        var id2 = capId.ID2;
        var id3 = capId.ID3;
        
        var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);

        var emailRpt = false;
        var eParams = aa.util.newHashtable(); 
        addParameter(eParams, "$$fileDateYYYYMMDD$$", fileDateYYYYMMDD);

        var contPhone = priContact.capContact.getPhone1();
        if(contPhone){
            var fmtPhone = contPhone.substr(0,3) + "-" + contPhone.substr(3,3) +"-" + contPhone.substr(6,4);
        }else{
            var fmtPhone = "";
        }
        addParameter(eParams, "$$altID$$", capId.getCustomID());
        addParameter(eParams, "$$contactPhone1$$", fmtPhone);
        addParameter(eParams, "$$contactFirstName$$", priContact.capContact.getFirstName());
        addParameter(eParams, "$$contactLastName$$", priContact.capContact.getLastName());
        addParameter(eParams, "$$ContactName$$", priContact.capContact.getFirstName() + " " + priContact.capContact.getLastName());
        addParameter(eParams, "$$contactEmail$$", priContact.capContact.getEmail());
        addParameter(eParams, "$$status$$", capId.getCapStatus());
        addParameter(eParams, "$$capType$$", aa.cap.getCap(capId).getOutput().getCapType().getAlias());
        addParameter(eParams, "$$recordAlias$$", aa.cap.getCap(capId).getOutput().getCapType().getAlias());

        //Add ACA record URL:
        //addACAUrlsVarToEmail(eParams);

        var priEmail = ""+priContact.capContact.getEmail();
        
        var rFiles = new Array();
        var rptName = ""+rName;
        if(!matches(rptName, null, "", "undefined"))
        {
            var rParams = aa.util.newHashMap(); 
            rParams.put("altId",parCapId.getCustomID());
            var rFile = generateReport(parCapId,rName,appTypeArray[0],rParams);
            if (rFile) 
            {
                rFiles.push(rFile);
                emailRpt = true;
            }
        }
        if(!emailRpt)
        {
            rFiles = [];
        }
        var result = null;
        result = aa.document.sendEmailAndSaveAsDocument(emailFrom, priEmail, null, notName, eParams, capIDScriptModel, rFiles);
        if(result.getSuccess())
        {
            logDebug("Sent email successfully!");
            return true;
        }
        else
        {
            logDebug("Failed to send mail - " + result.getErrorMessage());
            return false;
        }
    }
    catch(err)
    {
        logDebug("An error occurred in sepSendNotification: " + err.message);
        logDebug(err.stack);
    }
}



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


//This function is used to print the properties for an object, is just used with scripting code proposes.
//John Pardo
function printProperties(paramObj)
{
	var myObject = paramObj;
	var output = "";
	for (var property in myObject) {
	  output += property + ': ' + myObject[property]+'; ';
	}
	aa.print("P"+output);
}

function workDescGet(pCapId)
{
	//Gets work description
	//07SSP-00037/SP5017
	//
	var workDescResult = aa.cap.getCapWorkDesByPK(pCapId);
	
	if (!workDescResult.getSuccess())
		{
		logDebug("**ERROR: Failed to get work description: " + workDescResult.getErrorMessage()); 
		return false;
		}
		
	var workDescObj = workDescResult.getOutput();
	var workDesc = workDescObj.getDescription();
	
	return workDesc;
}