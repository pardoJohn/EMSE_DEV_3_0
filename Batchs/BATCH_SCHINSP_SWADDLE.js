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

// Yash 19 Jan 2021. Function to schedule an inspection for the first time after data conversion.
function sepScheduleInspection_DataConv(recdType, ssInsGroup, sInsType, sInsResult, pendSched, asiField, asiValue, monthDays, whenSched, calWkgDay, insNewGroup, insNewType, inspectorId, asiDateName, chklstDateName, chklstDateItem, chklstDateGroup, chklstDateSubGroup, chklstDateFieldName, addtlQuery, actionExpression, capId) 
{
	try
	{
		var appMatch = true;
		var recdTypeArr = "" + recdType
		var arrAppType = recdTypeArr.split("/");
		if (arrAppType.length != 4)
		{
			logDebug("The record type is incorrectly formatted: " + recdType);
			return false;
		}
		else
		{
			for (xx in arrAppType)
			{
				if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*"))
				{
					appMatch = false;
				}
			}
		}
		if (appMatch)
		{
			logDebug(capId);
			logDebug("appMatch");
			var chkFilter = ""+addtlQuery;
			var ssInsType = ""+sInsType;
			/*
			logDebug("---------------------------------------");
			logDebug("Additional Query field: " + addtlQuery);
			logDebug("chkFilter: " + chkFilter.length);
			logDebug("inspType: " + inspType);
			logDebug("sInsType: " + sInsType);
			logDebug("inspType.toString()==sInsType.toString(): " + (inspType.toString()==sInsType.toString()));
			logDebug("inspResult: " + inspResult);
			logDebug("sInsResult: " + sInsResult);
			logDebug("inspResult.toString()==sInsResult.toString(): " + (inspResult.toString()==sInsResult.toString()));
			logDebug("insNewGroup: " + insNewGroup);
			*/
			if ((chkFilter.length==0 ||eval(chkFilter)) && (inspType.toString()==sInsType.toString()) && (inspResult.toString()==sInsResult.toString()))
			{
				if(insNewGroup)
				{
					var cFld = "" + asiField;
					var custFld = cFld.trim();
					var cVal = "" + asiValue;
					var custVal = cVal.trim();
					var CInfo = [];
					logDebug("Calling LoadAppSpecific");
					loadAppSpecific(CInfo, capId);
					if(matches(custFld,"",null,"undefined") || custVal==CInfo[custFld])
					{
						var pendOrSched = "" + pendSched;
						if(pendOrSched.toUpperCase() == "PENDING")
						{
							createPendingInspection(insNewGroup,insNewType);
						}
						else
						{
							var dtSchedDays = false;
							var cdFld = ""+asiDateName;
							if(!matches(cdFld,"",null,"undefined"))
							{
								var custDtFld = cdFld.trim();
								dtSched = CInfo[custDtFld];
							}
							else
							{
								var cldName = ""+chklstDateName;
								//logDebug("cldName: " + cldName);
								if(!matches(cldName,"",null,"undefined"))
								{
									var cklDateName = cldName.trim();
									var cldItem = ""+chklstDateItem;
									var cklDateItem = cldItem.trim();
									var cldGroup = ""+chklstDateGroup;
									var cklDateGroup = cldGroup.trim();
									var cldSGroup = ""+chklstDateSubGroup;
									var cklDateSubGroup = cldSGroup.trim();
									var cldField = ""+chklstDateFieldName;
									var cklDateField = cldField.trim();
									/*
									logDebug("inspId: " +inspId);
									logDebug("cklDateName: " +cklDateName);
									logDebug("cklDateItem: " +cklDateItem);
									logDebug("cklDateGroup: " +cklDateGroup);
									logDebug("cklDateSubGroup: " +cklDateSubGroup);
									logDebug("cklDateField: " +cklDateField);
									*/
									whenSched = getGuidesheetASIValue(inspId,cklDateName,cklDateItem,cklDateGroup,cklDateSubGroup, cklDateField);
									if(!whenSched)
									{
										logDebug("Error retrieving checklist item. Setting days to 30.");
										whenSched = 30;
									}
								}
								var pendOrSched = ""+pendSched;
								if(pendOrSched.toUpperCase()=="PENDING")
								{
									createPendingInspection(insNewGroup,insNewType);
								}
								else
								{
									//logDebug("monthDays: "+monthDays);
									monthDays = ""+monthDays;
									if(monthDays.toUpperCase()=="YEARS")
									{
										logDebug("YEARS: " + whenSched);
										var dtSched = dateAddMonths(sysDate,parseInt(whenSched)*12);
									}
									else
									{
										if(monthDays.toUpperCase()=="MONTHS")
										{
											logDebug("MONTHS: " + whenSched);
											var dtSched = dateAddMonths(sysDate,parseInt(whenSched));
										}
										else
										{
											calWkgDay = ""+calWkgDay;
											if(calWkgDay.toUpperCase()=="WORKING")
											{
												var dtSched = dateAdd(sysDate,parseInt(whenSched),true);
											}
											else
											{
												var dtSched = dateAdd(sysDate,parseInt(whenSched));
												logDebug("WORKING: " + whenSched);
											}
										}
									}
								}
								logDebug("dtSched: " + dtSched);
								if(!dtSched)
								{
									logDebug("No scheduled date was found. Defaulting to one month");
									dtSched=dateAddMonths(null,1);
								}
								sepScheduleInspectDate(insNewType,dtSched);
								if(!matches(inspectorId,"",null,"undefined"))
								{
									var newInspId = getScheduledInspId(insNewType);
									newInspId = ""+newInspId;
									inspectorId = ""+inspectorId;
									if(inspectorId.toUpperCase()=="AUTO")
									{
										autoAssignInspection(newInspId);
									}
									else
									{
										if(inspectorId.toUpperCase()=="PRIOR")
										{
											var lastInspid = ""+getLastInspector(sInsType);
											if(lastInspid!=null)
											{
												assignInspection(newInspId, lastInspid);
											}
											else
											{
												assignInspection(newInspId, inspectorId);
											}
										}
									}
								}
							}
						}
						// execute custom expression
						if (!matches(actionExpression, "", null, "undefined"))
						{
							actionExpression = ''+ actionExpression;
							logDebug("Executing action expression : " + actionExpression);
							var result = eval(actionExpression);
							logDebug("result: " + result);
						}
					}
				}
			}
		}
	}
	catch(err)
	{
		logDebug("An error occurred in sepScheduleInspection_DataConv: " + err.message);
		logDebug(err.stack);
	}
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

//Schedule next inspections after data conversion, only for active permits
try
{
	//var cnt = 0;
	var skipCap = false;

	//see if any records are set up--check for "ALL", we are processing all records here.
	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", "ALL");
	if(sepScriptConfig.getSuccess())
	{
		var sepScriptConfigArr = sepScriptConfig.getOutput();
	}

	var result = aa.expiration.getLicensesByStatus("Active");

	if (result.getSuccess())
	{
		caps = result.getOutput();
		for (i in caps)
		{
	        var inspType = "";
	        var inspResult = "";
			var inspId = "";
			//cnt += 1;
			skipCap = false;
			currCap = aa.cap.getCapID(caps[i].getCapID().getID1(), caps[i].getCapID().getID2(), caps[i].getCapID().getID3()).getOutput();
			var capResult = aa.cap.getCap(currCap);
			var cap = capResult.getOutput();
			var capId = cap.getCapID();
			
			logDebug("For Cap: " + cap.getCapModel().getAltID() + " " + cap.getCapStatus());
			logDebug("Getting Inspections");
			// If there's already an inspection scheduled, do not create another.
			var insp = aa.inspection.getInspections(cap.getCapID());
			var arrinsp = [];
			if (insp.getSuccess())
			{
				var inspArray = insp.getOutput();
				
				for (ins in inspArray) 
				{
					if (inspArray[ins].getInspectionStatus().toUpperCase().equals("SCHEDULED"))
					{						
						skipCap = true;
						break;
					}

					arrinsp.push({"id" : inspArray[ins].getIdNumber(), "result" : inspArray[ins].getInspectionStatus(), "type" : inspArray[ins].getInspectionType(), "idate" : inspArray[ins].getInspectionDate().getEpochMilliseconds()});
					logDebug(inspArray[ins].getInspectionStatus().toUpperCase());
				}
				if (arrinsp.length > 0)
				{
					arrinsp.sort(function (a, b) { return a.idate - b.idate; });
					inspType = arrinsp[arrinsp.length - 1]["type"];			
					inspResult = arrinsp[arrinsp.length - 1]["result"];	
					inspId = arrinsp[arrinsp.length - 1]["id"];	
					logDebug(inspId + " " + inspType + " " + inspResult);
				}
			}
			else
			{
				skipCap = true;
				logDebug("No Previous Inspections for " + cap.getCapModel().getAltID());
			}
			
			if (!skipCap)
			{
				appTypeResult = cap.getCapType(); //create CapTypeModel object
				appTypeString = appTypeResult.toString();
				appTypeArray = appTypeString.split("/");
				if(sepScriptConfigArr.length > 0)
				{
					for(sep in sepScriptConfigArr)
					{
						var cfgcap = sepScriptConfigArr[sep].getCapID();
						var sepNotifList = loadASITable("RESCHEDULE INSPECTION", cfgcap);
						for(row in sepNotifList)
						{
							if(sepNotifList[row]["Active"]=="Yes")
							{
								if (inspType == "" && inspResult == "")
								{
									inspType = sepNotifList[row]["Inspection Type"];
									inspResult = sepNotifList[row]["Inspection Result"];
								}
							    logDebug("Scheduling inspection for: " + cap.getCapModel().getAltID() + " " + sepNotifList[row]["Record Type"]);
							    sepScheduleInspection_DataConv(sepNotifList[row]["Record Type"], sepNotifList[row]["Inspection Group"], sepNotifList[row]["Inspection Type"], sepNotifList[row]["Inspection Result"],  sepNotifList[row]["Pending/Schedule"], sepNotifList[row]["Custom Field Name"], sepNotifList[row]["Custom Field Value"], sepNotifList[row]["Months/Days"], sepNotifList[row]["When to Schedule"], sepNotifList[row]["Calendar/Work Days"], sepNotifList[row]["New Inspection Group"], sepNotifList[row]["New Inspection Type"], sepNotifList[row]["Inspector"], sepNotifList[row]["Custom Date Field Name"], sepNotifList[row]["Checklist Date Name"], sepNotifList[row]["Checklist Date Item"], sepNotifList[row]["Checklist Date Custom Group"], sepNotifList[row]["Checklist Date Custom Subgroup"], sepNotifList[row]["Checklist Date Custom Field Name"], sepNotifList[row]["Additional Query"], sepNotifList[row]["Addtl Action to Perform"], cap.getCapID());				
							}
						}
					}
				}			
			}
			//if (cnt == 1) break;
		}
	}
}
catch(err)
{
	logDebug("A JavaScript Error occurred: Schedule Inspections After Data Conversion: " + err.message);
	logDebug(err.stack)
}

