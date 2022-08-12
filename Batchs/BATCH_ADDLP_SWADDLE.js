// If there is no LP attached to the Permit, create an LP record if Create Date > 14 days from today

/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var emailText = "";   
var errLog = "";
var debugText = "";
var showDebug = true;	
SENDEMAILS = true;	
sepMsg="VFP";
var showMessage = false;
var message = "";
var br = "<br>";
var useAppSpecificGroupName = false;
var publicUser = false;
/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID()
batchJobName = "" + aa.env.getValue("BatchJobName");
wfObjArray = null;
debug="";
currentUserID="ADMIN";

eval(getMasterScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_SEP_CUSTOM"));
//eval(getScriptText("INCLUDES_BATCH"));
eval(getMasterScriptText("INCLUDES_CUSTOM"));

override = "function logDebug(dstr){ if(showDebug) { aa.print(dstr); emailText+= dstr + \"<br>\"; } }";
eval(override);

function getScriptText(vScriptName)
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";
}
	
function getMasterScriptText(vScriptName) 
{
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
    return emseScript.getScriptText() + "";
}

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}			


batchJobResult = aa.batchJob.getJobID()
batchJobName = "" + aa.env.getValue("BatchJobName");
if (batchJobResult.getSuccess())
{
  batchJobRes = batchJobResult.getOutput();
  //logDebug("!!!VOTE FOR PEDRO THIRD UPDATE!!!!");
  logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobRes);
}
else
{
  logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());
}


try
{
	// Get all CAPs
	var sepScriptConfig = aa.expiration.getLicensesByStatus("Active");

	//var sepScriptConfig = aa.cap.getCapIDList();
	if(sepScriptConfig.getSuccess())
	{
		var sepScriptConfigArr = sepScriptConfig.getOutput();
		if(sepScriptConfigArr.length > 0)
		{
			for(sep in sepScriptConfigArr)
			{
				var t_cap = sepScriptConfigArr[sep].getCapID();
				currCap = aa.cap.getCapID(t_cap.getID1(), t_cap.getID2(), t_cap.getID3()).getOutput();
				var capResult = aa.cap.getCap(currCap);
				var capID = capResult.getOutput();
				var capMod = capID.getCapModel();
				var capDate = capID.getFileDate();
				fileDate = "" + capDate.getMonth() + "/" + capDate.getDayOfMonth() + "/" + capDate.getYear();

				// Create an LP only if the permit is created more than 14 days earlier.
				if(parseInt(dateDiffInDays(new Date(fileDate), new Date())) > parseInt("14"))
				{				
					// Check if LP exists for the CAP. If not, create one and assign
					var licProfResult = aa.licenseScript.getLicenseProf(t_cap);
					var licProfList = licProfResult.getOutput();
					if (!licProfList)
					{					
						// Get Address for the CAP.
						var capAdd = aa.address.getAddressByCapId(t_cap);
						var add = capAdd.getOutput();
						for (a in add)
						{
							strno = add[a].getHouseNumberStart() ? add[a].getHouseNumberStart() : "";
							strdir = add[a].getStreetDirection() ? add[a].getStreetDirection() : "";
							strname = add[a].getStreetName() ? add[a].getStreetName() : "";
							strdir = add[a].getStreetDirection() ? add[a].getStreetDirection() : "";
							strsuf = add[a].getStreetSuffix() ? add[a].getStreetSuffix() : "";
							city = add[a].getCity() ? add[a].getCity() : "";
							state = add[a].getState() ? add[a].getState() : "CA";
							zip = add[a].getZip() ? add[a].getZip(): "";
							
							if(add[a].getAddressTypeFlag() == 'Y') // If this's a primary address, no need to get further addresses.
								break;
						}
						
						var newLic = aa.licenseScript.createLicenseScriptModel();
						newLic.setStateLicense(capMod.getAltID());
						newLic.setBusinessName(capMod.getSpecialText());
						newLic.setLicenseType("Business");
						logDebug("Setting LicState: " + state);
						newLic.setLicState(state);
						newLic.setAddress1(strno.toString().trim() + " " + strdir.trim() + " " + strname.trim() + " " + strsuf.trim());
						newLic.setCity(city);
						newLic.setState(state);
						newLic.setZip(zip);
						newLic.setCountryCode("US");
                                                newLic.setLastUpdateDate(aa.date.getCurrentDate());

						logDebug("Creating LP for: " + capMod.getAltID());
						
						myResult = aa.licenseScript.createRefLicenseProf(newLic);
						// If successfully created, associate it with the CAP.
						if (myResult.getSuccess())
						{				
							licResult = aa.licenseScript.associateLpWithCap(t_cap, newLic);
							if (licResult.getSuccess())
							{
								logDebug("LP successfully associated with CAP.");
							}				
							else
							{
								logDebug("Error associating LP with CAP: " + capMod.getAltID() + " " + licResult.getErrorMessage());
							}						
						}
						else
						{
							logDebug("Error creating LP for CAP: " + capMod.getAltID() + " " + myResult.getErrorMessage());
						}						
					}
				}
			}
		}
	}
}
catch(err)
{
	logDebug("A JavaScript Error occurred: Adding LP After Data Conversion: " + err.message);
	logDebug(err.stack)
}