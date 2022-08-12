//////////////////////////////////////
var useAppSpecificGroupName = false;
var asidt = getAppSpecific("Event End Date");
var asifd = getAppSpecific("One Time Event or Seasonal");
var dt = aa.date.parseDate(asidt);
var yr = new Date().getFullYear();
var dt2 = "12/31/"+yr.toString();
if (wfStatus == "Issued") 
{
	b1ExpResult = aa.expiration.getLicensesByCapID(capId);
	b1Exp = b1ExpResult.getOutput();

	if (asifd == "One Time Event")
	{
		b1Exp.setExpDate(dt);
        b1Exp.setExpStatus("Active");
		aa.expiration.editB1Expiration(this.b1Exp.getB1Expiration());
	}
	else if (asifd == "Seasonal")
	{
		b1Exp.setExpDate(dt2);
        b1Exp.setExpStatus("Active");
		aa.expiration.editB1Expiration(this.b1Exp.getB1Expiration());
	}
	aa.sleep(30);
    permitGeneration();	
}

//////////////////////////////////////


function permitGeneration()
{
	var itemCap = capId;
	

	var rParams = aa.communication.getI18nVariables().getOutput(); 
	var rName = "Permit Report"
	var emailTemplate = "SS_PERMIT_ISSUANCE";
	var rFiles = new Array();
	var emailRpt = false;
	var emailFrom = "Auto_Sender@accela.com";
	var id1 = itemCap.ID1;
	var id2 = itemCap.ID2;
	var id3 = itemCap.ID3;
	var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);
	var eParams = aa.util.newHashtable(); 
	var cap = aa.cap.getCap(itemCap).getOutput();
	var capModel = cap.getCapModel();
	
	commitCap = aa.cap.editCapByPK(capModel);
	
	logDebug("itemCap.getCustomID(): " + itemCap.getCustomID());
	
	rParams.put("altId",itemCap.getCustomID());
	rParams.put("ServProvCode","SOLANOCO");
	//rParams.put("conspicuous","No");

	var module = appTypeArray[0];
	
	logDebug("Report Paramters.......");
	logDebug("itemCap: " + itemCap);
	logDebug("rName: " + rName);
	logDebug("appTypeArray[0]: " + module);
	logDebug("rParams: " + rParams);
	logDebug("vEventName: " + vEventName);
							
	//John Pardo-04262021: Validation to execute Asyncronic or not the report and send the email.
	
	var rFile = generateReport(itemCap,rName,module,rParams);
	if (rFile) 
	{
		rFiles.push(rFile);
		emailRpt = true;
	}
					
	if(!emailRpt)
	{
		rFiles = [];
	}
	//Not Asyncronic Execution
	var result = null;
	logDebug("rName: " +rName);
	logDebug(rFiles);
	
	addParameter(eParams, "$$altID$$", itemCap.getCustomID());
	//addParameter(eParams, "$$status$$", capStatus);
	//addParameter(eParams, "$$balanceDue$$", feeTotal);
	addParameter(eParams, "$$recordTypeAlias$$", cap.getCapType().getAlias());	
	
	var eParamFromStandard = lookup("DEPARTMENT_INFORMATION", "Environmental Health Department");
	
	var myParamsArray = [];
	myParamsArray= eParamFromStandard.split("|");

	for (xx in myParamsArray)
	{
		arrayIn = myParamsArray[xx];
		if(arrayIn.indexOf("DepartmentName")		>=1)addParameter(eParams, "$$DepartmentName$$", 		arrayIn.replace("$$DepartmentName$$:","")); 
		if(arrayIn.indexOf("DepartmentAddress")		>=1)addParameter(eParams, "$$DepartmentAddress$$", 		arrayIn.replace("$$DepartmentAddress$$:",""));
		if(arrayIn.indexOf("DepartmentCity")		>=1)addParameter(eParams, "$$DepartmentCity$$",			arrayIn.replace("$$DepartmentCity$$:",""));
		if(arrayIn.indexOf("DepartmentState")		>=1)addParameter(eParams, "$$DepartmentState$$", 		arrayIn.replace("$$DepartmentState$$:",""));
		if(arrayIn.indexOf("DepartmentContactPhone")>=1)addParameter(eParams, "$$DepartmentContactPhone$$", arrayIn.replace("$$DepartmentContactPhone$$:",""));
		if(arrayIn.indexOf("DepartmentContactEmail")>=1)addParameter(eParams, "$$DepartmentContactEmail$$", arrayIn.replace("$$DepartmentContactEmail$$:",""));				
	}
	
	var conArray = getContactArray(itemCap);
	for (thisCon in conArray)
	{					
		b3Contact = conArray[thisCon];
		
		//if (b3Contact["contactType"] == "Accounts Payable")
		
		conEmail = b3Contact["email"];
		if (!conEmail) conEmail = "EHDocuments@SolanoCounty.com";
	
		addParameter(eParams, "$$ContactName$$", b3Contact["firstName"] + " " + b3Contact["lastName"]);
		result = aa.document.sendEmailAndSaveAsDocument(emailFrom, conEmail, null, emailTemplate, eParams, capIDScriptModel, rFiles);
		if(result.getSuccess())
		{
			logDebug("Sent email successfully!");
			
		}
		else
		{
			logDebug("Failed to send mail - " + result.getErrorMessage());
			
		}
	}
}
