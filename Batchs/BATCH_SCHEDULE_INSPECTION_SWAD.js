/*-----------------------------------------------------------------------------------------------------
| Program: BATCH_SCHINSP_SWADDLE.js  Trigger: Batch
| Client: Solano County  
|  
| Version 1.0 - Base Version. 05/17/21 John Pardo
| Version 1.1 - Adjustment to Inspector validation.
| Version 1.2 - Validation Inspection
|------------------------------------------------------------------------------------------------------
| Testing values to be used in Script Test.
|------------------------------------------------------------------------------------------------------
	aa.env.setValue("BatchJobName","Batch_Schedule_Inspection_Swad")

|------------------------------------------------------------------------------------------------------
| START: USER CONFIGURABLE PARAMETERS
/-------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 3.0;
var useCustomScriptFile = true;  // if true, use Events->Custom Script, else use Events->Scripts->INCLUDES_CUSTOM
var SA = null;
var SAScript = null;

//BEGIN Includes - Include master scripts and global variables
if (SA) {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA,useCustomScriptFile));
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS", SA,useCustomScriptFile));
	eval(getScriptText(SAScript, SA));
} else {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useCustomScriptFile));
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useCustomScriptFile));
}

//Include INCLUDES_CUSTOM scripts
eval(getScriptText("INCLUDES_CUSTOM",null,useCustomScriptFile));

//Global variables
br = "\n<br>";
showDebug = true;			// Set to true to see debug messages in email confirmation
showMessage = true;			// Set to true to see debug messages in email confirmation
currentUserID = aa.env.getValue("CurrentUserID");

var emailText = "";
var maxSeconds = 2500;//4.5 * 60;	//2500	// number of seconds allowed for batch processing, usually < 5*60
var timeExpired = false;
var sysDate = aa.date.getCurrentDate();
var currDate = new Date();
var batchJobID = 0;
var batchJobResult = aa.batchJob.getJobID()
var batchJobName = "" + aa.env.getValue("BatchJobName");
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var startTime = new Date();
var paramsOK = true;
var emailSender = "no_reply@accela.com";
var emailAddress = "jpardo@septechconsulting.com";

/*------------------------------------------------------------------------------------------------------/
| END: USER CONFIGURABLE PARAMETERS
/------------------------------------------------------------------------------------------------------*/

if (batchJobResult.getSuccess())
{
	batchJobID = batchJobResult.getOutput();
	logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
}
else
{
	logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());
}

/*------------------------------------------------------------------------------------------------------/
| Start: BATCH PARAMETERS
/------------------------------------------------------------------------------------------------------*/
//var appGroup = getParam("appGroup");					// app Group to process {Licenses} EXAMPLE

/*------------------------------------------------------------------------------------------------------/
| End: BATCH PARAMETERS
/------------------------------------------------------------------------------------------------------*/


/*------------------------------------------------------------------------------------------------------/
| Main Process
/------------------------------------------------------------------------------------------------------*/
if (paramsOK)
{
	logMessage("**********************************************************************");
	logMessage("           Job Start");
	logMessage("**********************************************************************");
	if (!timeExpired) 
	{
		try 
		{		
			mainProcess();
		} 
		catch (err)  
		{
			logMessage("ERROR: " + err.message + " In " + batchJobName + " Line " + err.lineNumber);
			logMessage("Stack: " + err.stack);			
		}	
	}
	logMessage("**********************************************************************");
	logMessage("Job End: " + batchJobName + " Elapsed Time : " + elapsed() + " Seconds");
	logMessage("**********************************************************************");
	//aa.eventLog.createEventLog("License Renewal", "Batch Process", batchJobName, sysDate, sysDate,"License Renewal", "Job was completed." , batchJobID);
	if (emailAddress.length) aa.sendMail(emailSender, emailAddress, "", batchJobName + " Results", emailText + " - End of Job: " + batchJobName + " Elapsed Time : " + elapsed() + " Seconds");	
	aa.print(message);
	aa.print(debug);    
}
/*------------------------------------------------------------------------------------------------------/
| End Main Process
/------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------/
| Main Function
/------------------------------------------------------------------------------------------------------*/
function mainProcess()
{		
	var capFilterStatus = 0;
	var capFilterStatus1 = 0;	
	var noInspCap = 0;
	var capCount = 0;
	var capCount1 = 0;
	var capRecType = 0;
	var capFilterTaskDateNull = 0;
	var sCurrDate;
	var aResInspInfo = [];		
	
	
	var skipCap = false;

	//This is to load the AUTOMATED Record ID.
	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", "ALL");
	if(sepScriptConfig.getSuccess())
	{
		var sepScriptConfigArr = sepScriptConfig.getOutput();
		
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
						aResInspInfo.push({"Record Type" :sepNotifList[row]["Record Type"], "Inspection Group":sepNotifList[row]["Inspection Group"], "Inspection Type":sepNotifList[row]["Inspection Type"], "Inspection Result":sepNotifList[row]["Inspection Result"],  "Pending/Schedule":sepNotifList[row]["Pending/Schedule"], "Custom Field Name":sepNotifList[row]["Custom Field Name"], "Custom Field Value":sepNotifList[row]["Custom Field Value"], "Months/Days":sepNotifList[row]["Months/Days"], "When to Schedule":sepNotifList[row]["When to Schedule"], "Calendar/Work Days":sepNotifList[row]["Calendar/Work Days"], "New Inspection Group":sepNotifList[row]["New Inspection Group"], "New Inspection Type":sepNotifList[row]["New Inspection Type"], "Inspector":sepNotifList[row]["Inspector"], "Custom Date Field Name":sepNotifList[row]["Custom Date Field Name"], "Checklist Date Name":sepNotifList[row]["Checklist Date Name"], "Checklist Date Item":sepNotifList[row]["Checklist Date Item"], "Checklist Date Custom Group":sepNotifList[row]["Checklist Date Custom Group"], "Checklist Date Custom Subgroup":sepNotifList[row]["Checklist Date Custom Subgroup"], "Checklist Date Custom Field Name":sepNotifList[row]["Checklist Date Custom Field Name"], "Additional Query":sepNotifList[row]["Additional Query"], "Addtl Action to Perform":sepNotifList[row]["Addtl Action to Perform"]});
					}
				}
			}
		}		
		logDebug("Custom Table length:"+sepScriptConfigArr.length);
	}
	else
	{
		logMessage("Error: Getting Automated21-001 Record Information");
	}
	
	
	//Record id of Automated.
	//logDebug("CAPID:"+sepScriptConfigArr[0].getCapID());
	
	//see if any records are set up--check for "ALL", we are processing all records here.
	//Get the records
	var result = aa.expiration.getLicensesByStatus("Active");
	
	//var result = aa.cap.getByAppType("EnvHealth", "Land Use", "Solid Waste","Exemption");
	
	if (result.getSuccess())
	{
		caps = result.getOutput();		
		// for each record
		
		var inspId ="";
		
		for (i in caps)  
		{					
			if (elapsed() > maxSeconds) //only continue if time hasn't expired
			{
				logDebug("A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
				timeExpired = true ;
				break;
			}
			
			inspId = "";
			var inspType = "";
	        var inspResult = "";
			var	firtsName = "";
			var middelName = "";
			var lastName = "";
			var iDate = "";
			var inspUserId = false;
			
			//cnt += 1;
			skipCap = false;
			
			currCap = aa.cap.getCapID(caps[i].getCapID().getID1(), caps[i].getCapID().getID2(), caps[i].getCapID().getID3()).getOutput();
			
			if(currCap == null)
			{
				//logDebug("Cap Count-"+i);				
				//logDebug("Cap Null-"+caps[i]);
				capFilterTaskDateNull++;
				continue;
			}
			var capResult = aa.cap.getCap(currCap);
			var cap = capResult.getOutput();
			var capId = cap.getCapID();
			
			//TESTING
			/*
			if(cap.getCapModel().getAltID()!= "802738-44G-1")
			{
				continue;
			}
			*/
			
			
			//logDebug("For Cap: " + cap.getCapModel().getAltID() + " " + cap.getCapStatus());
			//logDebug("Getting Inspections");
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
						noInspCap++;				
						skipCap = true;
						break;
					}
					
					if(inspArray[ins].getInspectionDate()!=null) viDate = inspArray[ins].getInspectionDate().getEpochMilliseconds();
					else viDate ="";
					
					arrinsp.push({"id" : inspArray[ins].getIdNumber(), "result" : inspArray[ins].getInspectionStatus(), "type" : inspArray[ins].getInspectionType(), "idate" : viDate, "FirstName" :inspArray[ins].getInspector().getFirstName(),"MiddleName" :inspArray[ins].getInspector().getMiddleName(),"LastName" :inspArray[ins].getInspector().getLastName()});
					
					//logDebug(inspArray[ins].getInspectionStatus().toUpperCase());
					
				}
				
				//logDebug("Inspections Total:"+inspArray.length);
				
				
				if (arrinsp.length > 0)
				{
					//Change the order to validate the last Inspection first.
					arrinsp.sort(function (a, b) { return b.idate - a.idate; });
					inspType 	= arrinsp[arrinsp.length - 1]["type"];			
					inspResult 	= arrinsp[arrinsp.length - 1]["result"];	
					inspId 		= arrinsp[arrinsp.length - 1]["id"];
					firtsName 	= arrinsp[arrinsp.length - 1]["FirstName"];
					middelName	= arrinsp[arrinsp.length - 1]["MiddleName"];
					lastName 	= arrinsp[arrinsp.length - 1]["LastName"];
					iDate 		= arrinsp[arrinsp.length - 1]["idate"];
					
					//logDebug(inspId + " " + inspType + " Result:" + inspResult+ "-Inspector:"+firtsName+" "+middelName+" "+lastName+" - "+iDate);
				}
				
			}
			else
			{
				noInspCap++;
				skipCap = true;
				logDebug("No Previous Inspections for " + cap.getCapModel().getAltID());
			}
			
			if (!skipCap)
			{
				logDebug("For Cap: " + cap.getCapModel().getAltID() + " " + cap.getCapStatus());
				//capCount1++;
				appTypeResult = cap.getCapType(); //create CapTypeModel object
				appTypeString = appTypeResult.toString();
				//logDebug("App Type:"+appTypeString);
				appTypeArray = appTypeString.split("/");
				
				for(xx in aResInspInfo)
				{
					//logDebug("Record type Automated	:"+aResInspInfo[xx]["Record Type"].toString());
					//logDebug("Record type cap			:"+appTypeString);
					fInt=true;
					if(appTypeString == aResInspInfo[xx]["Record Type"].toString())
					{
						
						//aResInspInfo[xx]["Inspection Group"] == appTypeString
						
						for(nn in arrinsp)
						{
							//logDebug("Automated type:	"+aResInspInfo[xx]["Inspection Type"]);
							//logDebug("type:			"+arrinsp[nn]["type"]);
							
							if(arrinsp[nn]["type"].toString()== aResInspInfo[xx]["Inspection Type"].toString())
							{
								if(aResInspInfo[xx]["Inspector"]=="PRIOR")
								{
									if(arrinsp[nn]["FirstName"]	==null) 	sFirstName=""; 
									if(arrinsp[nn]["MiddleName"]==null) 	sMiddleName=""; 
									if(arrinsp[nn]["LastName"]	==null) 	sLastName=""; 
									
									if(arrinsp[nn]["FirstName"]	!=null) 	sFirstName 	= arrinsp[nn]["FirstName"];
									if(arrinsp[nn]["MiddleName"]!=null) 	sMiddleName = arrinsp[nn]["MiddleName"];
									if(arrinsp[nn]["LastName"]	!=null) 	sLastName 	= arrinsp[nn]["LastName"];
									
									//logDebug("FN"+sFirstName);
									//logDebug("MN"+sMiddleName);
									//logDebug("LN"+sLastName);
									
									inspUserObj = aa.person.getUser(sFirstName,sMiddleName,sLastName);
									if(inspUserObj != null) inspUserObj = inspUserObj.getOutput();
									if(inspUserObj!=null && inspUserObj != undefined) inspUserId = inspUserObj.getUserID();
									
									//logDebug("inspUserObj:"+inspUserObj);
									//logDebug("inspUserId :"+inspUserId);
									
								}

								if(arrinsp[nn]["result"].toString()== aResInspInfo[xx]["Inspection Result"].toString())
								{
									//logDebug("Record Type							:"+aResInspInfo[xx]["Record Type"]);
									//logDebug("Inspection Group						:"+aResInspInfo[xx]["Inspection Group"]);
									//logDebug("Inspection Type						:"+aResInspInfo[xx]["Inspection Type"]);
									//logDebug("Inspection Result						:"+aResInspInfo[xx]["Inspection Result"]);
									//logDebug("Pending/Schedule						:"+aResInspInfo[xx]["Pending/Schedule"]);
									//logDebug("Custom Field Name						:"+aResInspInfo[xx]["Custom Field Name"]);
									//logDebug("Custom Field Value					:"+aResInspInfo[xx]["Custom Field Value"]);
									//logDebug("Months/Days							:"+aResInspInfo[xx]["Months/Days"]);
									//logDebug("When to Schedule						:"+aResInspInfo[xx]["When to Schedule"]);
									//logDebug("Calendar/Work Days					:"+aResInspInfo[xx]["Calendar/Work Days"]);
									//logDebug("New Inspection Group					:"+aResInspInfo[xx]["New Inspection Group"]);
									//logDebug("New Inspection Type					:"+aResInspInfo[xx]["New Inspection Type"]);
									//logDebug("Inspector								:"+aResInspInfo[xx]["Inspector"]);
									//logDebug("Custom Date Field Name				:"+aResInspInfo[xx]["Custom Date Field Name"]);
									//logDebug("Checklist Date Name					:"+aResInspInfo[xx]["Checklist Date Name"]);
									//logDebug("Checklist Date Item					:"+sepNotifList[row]["Checklist Date Item"]);
									//logDebug("Checklist Date Custom Group			:"+aResInspInfo[xx]["Checklist Date Custom Group"]);
									//logDebug("Checklist Date Custom Subgroup		:"+aResInspInfo[xx]["Checklist Date Custom Subgroup"]);
									//logDebug("Checklist Date Custom Field Name		:"+aResInspInfo[xx]["Checklist Date Custom Field Name"]);
									//logDebug("Additional Query						:"+aResInspInfo[xx]["Additional Query"]);
									//logDebug("Addtl Action to Perform				:"+aResInspInfo[xx]["Addtl Action to Perform"]);
									
									if(sepScheduleInspection_DataConv(aResInspInfo[xx]["Record Type"], aResInspInfo[xx]["Inspection Group"], aResInspInfo[xx]["Inspection Type"], aResInspInfo[xx]["Inspection Result"], aResInspInfo[xx]["Pending/Schedule"], aResInspInfo[xx]["Custom Field Name"], aResInspInfo[xx]["Custom Field Value"], aResInspInfo[xx]["Months/Days"], aResInspInfo[xx]["When to Schedule"], aResInspInfo[xx]["Calendar/Work Days"], aResInspInfo[xx]["New Inspection Group"], aResInspInfo[xx]["New Inspection Type"], aResInspInfo[xx]["Inspector"], aResInspInfo[xx]["Custom Date Field Name"], aResInspInfo[xx]["Checklist Date Name"], sepNotifList[row]["Checklist Date Item"], aResInspInfo[xx]["Checklist Date Custom Group"], aResInspInfo[xx]["Checklist Date Custom Subgroup"], aResInspInfo[xx]["Checklist Date Custom Field Name"], aResInspInfo[xx]["Additional Query"],aResInspInfo[xx]["Addtl Action to Perform"], cap.getCapID(),inspUserId)==false)
									{
										fInt = false;		
										break; 
									}
								}
								
							}
						}
					}
										
					if(!fInt)
					{
						capCount++;
						//capCount1=capCount1-1;
						break;
					}
				}
				if(fInt)
				{
					capRecType++;
				}
					
			}
			
			//if (capCount == 10) break;	
			
		}
	}
	else
	{		
		logMessage("Error");	
	}
	logMessage("------------------------------------------------------------");
	logMessage("		Total Licenses Active:		" + caps.length);
//	logMessage("		Total Records qualified:	" + sepScriptConfigArr.length);	
	logMessage("		Ignored due Record Val: 	" + capRecType);
	logMessage("		Ignored due Inspections: 	" + noInspCap);
	logMessage("		Ignored due Insp Scheduled:	" + capCount1);
//	logMessage("		Ignored due to Task Status: " + capFilterStatus1);
	logMessage("		Ignored due to cap Null:	" + capFilterTaskDateNull);
	logMessage("		Total Records processed:	" + capCount);
	logMessage("------------------------------------------------------------");
}

/*------------------------------------------------------------------------------------------------------/
| 			External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/
//Gets parameter value and logs message showing param value
function getParam(pParamName) 
{
	var ret = "" + aa.env.getValue(pParamName);
	logDebug("Parameter : " + pParamName+" = "+ret);
	return ret;
}

function elapsed() 
{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000)
}


// Yash 19 Jan 2021. Function to schedule an inspection for the first time after data conversion.
function sepScheduleInspection_DataConv(recdType, ssInsGroup, sInsType, sInsResult, pendSched, asiField, asiValue, monthDays, whenSched, calWkgDay, insNewGroup, insNewType, inspectorId, asiDateName, chklstDateName, chklstDateItem, chklstDateGroup, chklstDateSubGroup, chklstDateFieldName, addtlQuery, actionExpression, capId,vInspUserId) 
{
	try
	{
		currDate = new Date();
		//logDebug("recdType           "+recdType            );
		//logDebug("ssInsGroup         "+ssInsGroup          );
		//logDebug("sInsType           "+sInsType            );
		//logDebug("sInsResult         "+sInsResult          );
		//logDebug("pendSched          "+pendSched           );
		//logDebug("asiField           "+asiField            );
		//logDebug("asiValue           "+asiValue            );
		//logDebug("monthDays          "+monthDays           );
		//logDebug("whenSched          "+whenSched           );
		//logDebug("calWkgDay          "+calWkgDay           );
		//logDebug("insNewGroup        "+insNewGroup         );
		//logDebug("insNewType         "+insNewType          );
		//logDebug("inspectorId        "+inspectorId         );
		//logDebug("asiDateName        "+asiDateName         );
		//logDebug("chklstDateName     "+chklstDateName      );
		//logDebug("chklstDateItem     "+chklstDateItem      );
		//logDebug("chklstDateGroup    "+chklstDateGroup     );
		//logDebug("chklstDateSubGroup "+chklstDateSubGroup  );
		//logDebug("chklstDateFieldName"+chklstDateFieldName );
		//logDebug("addtlQuery         "+addtlQuery          );
		//logDebug("actionExpression   "+actionExpression    );
		//logDebug("capId              "+capId               );
			
		
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
			//logDebug(capId);
			//logDebug("appMatch");
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
			if ((chkFilter.length==0 ||eval(chkFilter)))
			{
				if(insNewGroup)
				{
					var cFld = "" + asiField;
					var custFld = cFld.trim();
					var cVal = "" + asiValue;
					var custVal = cVal.trim();
					var CInfo = [];
					//logDebug("Calling LoadAppSpecific");
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
								if(cldName!="")logDebug("cldName: " + cldName);
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
									
									//logDebug("cklDateName: " +cklDateName);
									//logDebug("cklDateItem: " +cklDateItem);
									//logDebug("cklDateGroup: " +cklDateGroup);
									//logDebug("cklDateSubGroup: " +cklDateSubGroup);
									//logDebug("cklDateField: " +cklDateField);
									
									/*if(inspId != undefined || inspId == "")
									{
										//whenSched = getGuidesheetASIValue(inspId,cklDateName,cklDateItem,cklDateGroup,cklDateSubGroup, cklDateField);
									}
									else
									{
										whenSched == false;
									}
									*/
									if(!whenSched || whenSched =="")
									{
										logDebug("Error retrieving checklist item. Setting days to 30.");
										whenSched = 30;
									}
									//logDebug("whenSched: " +whenSched);
									
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
										//logDebug("YEARS: " + whenSched);
										var dtSched = dateAddMonths(currDate,parseInt(whenSched)*12);
									}
									else
									{
										if(monthDays.toUpperCase()=="MONTHS")
										{
											//logDebug("MONTHS: " + whenSched);
											
											var dtSched = dateAddMonths(currDate,parseInt(whenSched));
											//logDebug("MONTHS: " + whenSched);
											
										}
										else
										{
											calWkgDay = ""+calWkgDay;
											if(calWkgDay.toUpperCase()=="WORKING")
											{
												var dtSched = dateAdd(currDate,parseInt(whenSched),true);
											}
											else
											{
												var dtSched = dateAdd(currDate,parseInt(whenSched));
												//logDebug("WORKING: " + whenSched);
											}
										}
									}
								}
								
								currCap1 = aa.cap.getCapID(capId.getID1(), capId.getID2(), capId.getID3()).getOutput();
			
								var capResult = aa.cap.getCap(currCap1);
								var cap1 = capResult.getOutput();
								var capId1 = cap1.getCapID();
								
								//logDebug("dtSched: " + dtSched);
								if(!dtSched)
								{
									logDebug("No scheduled date was found. Defaulting to one month");
									dtSched=dateAddMonths(currDate,1);
								}
								
								//logDebug("Days:"+daysBetween(currDate,dtSched));
								logDebug("Scheduling inspection:"+sInsType+" for: " + cap1.getCapModel().getAltID());
								//scheduleInspection(sInsType,daysBetween(currDate,dtSched));
								
								
								if(vInspUserId==false || vInspUserId==null )
								{
									var inspRes = aa.person.getUser("SOLANO");
									if (inspRes.getSuccess())
									{	
										var inspectorObj = inspRes.getOutput();
									}
								}
								else
								{									
									var inspRes = aa.person.getUser(vInspUserId)
									if (inspRes.getSuccess())
									{	
										var inspectorObj = inspRes.getOutput();
									}
								}
								
								if(inspectorId=="PRIOR" && inspectorObj != null)
								{
									//Schedule an inspection.
									//var schedRes = aa.inspection.scheduleInspection(capId1, inspectorObj, aa.date.parseDate(dateAdd(null,daysBetween(currDate,dtSched))), null, sInsType, null);
									var schedRes = aa.inspection.scheduleInspection(capId1, inspectorObj, aa.date.parseDate(dtSched), null, sInsType, null);
									
									if (schedRes.getSuccess())
									{
										//logDebug("InsResultFunction:"+schedRes.getOutput());
										logDebug("Successfully scheduled inspection : " + sInsType + " for " + dtSched+"-Inspector:"+vInspUserId);
										return false;
									}
									else
									{
										logDebug( "**ERROR: adding scheduling inspection (" + sInsType + "): " + schedRes.getErrorMessage());
										return false;
										//continue;
									}
								}
								if(inspectorId=="AUTO" || inspectorObj==null)
								{
									var schedRes = aa.inspection.scheduleInspection(capId1, inspectorObj, aa.date.parseDate(dateAdd(null,daysBetween(currDate,dtSched))), null, sInsType, null);
	
									if (schedRes.getSuccess())
									{
										//logDebug("InsResultFunction:"+schedRes.getOutput());
										logDebug("Successfully scheduled inspection : " + sInsType + " for " + dtSched);
										var newInspId = schedRes.getOutput();
										newInspId = ""+newInspId;
										inspectorId = ""+inspectorId;
										//logDebug("newInspId:"+newInspId);
										sepAutoAssignInspection(newInspId,capId1);
										return false;
									}
									else
									{
										logDebug( "**ERROR: adding scheduling inspection (" + sInsType + "): " + schedRes.getErrorMessage());
										return false;
										//continue;
									}
								}
								
								//logDebug("lastInspid:"+lastInspid);
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


//Gets the script contect
function getScriptText(vScriptName, servProvCode, useProductScripts) 
{
	if (!servProvCode)  servProvCode = aa.getServiceProviderCode();
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try 
	{
		if (useProductScripts) 
		{
			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
		}  
		else 
		{
			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
		}
		return emseScript.getScriptText() + "";
	} 
	catch (err) 
	{
		return ""; 
	}
}


function checkInspectionsLastDate(insp2Result)
	{
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
			var vDaysDiffHigh = 0;
			var vLastDate = false;
			var inspList = inspResultObj.getOutput();
			for (xx in inspList)
			{
				if (String(insp2Result).equals(inspList[xx].getInspectionStatus()))
				{
					//printProperties(inspList[xx]);
					vLastDate = convertDate(inspList[xx].getInspectionDate());
					logDebug("Date "+ vLastDate);
					logDebug("Days Between " + daysBetween(vLastDate,currDate));
					//if(daysBetween(vLastDate,sCurrDate) )
					//return true;
					if (vDaysDiffHigh <= daysBetween(vLastDate,currDate))
					{									
						vDaysDiffHigh = daysBetween(vLastDate,currDate);
					}						
				}				
			}
			logDebug("vDaysDiffHigh " + vDaysDiffHigh);
			
			return vDaysDiffHigh;
		}
		else return false;
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


function daysBetween(date1, date2) 
{
  //Get 1 day in milliseconds
  var one_day=1000*60*60*24;

  // Convert both dates to milliseconds
  var date1_ms = new Date(date1).getTime();
  var date2_ms = new Date(date2).getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;
    
  // Convert back to days and return
  return Math.round(difference_ms/one_day);
}

//get Inspection Id, with CapId passed via Parameter
function sepGetScheduledInspId(insp2Check,vCapId)
	{
	// warning, returns only the first scheduled occurrence
	var inspResultObj = aa.inspection.getInspections(vCapId);
	if (inspResultObj.getSuccess())
		{
		var inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(insp2Check).equals(inspList[xx].getInspectionType()) && inspList[xx].getInspectionStatus().toUpperCase().equals("SCHEDULED"))
				return inspList[xx].getIdNumber();
		}
	return false;
	}


function sepAutoAssignInspection(iNumber,vCapId)
{
	// updates the inspection and assigns to a new user
	// requires the inspection id
	//

	iObjResult = aa.inspection.getInspection(vCapId,iNumber);
	if (!iObjResult.getSuccess())
		{ logDebug("**ERROR retrieving inspection " + iNumber + " : " + iObjResult.getErrorMessage()) ; return false ; }
	
	iObj = iObjResult.getOutput();


	inspTypeResult = aa.inspection.getInspectionType(iObj.getInspection().getInspectionGroup(), iObj.getInspectionType())

	if (!inspTypeResult.getSuccess())
		{ logDebug("**ERROR retrieving inspection Type " + inspTypeResult.getErrorMessage()) ; return false ; }
	
	inspTypeArr = inspTypeResult.getOutput();

        if (inspTypeArr == null || inspTypeArr.length == 0)
		{ logDebug("**ERROR no inspection type found") ; return false ; }

	inspType = inspTypeArr[0]; // assume first

	inspSeq = inspType.getSequenceNumber();

	inspSchedDate = iObj.getScheduledDate().getYear() + "-" + iObj.getScheduledDate().getMonth() + "-" + iObj.getScheduledDate().getDayOfMonth()

 	//logDebug("inspSchedDate:"+inspSchedDate);
	//logDebug("inspSeq:"+inspSeq);
	//logDebug("getID1:"+vCapId.getID1());
	//logDebug("getID2:"+vCapId.getID2());
	//logDebug("getID3:"+vCapId.getID3());

	iout =  aa.inspection.autoAssignInspector(vCapId.getID1(),vCapId.getID2(),vCapId.getID3(), inspSeq, inspSchedDate)

	if (!iout.getSuccess())
		{ logDebug("**ERROR retrieving auto assign inspector " + iout.getErrorMessage()) ; return false ; }

	inspectorArr = iout.getOutput();

	if (inspectorArr == null || inspectorArr.length == 0)
		{ logDebug("**WARNING no auto-assign inspector found") ; return false ; }
	
	inspectorObj = inspectorArr[0];  // assume first
	
	iObj.setInspector(inspectorObj);

	assignResult = aa.inspection.editInspection(iObj)

	if (!assignResult.getSuccess())
		{ logDebug("**ERROR re-assigning inspection " + assignResult.getErrorMessage()) ; return false ; }
	else
		logDebug("Successfully reassigned inspection " + iObj.getInspectionType() + " to user " + inspectorObj.getUserID());

}

//Get last inspetor CapId like parameter
// function getLastInspector: returns the inspector ID (string) of the last inspector to result the inspection.
function sepGetLastInspector(insp2Check,vCapId)
{
	var inspResultObj = aa.inspection.getInspections(vCapId);
	if (inspResultObj.getSuccess())
	{
		inspList = inspResultObj.getOutput();
		inspList.sort(compareInspDateDesc)
		for (xx in inspList)
		{
			if (String(insp2Check).equals(inspList[xx].getInspectionType()) && !inspList[xx].getInspectionStatus().equals("Scheduled"))
			{
				// have to re-grab the user since the id won't show up in this object.
				inspUserObj = aa.person.getUser(inspList[xx].getInspector().getFirstName(),inspList[xx].getInspector().getMiddleName(),inspList[xx].getInspector().getLastName()).getOutput();
				return inspUserObj.getUserID();
			}
		}
	}
	return null;
}