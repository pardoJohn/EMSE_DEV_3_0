//INCLUDES_SEP_CUSTOM START
function doScriptActions() {
	if (typeof(appTypeArray) == "object") {
		include(prefix + ":*/*/*/*");
		include(prefix + ":" + appTypeArray[0] + "/*/*/*");
		include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/*/*");
		include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/*");
		include(prefix + ":" + appTypeArray[0] + "/*/" + appTypeArray[2] + "/*");
		include(prefix + ":" + appTypeArray[0] + "/*/" + appTypeArray[2] + "/" + appTypeArray[3]);
		include(prefix + ":" + appTypeArray[0] + "/*/*/" + appTypeArray[3]);
		include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/*/" + appTypeArray[3]);
		include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/" + appTypeArray[3]);
	}
}

function sepGetReqdDocs() {
try{
	//see if any records are set up--module can be specific or "ALL", look for both
	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", appTypeArray[0]);
	if(sepScriptConfig.getSuccess()){
		var sepScriptConfigArr = sepScriptConfig.getOutput();
		if(sepScriptConfigArr.length<1){
			var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", "ALL");
			if(sepScriptConfig.getSuccess()){
				var sepScriptConfigArr = sepScriptConfig.getOutput();
			}
		}
		if(sepScriptConfigArr.length>0){
			var retArray = [];
			if(publicUser){
				var submittedDocList = aa.document.getDocumentListByEntity(capId,"TMP_CAP").getOutput().toArray();
			}else{
				var vEventName = aa.env.getValue("EventName");
				if(vEventName.indexOf("ApplicationSubmitBefore")>-1){
					var submittedDocList = aa.env.getValue("DocumentModelList");
					if(submittedDocList.length>0){
						for (var counter = 0; counter < submittedDocList.size(); counter++) {
							var doc = submittedDocList.get(counter);
							logDebug("category: " + doc.getDocCategory()) ;
						}
					}	
				}else{
					var submittedDocList = aa.document.getDocumentListByEntity(capId,"CAP").getOutput().toArray();
				}
			}
			uploadedDocs = new Array();
			if(vEventName.indexOf("ApplicationSubmitBefore")>-1){
				if(submittedDocList.length>0){
					for (var counter = 0; counter < submittedDocList.size(); counter++) {
						var doc = submittedDocList.get(counter);
						//logDebug("category: " + doc.getDocCategory()) ;
						uploadedDocs[doc.getDocGroup() +"-"+ doc.getDocCategory()] = true;
					}
				}
			}else{
				for (var i in submittedDocList ){
					//logDebug("submittedDocList[i].getDocGroup() : " + submittedDocList[i].getDocGroup());
					//logDebug("submittedDocList[i].getDocCategory() : " + submittedDocList[i].getDocCategory());
					uploadedDocs[submittedDocList[i].getDocGroup() +"-"+ submittedDocList[i].getDocCategory()] = true;
				}
			}
			for(sep in sepScriptConfigArr){
				var cfgCapId = sepScriptConfigArr[sep].getCapID();
				if(vEventName.indexOf("Workflow")>-1){
					var sepReqdDocs = loadASITable("REQD DOCUMENTS - WORKFLOW",cfgCapId);
				}else{
					var sepReqdDocs = loadASITable("REQD DOCUMENTS - APP SUBMITTAL",cfgCapId);
				}
				for(row in sepReqdDocs){
					if(sepReqdDocs[row]["Active"]=="Yes"){
						var appMatch = true;
						var recdType = sepReqdDocs[row]["Record Type"];
						var recdTypeArr = "" + recdType
						var arrAppType = recdTypeArr.split("/");
						if (arrAppType.length != 4){
							logDebug("The record type is incorrectly formatted: " + recdType);
						}else{
							if(vEventName.indexOf("ApplicationSubmitBefore")>-1){
								var aTypeLevel=[];
								aTypeLevel[0] = aa.env.getValue("ApplicationTypeLevel1");
								aTypeLevel[1] = aa.env.getValue("ApplicationTypeLevel2");
								aTypeLevel[2] = aa.env.getValue("ApplicationTypeLevel3");
								aTypeLevel[3] = aa.env.getValue("ApplicationTypeLevel4");
								for (xx in arrAppType){
									if (!arrAppType[xx].equals(aTypeLevel[xx]) && !arrAppType[xx].equals("*")){
										appMatch = false;
									}
								}
							}else{
								for (xx in arrAppType){
									if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
										appMatch = false;
									}
								}
							}
						}
						if (appMatch){
							var wkFlMatch = false;
							if(vEventName.indexOf("Workflow")<0){
								wkFlMatch = true;
							}else{
								var tName = ""+sepReqdDocs[row]["Task Name"];
								var taskName = tName.trim();
								var tStatus = ""+sepReqdDocs[row]["Task Status"];
								var taskStatus = tStatus.trim();
								if((matches(taskName,null,"","undefined") || wfTask==taskName) && wfStatus == taskStatus){
									wkFlMatch = true;
								}
							}
							if(wkFlMatch){
								var cFld = ""+sepReqdDocs[row]["Custom Field Name"];
								var custFld = cFld.trim();
								var cVal = ""+sepReqdDocs[row]["Custom Field Value"];
								var custVal = cVal.trim();
								var addtlQuery = sepReqdDocs[row]["Additional Query"];
								logDebug("Additional Query field: " + addtlQuery);
								var dGroup = ""+sepReqdDocs[row]["Document Group"];
								var docGroup = dGroup.trim();
								var dType = ""+sepReqdDocs[row]["Document Type"];
								var docType = dType.trim();
								//logDebug("dGroup: " + dGroup);
								//logDebug("dType: " + dType);
								if(matches(custFld,"",null,"undefined") || custVal==AInfo[custFld]){
									var chkFilter = ""+addtlQuery;
									if (chkFilter.length==0 || eval(chkFilter) ) {
										//doc is required, see if it's been uploaded
										if(uploadedDocs[docGroup +"-"+ docType] == undefined) {	
											var thisArray = [];
											thisArray["docGroup"]=docGroup;
											thisArray["docType"]=docType;
											retArray.push(thisArray);
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
	if(retArray.length>0){
		return retArray;
	}else{
		return false;
	}
}catch(err){
	logDebug("An error occurred in sepGetReqdDocs: " + err.message);
	logDebug(err.stack);
}}

function sepEmailNotifContactWkfl(recdType, contactType, respectPriChannel, notName, rName, taskName, taskStatus, sysFromEmail, addtlQuery) {
try{
	if((matches(taskName,null,"","undefined") || wfTask==""+taskName) && wfStatus == ""+taskStatus){
		var appMatch = true;
		var recdTypeArr = "" + recdType
		var arrAppType = recdTypeArr.split("/");
		if (arrAppType.length != 4){
			logDebug("The record type is incorrectly formatted: " + recdType);
			return false;
		}else{
			for (xx in arrAppType){
				if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
					appMatch = false;
				}
			}
		}
		if (appMatch){
			var chkFilter = ""+addtlQuery;
			logDebug("Additional Query field: " + addtlQuery);
			if (chkFilter.length==0 ||eval(chkFilter) ) {
				var cntType = ""+contactType;
				logDebug("cntType: " + cntType);
				if(cntType.indexOf(",")>-1){
					var arrType = cntType.split(",");
					for(con in arrType){
						var priContact = getContactObj(capId,arrType[con]);
						sepProcessContactsForNotif(priContact, notName, rName, sysFromEmail, respectPriChannel);
					}
				}else{
					if(cntType.toUpperCase()=="ALL"){
						var arrType = getContactObjs(capId);
						for(con in arrType){
							sepProcessContactsForNotif(arrType[con], notName, rName, sysFromEmail, respectPriChannel);
						}
					}else{
						var priContact = getContactObj(capId,cntType);
						sepProcessContactsForNotif(priContact, notName, rName, sysFromEmail, respectPriChannel);
					}						
				}						
			}
		}
	}
}catch(err){
	logDebug("An error occurred in sepEmailNotifContactWkfl: " + err.message);
	logDebug(err.stack);
}}

function sepEmailNotifContactInsp(recdType, contactType, respectPriChannel, notName, rName, inspName, inspStatus, sysFromEmail, addtlQuery) {
try{
	if((matches(inspName,null,"","undefined") || inspType==""+inspName) && (inspStatus.toUpperCase()=="ALL" || inspResult == ""+inspStatus)){
		var appMatch = true;
		var recdTypeArr = "" + recdType
		var arrAppType = recdTypeArr.split("/");
		if (arrAppType.length != 4){
			logDebug("The record type is incorrectly formatted: " + recdType);
			return false;
		}else{
			for (xx in arrAppType){
				if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
					appMatch = false;
				}
			}
		}
		if (appMatch){
			var chkFilter = ""+addtlQuery;
			logDebug("Additional Query field: " + addtlQuery);
			if (chkFilter.length==0 ||eval(chkFilter) ) {
				var cntType = ""+contactType;
				logDebug("cntType: " + cntType);
				if(cntType.indexOf(",")>-1){
					var arrType = cntType.split(",");
					for(con in arrType){
						var priContact = getContactObj(capId,arrType[con]);
						sepProcessContactsForNotif(priContact, notName, rName, sysFromEmail, respectPriChannel);
					}
				}else{
					if(cntType.toUpperCase()=="ALL"){
						var arrType = getContactObjs(capId);
						for(con in arrType){
							sepProcessContactsForNotif(arrType[con], notName, rName, sysFromEmail, respectPriChannel);
						}
					}else{
						var priContact = getContactObj(capId,cntType);
						sepProcessContactsForNotif(priContact, notName, rName, sysFromEmail, respectPriChannel);
					}						
				}						
			}
		}
	}
}catch(err){
	logDebug("An error occurred in sepEmailNotifContactInsp: " + err.message);
	logDebug(err.stack);
}}



function sepEmailNotifContactAppSub(recdType, contactType, respectPriChannel, notName, rName, sysFromEmail, addtlQuery) {
try{
	var appMatch = true;
	var recdTypeArr = "" + recdType
	var arrAppType = recdTypeArr.split("/");
	if (arrAppType.length != 4){
		logDebug("The record type is incorrectly formatted: " + recdType);
		return false;
	}else{
		for (xx in arrAppType){
			if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
				appMatch = false;
			}
		}
	}
	if (appMatch){
		var chkFilter = ""+addtlQuery;
		logDebug("Additional Query field: " + addtlQuery);
		if (chkFilter.length==0 ||eval(chkFilter) ) {
			var cntType = ""+contactType;
			if(cntType.indexOf(",")>-1){
				var arrType = cntType.split(",");
				for(con in arrType){
					var priContact = getContactObj(capId,arrType[con]);
					sepProcessContactsForNotif(priContact, notName, rName, sysFromEmail,respectPriChannel);
				}
			}else{
				if(cntType.toUpperCase()=="ALL"){
					var arrType = getContactObjs(capId);
					for(con in arrType){
						sepProcessContactsForNotif(arrType[con], notName, rName, sysFromEmail, respectPriChannel);
					}
				}else{
					var priContact = getContactObj(capId,cntType);
					sepProcessContactsForNotif(priContact, notName, rName, sysFromEmail, respectPriChannel);
				}						
			}						
		}
	}
}catch(err){
	logDebug("An error occurred in sepEmailNotifContactAppSub: " + err.message);
	logDebug(err.stack);
}}

function sepSchedInspectionAppSub(recdType, sInsGroup, sInsType, pendSched, asiField, asiValue, daysAhead, calWkgDay, inspName, addtlQuery) {
try{
	var appMatch = true;
	var recdTypeArr = "" + recdType
	var arrAppType = recdTypeArr.split("/");
	if (arrAppType.length != 4){
		logDebug("The record type is incorrectly formatted: " + recdType);
		return false;
	}else{
		for (xx in arrAppType){
			if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
				appMatch = false;
			}
		}
	}
	if (appMatch){
		var chkFilter = ""+addtlQuery;
		logDebug("Additional Query field: " + addtlQuery);
		if (chkFilter.length==0 ||eval(chkFilter) ) {
			var cFld = ""+asiField;
			var custFld = cFld.trim();
			var cVal = ""+asiValue;
			var custVal = cVal.trim();
			if(matches(custFld,"",null,"undefined") || custVal==AInfo[custFld]){
				var pendOrSched = ""+pendSched;
				if(pendOrSched.toUpperCase()=="PENDING"){
					createPendingInspection(sInsGroup,sInsType);
				}else{
					if(calWkgDay.toUpperCase()=="WORKING"){
						var dtSched = dateAdd(sysDate,daysAhead,true);
					}else{
						var dtSched = dateAdd(sysDate,daysAhead);
					}
					sepScheduleInspectDate(sInsType,dtSched);
					if(!matches(inspName,"",null,"undefined")){
						var inspId = getScheduledInspId(sInsType);
						inspName = ""+inspName;
						if(inspName.toUpperCase()=="AUTO"){
							autoAssignInspection(inspId);
						}else{
							assignInspection(inspId, inspName);
						}
					}
				}
			}
		}
	}
}catch(err){
	logDebug("An error occurred in sepSchedInspectionAppSub: " + err.message);
	logDebug(err.stack);
}}

function sepSchedInspectionWkfl(recdType, taskName, taskStatus, sInsGroup, sInsType, pendSched, asiField, asiValue, monthDays, whenSched, calWkgDay, inspectorId, addtlQuery) {
try{
	var appMatch = true;
	var recdTypeArr = "" + recdType
	var arrAppType = recdTypeArr.split("/");
	if (arrAppType.length != 4){
		logDebug("The record type is incorrectly formatted: " + recdType);
		return false;
	}else{
		for (xx in arrAppType){
			if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
				appMatch = false;
			}
		}
	}
	if (appMatch && (!matches(taskName,"",null,"undefined" || wfTask==taskName) && wfStatus==taskStatus)){
		var chkFilter = ""+addtlQuery;
		logDebug("Additional Query field: " + addtlQuery);
		if (chkFilter.length==0 ||eval(chkFilter) ) {
			var cFld = ""+asiField;
			var custFld = cFld.trim();
			var cVal = ""+asiValue;
			var custVal = cVal.trim();
			if(matches(custFld,"",null,"undefined") || custVal==AInfo[custFld]){
				var pendOrSched = ""+pendSched;
				if(pendOrSched.toUpperCase()=="PENDING"){
					createPendingInspection(sInsGroup,sInsType);
				}else{
					if(monthDays.toUpperCase()=="MONTHS"){
						var dtSched = dateAddMonths(sysDate,parseInt(whenSched));
					}else{
						if(calWkgDay.toUpperCase()=="WORKING"){
							var dtSched = dateAdd(sysDate,parseInt(whenSched),true);
						}else{
							var dtSched = dateAdd(sysDate,parseInt(whenSched));
						}
					}
					sepScheduleInspectDate(sInsType,dtSched);
					if(!matches(inspectorId,"",null,"undefined")){
						var inspId = getScheduledInspId(sInsType);
						inspId = ""+inspId;
						if(inspectorId.toUpperCase()=="AUTO"){
							autoAssignInspection(inspId);
						}else{
							if(inspectorId.toUpperCase()=="PRIOR"){
								var lastInspid = ""+getLastInspector(sInsType);
								if(lastInspid!=null){
									assignInspection(inspId, lastInspid);
								}else{
									assignInspection(inspId, inspectorId);
								}
							}
						}
					}
				}
			}
		}
	}
}catch(err){
	logDebug("An error occurred in sepSchedInspectionWkfl: " + err.message);
	logDebug(err.stack);
}}

function sepReSchedInspection(recdType, ssInsGroup, sInsType, sInsResult, pendSched, asiField, asiValue, monthDays, whenSched, calWkgDay, insNewGroup, insNewType, inspectorId, asiDateName, chklstDateName, chklstDateItem, chklstDateGroup, chklstDateSubGroup, chklstDateFieldName, addtlQuery, actionExpression) {
try{
	var appMatch = true;
	var recdTypeArr = "" + recdType
	var arrAppType = recdTypeArr.split("/");
	if (arrAppType.length != 4){
		logDebug("The record type is incorrectly formatted: " + recdType);
		return false;
	}else{
		for (xx in arrAppType){
			if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
				appMatch = false;
			}
		}
	}
	if (appMatch){
		logDebug("appMatch");
		var chkFilter = ""+addtlQuery;
		var isInspType = ""+inspType;
		var ssInsType = ""+sInsType;
		logDebug("---------------------------------------");
		logDebug("Additional Query field: " + addtlQuery);
		logDebug("chkFilter: " + chkFilter.length);
		logDebug("isInspType: " + isInspType);
		logDebug("ssInsType: " + ssInsType);
		logDebug("isInspType.toString()==ssInsType.toString(): " + isInspType==ssInsType);
		logDebug("inspResult: " + inspResult);
		logDebug("sInsResult: " + sInsResult);
		logDebug("inspResult.toString()==sInsResult.toString(): " + inspResult.toString()==sInsResult.toString());
		logDebug("---------------------------------------");
		if ((chkFilter.length==0 ||eval(chkFilter)) && inspType.toString()==sInsType.toString() && inspResult.toString()==sInsResult.toString()) {
			if(insNewGroup){
				var cFld = ""+asiField;
				var custFld = cFld.trim();
				var cVal = ""+asiValue;
				var custVal = cVal.trim();
				if(matches(custFld,"",null,"undefined") || custVal==AInfo[custFld]){
					var pendOrSched = ""+pendSched;
					if(pendOrSched.toUpperCase()=="PENDING"){
						createPendingInspection(insNewGroup,insNewType);
					}else{
						var dtSchedDays = false;
						var cdFld = ""+asiDateName;
						if(!matches(cdFld,"",null,"undefined")){
							var custDtFld = cdFld.trim();
							dtSched = AInfo[custDtFld];
						}else{
							var cldName = ""+chklstDateName;
							if(!matches(cldName,"",null,"undefined")){
								var cklDateName = cldName.trim();
								var cldItem = ""+chklstDateItem;
								var cklDateItem = cldItem.trim();
								var cldGroup = ""+chklstDateGroup;
								var cklDateGroup = cldGroup.trim();
								var cldSGroup = ""+chklstDateSubGroup;
								var cklDateSubGroup = cldSGroup.trim();
								var cldField = ""+chklstDateFieldName;
								var cklDateField = cldField.trim();
								//logDebug("inspId: " +inspId);
								//logDebug("cklDateName: " +cklDateName);
								//logDebug("cklDateItem: " +cklDateItem);
								//logDebug("cklDateGroup: " +cklDateGroup);
								//logDebug("cklDateSubGroup: " +cklDateSubGroup);
								//logDebug("cklDateField: " +cklDateField);
								var dtSchedDays = getGuidesheetASIValue(inspId,cklDateName,cklDateItem,cklDateGroup,cklDateSubGroup, cklDateField);
								if(dtSchedDays){
									var dtSched = dateAdd(sysDate,parseInt(dtSchedDays));
									//logDebug("GUIDE: " + dtSched);
								}
							}else{
								var pendOrSched = ""+pendSched;
								if(pendOrSched.toUpperCase()=="PENDING"){
									createPendingInspection(insNewGroup,insNewType);
								}else{
									monthDays = ""+monthDays;
									if(monthDays.toUpperCase()=="YEARS"){
										//logDebug("YEARS: " + dtSched);
										var dtSched = dateAddMonths(sysDate,parseInt(whenSched)*12);
									}else{
										if(monthDays.toUpperCase()=="MONTHS"){
											//logDebug("MONTHS: " + dtSched);
											var dtSched = dateAddMonths(sysDate,parseInt(whenSched));
										}else{
											calWkgDay = ""+calWkgDay;
											if(calWkgDay.toUpperCase()=="WORKING"){
												var dtSched = dateAdd(sysDate,parseInt(whenSched),true);
											}else{
												var dtSched = dateAdd(sysDate,parseInt(whenSched));
												//logDebug("WORKING: " + dtSched);
											}
										}
									}
								}
							}
							logDebug("dtSched: " + dtSched);
							if(!dtSched){
								logDebug("No scheduled date was found. Defaulting to one month");
								dtSched=dateAddMonths(null,1);
							}
							sepScheduleInspectDate(insNewType,dtSched);
							if(!matches(inspectorId,"",null,"undefined")){
								var newInspId = getScheduledInspId(insNewType);
								newInspId = ""+newInspId;
								inspectorId = ""+inspectorId;
								if(inspectorId.toUpperCase()=="AUTO"){
									autoAssignInspection(newInspId);
								}else{
									if(inspectorId.toUpperCase()=="PRIOR"){
										var lastInspid = ""+getLastInspector(sInsType);
										if(lastInspid!=null){
											assignInspection(newInspId, lastInspid);
										}else{
											assignInspection(newInspId, inspectorId);
										}
									}
								}
							}
						}
					}
					// execute custom expression
					if (!matches(actionExpression, "", null, "undefined")) {
						actionExpression = ''+ actionExpression;
						logDebug("Executing action expression : " + actionExpression);
						var result = eval(actionExpression);
						logDebug("result: " + result);
					}
				}
			}
		}
	}
}catch(err){
	logDebug("An error occurred in sepReSchedInspection: " + err.message);
	logDebug(err.stack);
}}

function sepProcessContactsForNotif(priContact, notName, rName, sysFromEmail, respectPriChannel){
try{
	if(priContact){
		var priChannel =  lookup("CONTACT_PREFERRED_CHANNEL",""+ priContact.capContact.getPreferredChannel());
		if(!matches(priChannel, "",null,"undefined", false)){
			if(!respectPriChannel || priChannel.indexOf("Email") > -1 || priChannel.indexOf("E-mail") > -1){
				sepSendNotification(sysFromEmail,priContact,notName,rName);
			}else{
				if(respectPriChannel && priChannel.indexOf("Postal") > -1){
					var addrString = "";
					var contAddr = priContact.addresses;
					for(ad in contAddr){
						var thisAddr = contAddr[ad];
						for (a in thisAddr){
							if(!matches(thisAddr[a], "undefined", "", null)){
								if(!matches(thisAddr[a].addressType, "undefined", "", null)){
									addrString += thisAddr[a].addressLine1 + br + thisAddr[a].city + ", " + thisAddr[a].state +  " " + thisAddr[a].zip + br;
								}
							}
						}
					}
					if(addrString==""){
						addrString = "No addresses found.";
					}
					if(!matches(rptName, null, "", "undefined")){
						showMessage=true;
						comment("<font color='blue'>The " + contactType + " contact, " + priContact.capContact.getFirstName() + " " + priContact.capContact.getLastName() + ", has requested all correspondence be mailed.  Please mail the report " + rptName + " to : " + br + addrString + "</font>");
					}else{
						showMessage=true;
						comment("<font color='blue'>The " + contactType + " contact, " + priContact.capContact.getFirstName() + " " + priContact.capContact.getLastName() + ", has requested all correspondence be mailed.  Please mail the notification " + notName + " to : " + br + addrString + "</font>");
					}
				}
			}
		}else{
			logDebug("No primary channel found.  Defaulting to emailing the notification.");
			sepSendNotification(sysFromEmail,priContact,notName,rName);
		}
	}else{
		logDebug("An error occurred retrieving the contactObj for " + contactType + ": " + priContact);
	}
}catch(err){
	logDebug("An error occurred in sepProcessContactsForNotif: " + err.message);
	logDebug(err.stack);
}}

function sepSendNotification(emailFrom,priContact,notName,rName){
try{
	var itemCap = capId;
	if (arguments.length == 7) itemCap = arguments[6]; // use cap ID specified in args
	var id1 = itemCap.ID1;
 	var id2 = itemCap.ID2;
 	var id3 = itemCap.ID3;
	var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);
	var emailRpt = false;
	var eParams = aa.util.newHashtable(); 
	addParameter(eParams, "$$fileDateYYYYMMDD$$", fileDateYYYYMMDD);
	var contPhone = priContact.capContact.phone1;
	if(contPhone){
		var fmtPhone = contPhone.substr(0,3) + "-" + contPhone.substr(3,3) +"-" + contPhone.substr(6,4);
	}else{
		var fmtPhone = "";
	}
	addParameter(eParams, "$$altID$$", capId.getCustomID());
	addParameter(eParams, "$$contactPhone1$$", fmtPhone);
	addParameter(eParams, "$$contactFirstName$$", priContact.capContact.firstName);
	addParameter(eParams, "$$contactLastName$$", priContact.capContact.lastName);
	addParameter(eParams, "$$contactEmail$$", priContact.capContact.email);
	addParameter(eParams, "$$status$$", capStatus);
	addParameter(eParams, "$$capType$$", cap.getCapType().getAlias());
	var priEmail = ""+priContact.capContact.getEmail();
	//var capId4Email = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
	var rFiles = [];
	var rptName = ""+rName;
	if(!matches(rptName, null, "", "undefined")){
		var report = aa.reportManager.getReportInfoModelByName(rName);
		if(report.getSuccess() && report!=null ){
			report = report.getOutput();
			report.setModule(appTypeArray[0]);
			report.setCapId(capId.getID1() + "-" + capId.getID2() + "-" + capId.getID3());
			var rParams = aa.util.newHashMap(); 
			rParams.put("altId",capId.getCustomID());
			report.setReportParameters(rParams);
			report.getEDMSEntityIdModel().setAltId(capId.getCustomID());
			var permit = aa.reportManager.hasPermission(rName,currentUserID);
			if (permit.getOutput().booleanValue()) {
				var reportResult = aa.reportManager.getReportResult(report);
				if(reportResult) {
					reportOutput = reportResult.getOutput();
					var reportFile=aa.reportManager.storeReportToDisk(reportOutput);
					reportFile=reportFile.getOutput();
					rFiles.push(reportFile);
					emailRpt = true;
				}else {
					logDebug("System failed get report: " + reportResult.getErrorType() + ":" +reportResult.getErrorMessage());
				}
			} else {
				logDebug("You have no permission.");
			}	
		}else{
			logDebug("An error occurred retrieving the report: "+ report.getErrorMessage());
		}
	}
	if(!emailRpt){
		rFiles = [];
	}
	var result = null;
	//logDebug("rName: " +rName);
	//logDebug("priEmail: " +priEmail);
	result = aa.document.sendEmailAndSaveAsDocument(emailFrom, priEmail, null, notName, eParams, capIDScriptModel, rFiles);
	if(result.getSuccess()){
		logDebug("Sent email successfully!");
		return true;
	}else{
		logDebug("Failed to send mail - " + result.getErrorMessage());
		return false;
	}
}catch(err){
	logDebug("An error occurred in sepSendNotification: " + err.message);
	logDebug(err.stack);
}}

function sepUpdateFeesWkfl(sepRules) {
try{
	for(row in sepRules){
		if(sepRules[row]["Active"]=="Yes"){
			var taskName = ""+sepRules[row]["Task Name"];
			var taskStatus = ""+sepRules[row]["Task Status"];
			if(!matches(taskName,"",null,"undefined" || wfTask==taskName) && wfStatus==taskStatus){
				var appMatch = true;
				var recdType = ""+sepRules[row]["Record Type"];
				var recdTypeArr = "" + recdType;
				var arrAppType = recdTypeArr.split("/");
				if (arrAppType.length != 4){
					logDebug("The record type is incorrectly formatted: " + recdType);
					return false;
				}else{
					for (xx in arrAppType){
						if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
							appMatch = false;
						}
					}
				}
				if (appMatch){
					var addtlQuery = ""+sepRules[row]["Additional Query"];
					logDebug("Additional Query field: " + addtlQuery);
					var chkFilter = ""+addtlQuery;
					if (chkFilter.length==0 ||eval(chkFilter) ) {
						var cFld = ""+sepRules[row]["Custom Field"];
						var custFld = cFld.trim();
						var cVal = ""+sepRules[row]["Custom Field Value"];
						var custVal = cVal.trim();
						if(matches(custFld,"",null,"undefined") || custVal==AInfo[custFld]){
							var fcode = ""+sepRules[row]["Fee Code"];
							var fsched = ""+sepRules[row]["Fee Schedule"];
							var fperiod = ""+sepRules[row]["Fee Period"];
							var feeQty = ""+sepRules[row]["Fee Quantity"];
							if(isNaN(feeQty)){
								if(feeQty.indexOf("AInfo")<0 && feeQty.indexOf("estValue")<0  ){
									var fqty = parseFloat([feeQty]);
								}else{
									var fqty = eval(feeQty);
									if(isNaN(fqty)){
										logDebug("Fee Quantity does not resolve to a number. Setting fee quantity to 1.");
										fqty = 1;
									}
								}
							}else{
								var fqty = parseFloat(feeQty);
							}
							var finvoice = ""+sepRules[row]["Auto Invoice"];
							if(finvoice=="Yes") finvoice = "Y";
							var pDuplicate = ""+sepRules[row]["Duplicate Fee"];
							if(pDuplicate=="Yes") pDuplicate = "Y";
							// If optional argument is blank, use default logic (i.e. allow duplicate fee if invoiced fee is found)
							if (pDuplicate == null || pDuplicate.length == 0){
								pDuplicate = "Y";
							}else{
								pDuplicate = pDuplicate.toUpperCase();
							}
							var invFeeFound = false;
							var adjustedQty = parseFloat(fqty);
							var feeSeq = null;
							feeUpdated = false;
							getFeeResult = aa.finance.getFeeItemByFeeCode(capId, fcode, fperiod);
							if (getFeeResult.getSuccess()) {
								var feeList = getFeeResult.getOutput();
								for (feeNum in feeList) {
									if (feeList[feeNum].getFeeitemStatus().equals("INVOICED")) {
										if (pDuplicate == "Y") {
											logDebug("Invoiced fee " + fcode + " found, subtracting invoiced amount from update qty.");
											adjustedQty = adjustedQty - feeList[feeNum].getFeeUnit();
											invFeeFound = true;
										} else {
											invFeeFound = true;
											logDebug("Invoiced fee " + fcode + " found.  Not updating this fee. Not assessing new fee " + fcode);
										}
									}
									if (feeList[feeNum].getFeeitemStatus().equals("NEW")) {
										adjustedQty = adjustedQty - feeList[feeNum].getFeeUnit();
									}
								}
								for (feeNum in feeList)
									if (feeList[feeNum].getFeeitemStatus().equals("NEW") && !feeUpdated) // update this fee item
									{
										var feeSeq = feeList[feeNum].getFeeSeqNbr();
										var editResult = aa.finance.editFeeItemUnit(capId, adjustedQty + feeList[feeNum].getFeeUnit(), feeSeq);
										feeUpdated = true;
										if (editResult.getSuccess()) {
											logDebug("Updated Qty on Existing Fee Item: " + fcode + " to Qty: " + fqty);
											if (finvoice == "Y") {
												feeSeqList.push(feeSeq);
												paymentPeriodList.push(fperiod);
											}
										} else {
											logDebug("**ERROR: updating qty on fee item (" + fcode + "): " + editResult.getErrorMessage());
											break
										}
									}
							} else {
								logDebug("**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())
							}
							// Add fee if no fee has been updated OR invoiced fee already exists and duplicates are allowed
							if (!feeUpdated && adjustedQty != 0 && (!invFeeFound || invFeeFound && pDuplicate == "Y")){
								feeSeq = addFee(fcode, fsched, fperiod, adjustedQty, finvoice);
							}else{
								feeSeq = null;
							}
							updateFeeItemInvoiceFlag(feeSeq, finvoice);
							//return feeSeq;
						}
					}
				}
			}
		}
	}
}catch (err){
	logDebug("An error occurred in sepUpdateFeesWkfl: " + err.message);
	logDebug(err.stack);
}}

function sepUpdateFeesAppSub(sepRules) {
try{
	for(row in sepRules){
		if(sepRules[row]["Active"]=="Yes"){
			var appMatch = true;
			var recdType = ""+sepRules[row]["Record Type"];
			var recdTypeArr = "" + recdType;
			var arrAppType = recdTypeArr.split("/");
			if (arrAppType.length != 4){
				logDebug("The record type is incorrectly formatted: " + recdType);
				return false;
			}else{
				for (xx in arrAppType){
					if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
						appMatch = false;
					}
				}
			}
			if (appMatch){
				var addtlQuery = ""+sepRules[row]["Additional Query"];
				logDebug("Additional Query field: " + addtlQuery);
				var chkFilter = ""+addtlQuery;
				if (chkFilter.length==0 ||eval(chkFilter) ) {
					var cFld = ""+sepRules[row]["Custom Field Name"];
					var custFld = cFld.trim();
					var cVal = ""+sepRules[row]["Custom Field Value"];
					var custVal = cVal.trim();
					if(matches(custFld,"",null,"undefined") || custVal==AInfo[custFld]){
						var fcode = ""+sepRules[row]["Fee Code"];
						var fsched = ""+sepRules[row]["Fee Schedule"];
						var fperiod = ""+sepRules[row]["Fee Period"];
						var feeQty = ""+sepRules[row]["Fee Quantity"];
						if(isNaN(feeQty)){
							if(feeQty.indexOf("AInfo")<0 && feeQty.indexOf("estValue")<0  ){
								var fqty = eval("AInfo['"+feeQty+"']");
							}else{
								var fqty = eval(feeQty);
								logDebug("fqty: " + fqty);
								if(isNaN(fqty)){
									logDebug("Fee Quantity does not resolve to a number. Setting fee quantity to 1.");
									fqty = 1;
								}
							}
						}else{
							var fqty = parseFloat(feeQty);
						}
						var finvoice = ""+sepRules[row]["Auto Invoice"];
						if(finvoice=="Yes") finvoice = "Y";
						var pDuplicate = ""+sepRules[row]["Duplicate Fee"];
							var pDuplicate = ""+sepRules[row]["Duplicate Fee"];
							if(pDuplicate=="Yes") pDuplicate = "Y";
							// If optional argument is blank, use default logic (i.e. allow duplicate fee if invoiced fee is found)
							if (pDuplicate == null || pDuplicate.length == 0){
								pDuplicate = "Y";
							}else{
								pDuplicate = pDuplicate.toUpperCase();
							}
							var invFeeFound = false;
							var adjustedQty = parseFloat(fqty);
							var feeSeq = null;
							feeUpdated = false;
							getFeeResult = aa.finance.getFeeItemByFeeCode(capId, fcode, fperiod);
							if (getFeeResult.getSuccess()) {
								var feeList = getFeeResult.getOutput();
								for (feeNum in feeList) {
									if (feeList[feeNum].getFeeitemStatus().equals("INVOICED")) {
										if (pDuplicate == "Y") {
											logDebug("Invoiced fee " + fcode + " found, subtracting invoiced amount from update qty.");
											adjustedQty = adjustedQty - feeList[feeNum].getFeeUnit();
											invFeeFound = true;
										} else {
											invFeeFound = true;
											logDebug("Invoiced fee " + fcode + " found.  Not updating this fee. Not assessing new fee " + fcode);
										}
									}
									if (feeList[feeNum].getFeeitemStatus().equals("NEW")) {
										adjustedQty = adjustedQty - feeList[feeNum].getFeeUnit();
									}
								}
								for (feeNum in feeList)
									if (feeList[feeNum].getFeeitemStatus().equals("NEW") && !feeUpdated) // update this fee item
									{
										var feeSeq = feeList[feeNum].getFeeSeqNbr();
										var editResult = aa.finance.editFeeItemUnit(capId, adjustedQty + feeList[feeNum].getFeeUnit(), feeSeq);
										feeUpdated = true;
										if (editResult.getSuccess()) {
											logDebug("Updated Qty on Existing Fee Item: " + fcode + " to Qty: " + fqty);
											if (finvoice == "Y") {
												feeSeqList.push(feeSeq);
												paymentPeriodList.push(fperiod);
											}
										} else {
											logDebug("**ERROR: updating qty on fee item (" + fcode + "): " + editResult.getErrorMessage());
											break
										}
									}
							} else {
								logDebug("**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())
							}
							// Add fee if no fee has been updated OR invoiced fee already exists and duplicates are allowed
							if (!feeUpdated && adjustedQty != 0 && (!invFeeFound || invFeeFound && pDuplicate == "Y")){
								feeSeq = addFee(fcode, fsched, fperiod, adjustedQty, finvoice);
							}else{
								feeSeq = null;
							}
							updateFeeItemInvoiceFlag(feeSeq, finvoice);
							//return feeSeq;
					}
				}
			}
		}
	}
}catch (err){
	logDebug("An error occurred in sepUpdateFeesAppSub: " + err.message);
	logDebug(err.stack);
}}

function sepStopWorkflow(){
//stop workflow progress based on parameters
try{
	//see if any records are set up--module can be specific or "ALL", look for both
	var workflowStopped = false;
	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", appTypeArray[0]);
	if(sepScriptConfig.getSuccess()){
		var sepScriptConfigArr = sepScriptConfig.getOutput();
		if(sepScriptConfigArr.length<1){
			var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", "ALL");
			if(sepScriptConfig.getSuccess()){
				var sepScriptConfigArr = sepScriptConfig.getOutput();
			}
		}
		if(sepScriptConfigArr.length>0){
			for(sep in sepScriptConfigArr){
				var cfgCapId = sepScriptConfigArr[sep].getCapID();
				var sepRules = loadASITable("PREVENT WORKFLOW UPDATE",cfgCapId);
				if(sepRules.length>0){
					for(row in sepRules){
						if(sepRules[row]["Active"]=="Yes"){
							var taskName = ""+sepRules[row]["Task Name"];
							var taskStatus = ""+sepRules[row]["Task Status"];
							if((matches(taskName,"",null,"undefined") || wfTask==taskName) && wfStatus==taskStatus){
								if(matches(taskName,"",null,"undefined")){
									taskName = "Current Task";
								}
								var appMatch = true;
								var recdType = ""+sepRules[row]["Record Type"];
								var recdTypeArr = "" + recdType;
								var arrAppType = recdTypeArr.split("/");
								if (arrAppType.length != 4){
									logDebug("The record type is incorrectly formatted. It should be group/type/subtype/category: " + recdType);
									return false;
								}else{
									for (xx in arrAppType){
										if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
											appMatch = false;
										}
									}
								}
								if (appMatch){
									addtlQuery = ""+sepRules[row]["Additional Query"];
									logDebug("Additional Query field: " + addtlQuery);
									var chkFilter = ""+addtlQuery;
									if (chkFilter.length > 0 && !eval(chkFilter) ) {
										workflowStopped = true;
										cancel=true;
										showMessage=true;
										comment( "'"+ chkFilter + "' must resolve to 'true' before proceeding." );
									}
									switch("" + sepRules[row]["Event"]){
									case "Fees Due": 
										var strFee = ""+ sepRules[row]["Required Elements List"];
										var feeBal = 0;
										var feesDue = [];
										if(strFee.length>0 && strFee!="ALL"){
											var arrFee = strFee.split("|");
											for (fee in arrFee){
												feeBal += sepFeeBalance(arrFee[fee]);
												if(sepFeeBalance(arrFee[fee])>0){
													feesDue.push(arrFee[fee]);
												}
											}
										}else{
											feeBal = sepFeeBalance();
										}
										if(feeBal>0){
											workflowStopped = true;
											cancel=true;
											showMessage=true;
											comment( taskName + " cannot be set to '" + taskStatus + "' when there is an outstanding balance ($" + feeBal.toFixed(2) + ") of these fees: " );
											if(feesDue.length==0){
												comment("--All Fees--");
											}else{
												for( x in feesDue){
													comment(feesDue[x]);
												}
											}
										}
										break;
									case "Inspections Scheduled":
										var inspScheduled = false;
										var strInsp = ""+sepRules[row]["Required Elements List"];
										var inspDue = [];
										if(strInsp.length>0){
											var arrInsp = strInsp.split("|");
											for (ins in arrInsp){
												if(checkInspectionResult(arrInsp[ins], "Scheduled") || checkInspectionResult(arrInsp[ins], "Pending")){
													inspScheduled = true;
													inspDue.push(arrInsp[ins]);
												}
											}
										}else{
											if(isScheduled(false)){
												inspScheduled = true;
											}
										}
										if(inspScheduled){
											workflowStopped = true;
											cancel=true;
											showMessage=true;
											comment( taskName + " cannot be set to '" + taskStatus + "' when these inspections are scheduled or pending: " );
											if(inspDue.length==0){
												comment("--All Inspections--");
											}else{
												for( x in inspDue){
													comment(inspDue[x]);
												}
											}
										}
										break;
									case "Documents Required":
										var submittedDocList = aa.document.getDocumentListByEntity(capId,"CAP").getOutput().toArray();
										uploadedDocs = new Array();
										for (var i in submittedDocList ){
											uploadedDocs[submittedDocList[i].getDocGroup() +"-"+ submittedDocList[i].getDocCategory()] = true;
										}
										var strDoc =  ""+ sepRules[row]["Required Elements List"];
										var arrDoc = strDoc.split("|");
										var retArray = [];
										for (doc in arrDoc){
											if(arrDoc[doc].indexOf(",")<0){
												comment("Document List is incorrectly formatted: a group and type, separated by a comma, is required: " + strDoc);
												return false;
											}
											var thisDoc = arrDoc[doc].split(",");
											var dGroup = thisDoc[0];
											var dType = thisDoc[1];
											var docGroup = dGroup.trim();
											var docType = dType.trim();
											if(uploadedDocs[docGroup +"-"+ docType] == undefined) {	
												var thisArray = [];
												thisArray["docGroup"]=docGroup;
												thisArray["docType"]=docType;
												retArray.push(thisArray);
											}
										}
										if(retArray.length>0){
											workflowStopped = true;
											cancel=true;
											showMessage=true;
											comment("'"+ taskName + " cannot be set to '" + taskStatus + "' when these documents are required: ");
											for( x in retArray){
												comment(retArray[x]["docGroup"] + " - " + retArray[x]["docType"]);
											}
										}
										break;
									case "Child Records Status":
										var canProceed = false;
										var strChildInfo = ""+ sepRules[row]["Required Elements List"];
										var arrChildRecs = [];
										if(strChildInfo.length>0){
											var arrChildRecs = strChildInfo.split("|");
											for (ch in arrChildRecs){
												arrThisChild = arrChildRecs[ch].split(",");
												var arrChildren = getChildren(arrThisChild[0]);
												var status2Chk = ""+arrThisChild[1];
												if(status2Chk.toUpperCase()=="ANY"){
													canProceed = true;
												}else{
													var badStatus=false;
													for(st in arrChildren){
														var chCap = aa.cap.getCap(arrChildren[st]).getOutput();
														if(chCap.getCapStatus().toUpperCase()!=status2Chk.toUpperCase()){
															badStatus=true;
														}
													}
													if(badStatus){
														canProceed=false;
													}
												}		
											}
										}else{
											canProceed=false;
										}
										if(!canProceed){
											workflowStopped = true;
											cancel=true;
											showMessage=true;
											/*
											comment( taskName  + " cannot be set to '" + taskStatus + "' when either there is no child record of the type(s) " );
											*/
											comment(sepRules[row]["Comment/Description"]);
										}
										break;
									case "Custom Fields":
										var canProceed = true;
										var strAsi = ""+sepRules[row]["Required Elements List"];
										var asiBad = [];
										if(strAsi.length>0){
											var arrAsi = strAsi.split(",");
											for (fld in arrAsi){
												var thisAsi = ""+arrAsi[fld];
												var symbols = "!=<>";
												var validAsi = false;
												for(var i=0,l=symbols.length;i<l;i++){
													if(thisAsi.indexOf(symbols.charAt(i)) >-1){ 
														validAsi = true;
														if(thisAsi.indexOf("AInfo")<0){
															var subIdx = thisAsi.indexOf(symbols.charAt(i));
															var asiName = "AInfo['" + thisAsi.substr(0,subIdx-1) +"']"
															var asiCompare = asiName + thisAsi.substr(subIdx-1, thisAsi.length);
														}else{
															var asiCompare = thisAsi;
														}
													}
												}
												if(!validAsi){
													comment(thisAsi + " does not resolve to a valid query. It must be set up with a custom field name, a comparison operator (one of '>','<','==','!=', '>=', '<=') and a comparison value. No comparison is being done for this row.");
												}else{
													logDebug("asiCompare: " +asiCompare);
													if(!eval(asiCompare)){
														logDebug("asiCompare: " + asiCompare);
														canProceed = false;
														asiBad.push(thisAsi);
													}
												}
											}
										}else{
											comment("The 'Required Elements List' is empty. No custom field comparisons are being made.");
										}
										if(!canProceed){
											workflowStopped = true;
											cancel=true;
											showMessage=true;
											/*
											comment( taskName  + " cannot be set to '" + taskStatus + "' when these custom fields do not pass these rules: " );
											for( x in asiBad){
												comment("---" + asiBad[x]);
											}
											*/
											comment(sepRules[row]["Comment/Description"]);
										}
										break;
									}
								}
							}
						}
					}
				}
			}
		}
	}
	return workflowStopped;
}catch(err){
	logDebug("A JavaScript Error occurred: sepStopWorkflow: " + err.message);
	logDebug(err.stack)
}}

function sepFeeBalance(feestr){
try{
	// Searches payment fee items and returns the unpaid balance of a fee item
	// Sums fee items if more than one exists.  
	var amtFee = 0;
	var amtPaid = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess()){ 
		var feeObjArr = feeResult.getOutput(); 
	}else{ 
		logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); 
		return false 
	}
	for (ff in feeObjArr){
		if ((!feestr || feestr.equals(feeObjArr[ff].getFeeCod()))){
			amtFee+=feeObjArr[ff].getFee();
			var pfResult = aa.finance.getPaymentFeeItems(capId, null);
			if (pfResult.getSuccess()){
				var pfObj = pfResult.getOutput();
				for (ij in pfObj){
					if (feeObjArr[ff].getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr()){
						amtPaid+=pfObj[ij].getFeeAllocation();
					}
				}
			}
		}
	}
	return amtFee - amtPaid;
}catch(err){
	logDebug("A JavaScript Error occurred: sepFeeBalance: " + err.message);
	logDebug(err.stack)
}}

function sepIssueLicenseWorkflow(){
try{
	//see if any records are set up--module can be specific or "ALL", look for both
	var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", appTypeArray[0]);
	if(sepScriptConfig.getSuccess()){
		var sepScriptConfigArr = sepScriptConfig.getOutput();
		if(sepScriptConfigArr.length<1){
			var sepScriptConfig = aa.cap.getCapIDsByAppSpecificInfoField("Module Name", "ALL");
			if(sepScriptConfig.getSuccess()){
				var sepScriptConfigArr = sepScriptConfig.getOutput();
			}
		}
		if(sepScriptConfigArr.length>0){ 
			for(sep in sepScriptConfigArr){
				var cfgCapId = sepScriptConfigArr[sep].getCapID();
				var sepRules = loadASITable("LICENSE ISSUANCE - ON WORKFLOW",cfgCapId);
				var sysFromEmail = getAppSpecific("Agency From Email",cfgCapId);
				if(sepRules.length>0){
					for(row in sepRules){
						if(sepRules[row]["Active"]=="Yes"){
							var taskName = ""+sepRules[row]["Task Name"];
							var taskStatus = ""+sepRules[row]["Task Status"];
							if(!matches(taskName,"",null,"undefined" || wfTask==taskName) && wfStatus==taskStatus){
								var appMatch = true;
								var recdType = ""+sepRules[row]["Record Type"];
								var recdTypeArr = "" + recdType;
								var arrAppType = recdTypeArr.split("/");
								if (arrAppType.length != 4){
									logDebug("The record type is incorrectly formatted: " + recdType);
									return false;
								}else{
									for (xx in arrAppType){
										if (!arrAppType[xx].equals(appTypeArray[xx]) && !arrAppType[xx].equals("*")){
											appMatch = false;
										}
									}
								}
								if (appMatch){
									var addtlQuery = ""+sepRules[row]["Additional Query"];
									logDebug("Additional Query field: " + addtlQuery);
									var chkFilter = ""+addtlQuery;
									if (chkFilter.length==0 ||eval(chkFilter) ) {
									logDebug("eval(chkFilter): " + eval(chkFilter));
										if(!matches(sepRules[row]["Parent Record Type"], "",null,"undefined")){
											var arrParRec = ""+sepRules[row]["Parent Record Type"];
											var arrParRec = arrParRec.split("/");
											if(arrParRec.length!=4){
												logDebug("Parent ID not correctly formatted: " + sepRules[row]["Parent Record Type"]);
												return false;
											}else{
												var parCapId = false;
												var appCreateResult = aa.cap.createApp(arrParRec[0], arrParRec[1], arrParRec[2], arrParRec[3],capName);
												logDebug("creating cap " +arrParRec);
												if (appCreateResult.getSuccess()){
													var newId = appCreateResult.getOutput();
													logDebug("cap " + arrParRec + " created successfully ");
													// create Detail Record
													capModel = aa.cap.newCapScriptModel().getOutput();
													capDetailModel = capModel.getCapModel().getCapDetailModel();
													capDetailModel.setCapID(newId);
													aa.cap.createCapDetail(capDetailModel);
													var newObj = aa.cap.getCap(newId).getOutput();	//Cap object
													var result = aa.cap.createAppHierarchy(newId, capId); 
													if (result.getSuccess()){
														logDebug("Parent application successfully linked");
														parCapId = newId;
													}else{
														logDebug("Could not link applications");
													}
												}else{
													logDebug( "**ERROR: adding parent App: " + appCreateResult.getErrorMessage());
												}											}
											if(parCapId){
												var newLPType = ""+sepRules[row]["Create LP Type"];
												logDebug("newLPType: " + newLPType);
												if(!matches(newLPType, "",null,"undefined")){
													var newLPContact = getContactObj(capId,"Applicant");
													if(newLPContact){
														var lpCreated = newLPContact.createRefLicProf(null,newLPType,null,null);
													}
												}
												if(!matches(""+sepRules[row]["Expiration - Year(s)"],"",null,"undefined")){
													var expDateYear = sysDate.getYear()+parseInt(sepRules[row]["Expiration - Year(s)"]);
													var expDate = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), expDateYear, "MM/DD/YYYY");
													expDate = dateAdd(expDate,1);
												}else{
													if(!matches(""+sepRules[row]["Expiration - Month(s)"],"",null,"undefined")){
														var expDate =  dateAddMonths(sysDate,sepRules[row]["Expiration - Month(s)"]);
													}else{
														if(!matches(""+sepRules[row]["Expiration - MM/DD"],"",null,"undefined")){
															var expDate =  dateAddMonths(sysDate,sepRules[row]["Expiration - Month(s)"]);
														}else{
															logDebug("No expiration date listed. Defaulting to one year.");
															var expDateYear = sysDate.getYear()+1;
															var expDate = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), expDateYear, "MM/DD/YYYY");
														}
													}
												}
												if(matches(""+sepRules[row]["New App Status"],"",null,"undefined")){
													var newAppStatus = "Active";
												}else{
													var newAppStatus = ""+sepRules[row]["New App Status"];
												}
												var currCapId = capId;
												capId = parCapId;
												licEditExpInfo(newAppStatus, expDate);
												updateAppStatus(newAppStatus, "Updated via sepIssueLicenseWorkflow.");
												capId = currCapId;
												if(""+sepRules[row]["Copy Custom Fields/Lists"]=="ALL"){
													copyAppSpecific(parCapId);
													copyASITables(capId, parCapId);
													logDebug("Copied all ASI/T.");
												}else{
													if(!matches(""+sepRules[row]["Copy Custom Fields/Lists"],"",null,"undefined")){
														var copyList = ""+sepRules[row]["Copy Custom Fields/Lists"];
														var arrCopy = [];
														if(copyList.indexOf("|")>-1){
															arrCopy = copyList.split("|");
														}else{
															arrCopy.push(copyList);
														}
														copyAppSpecificInclude(parCapId,arrCopy);
														copyASITablesInclude(capId, parCapId,arrCopy);
													}
												}
												if(!matches(""+sepRules[row]["Copy Contacts"],"",null,"undefined")){
													var strContacts = ""+sepRules[row]["Copy Contacts"];
													if(strContacts.toUpperCase()=="ALL"){
														copyContacts(capId, parCapId);
													}else{
														if(strContacts.indexOf("|")>-1){
															var arrContacts = strContacts.split("|");
														}else{
															var arrContacts =[];
															arrContacts.push(strContacts);
														}
														for(c in arrContacts){
															copyContactsByType(capId, parCapId, arrContacts[c]);
														}
													}
												}
												if(""+sepRules[row]["Copy Examination"]=="Yes"){
													aa.examination.copyExaminationList(capId, parCapId);
												}
												if(""+sepRules[row]["Copy Education"]=="Yes"){
													aa.education.copyEducationList(capId, parCapId);
												}
												if(""+sepRules[row]["Copy Continuing Education"]=="Yes"){
													aa.continuingEducation.copyContEducationList(capId, parCapId);
												}
												var notName = "" + sepRules[row]["Notification Name"];
												var rName = "" + sepRules[row]["Report Name"];
												if(!matches(notName, "","undefined",null)){
													var cntType = ""+sepRules[row]["Contacts Receiving Notice"];
													if(cntType.indexOf(",")>-1){
														var arrType = cntType.split(",");
														for(con in arrType){
															var priContact = getContactObj(capId,arrType[con]);
															sepProcessContactsForNotif(priContact, notName, rName, sysFromEmail, "N");
														}
													}else{
														if(cntType.toUpperCase()=="ALL"){
															var arrType = getContactObjs(capId);
															for(con in arrType){
																sepProcessContactsForNotif(arrType[con], notName, rName, sysFromEmail, "N");
															}
														}else{
															var priContact = getContactObj(capId,cntType);
															sepProcessContactsForNotif(priContact, notName, rName, sysFromEmail, "N");
														}						
													}						
												}else{
													logDebug("No notification name. No email sent.");
												}
												if(!matches(sepRules[row]["Inspection Group"], "",null,"undefined")){
													var monthDays = ""+sepRules[row]["Months/Days"];
													var pendSched = ""+sepRules[row]["Pending/Schedule"];
													var whenSched = ""+sepRules[row]["When to Schedule"];
													var calWkgDay = ""+sepRules[row]["Calendar/Work Days"];
													var sInsGroup = ""+sepRules[row]["Inspection Group"];
													var sInsType = ""+sepRules[row]["Inspection Type"];
													var inspectorId = ""+sepRules[row]["Inspector"];
													if(pendSched.toUpperCase()=="PENDING"){
														createPendingInspection(sInsGroup,sInsType,parCapId);
													}else{
														if(monthDays.toUpperCase()=="MONTHS"){
															var dtSched = dateAddMonths(sysDate,parseInt(whenSched));
														}else{
															if(calWkgDay.toUpperCase()=="WORKING"){
																var dtSched = dateAdd(sysDate,parseInt(whenSched),true);
															}else{
																var dtSched = dateAdd(sysDate,parseInt(whenSched));
															}
														}
														var currCapId = capId;
														capId = parCapId;
														sepScheduleInspectDate(sInsType,dtSched);
														if(!matches(inspectorId,"",null,"undefined")){
															var inspId = getScheduledInspId(sInsType);
															inspId = ""+inspId;
															if(inspectorId.toUpperCase()=="AUTO"){
																autoAssignInspection(inspId);
															}else{
																if(inspectorId.toUpperCase()=="PRIOR"){
																	var lastInspid = ""+getLastInspector(sInsType);
																	if(lastInspid!=null){
																		assignInspection(inspId, lastInspid);
																	}else{
																		assignInspection(inspId, inspectorId);
																	}
																}
															}
														}
														capId = currCapId;
													}
												}
											}
										}
									}else{
										logDebug("sepIssueLicenseWorkflow: Check filter resolved to false: " + chkFilter);
									}
								}else{
									logDebug("sepIssueLicenseWorkflow: No app match: " + recdTypeArr);
								}
							}else{
								//logDebug("sepIssueLicenseWorkflow: no task/status match: " + taskName + "/" + taskStatus);
								
							}
						}
					}
				}
			}
		}
	}
}catch(err){
	logDebug("A JavaScript Error occurred: sepIssueLicenseWorkflow:  " + err.message);
	logDebug(err.stack)
}}


//copy of copyAppSpecific and copyASITables except optional param is include not ignore
function copyAppSpecificInclude(newCap){ // copy all App Specific info into new Cap, 1 optional parameter for ignoreArr
try{
	var includeArr = new Array();
	var limitCopy = false;
	if (arguments.length > 1) 
	{
		includeArr = arguments[1];
		limitCopy = true;
	}
	
	for (asi in AInfo){
		//Check list
		if(limitCopy){
			var ignore=true;
		  	for(var i = 0; i < includeArr.length; i++)
		  		if(includeArr[i] == asi){
		  			ignore=false;
		  			break;
		  		}
		  	if(ignore)
		  		continue;
		}
		editAppSpecific(asi,AInfo[asi],newCap);
	}
}catch(err){
	logDebug("A JavaScript Error occurred: copyAppSpecificInclude:  " + err.message);
	logDebug(err.stack)
}}



function copyASITablesInclude(pFromCapId, pToCapId) {
try{	// par3 is optional 0 based string array of table to include
	var itemCap = pFromCapId;

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
		var tai = ta.iterator();
	var tableArr = new Array();
	var includeArr = new Array();
	var limitCopy = false;
	if (arguments.length > 2) {
		includeArr = arguments[2];
		limitCopy = true;
	}
	while (tai.hasNext()) {
		var tsm = tai.next();

		var tempObject = new Array();
		var tempArray = new Array();
		var tn = tsm.getTableName() + "";
		var numrows = 0;

		//Check list
		if (limitCopy) {
			var ignore = true;
			for (var i = 0; i < includeArr.length; i++)
				if (includeArr[i] == tn) {
					ignore = false;
					break;
				}
			if (ignore)
				continue;
		}
		if (!tsm.rowIndex.isEmpty()) {
			var tsmfldi = tsm.getTableField().iterator();
			var tsmcoli = tsm.getColumns().iterator();
			var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
			var numrows = 1;
			while (tsmfldi.hasNext()) // cycle through fields
			{
				if (!tsmcoli.hasNext()) // cycle through columns
				{
					var tsmcoli = tsm.getColumns().iterator();
					tempArray.push(tempObject); // end of record
					var tempObject = new Array(); // clear the temp obj
					numrows++;
				}
				var tcol = tsmcoli.next();
				var tval = tsmfldi.next();

				var readOnly = 'N';
				if (readOnlyi.hasNext()) {
					readOnly = readOnlyi.next();
				}

				var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
				tempObject[tcol.getColumnName()] = fieldInfo;
				//tempObject[tcol.getColumnName()] = tval;
			}

			tempArray.push(tempObject); // end of record
		}

		addASITable(tn, tempArray, pToCapId);
		logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	}
} catch(err){
	logDebug("A JavaScript Error occurred: copyASITablesInclude:  " + err.message);
	logDebug(err.stack)
}}

function sepRunBackup(emailAddr){
try{
	
}catch(err){
	logDebug("A JavaScript Error occurred: sepRunBackup:  " + err.message);
	logDebug(err.stack)
}}

function getGuidesheetASIValue(inspId,gName,gItem,asiGroup,asiSubGroup, asiLabel) {
try{
	//updates the guidesheet ID to nGuideSheetID if not currently populated
	//optional capId
	var itemCap = capId;
	if (arguments > 6) itemCap = arguments[7];
	var r = aa.inspection.getInspections(itemCap);
	if (r.getSuccess()) {
		var inspArray = r.getOutput();
		for (i in inspArray) {
			if (inspArray[i].getIdNumber() == inspId) {
				var inspModel = inspArray[i].getInspection();
				var gs = inspModel.getGuideSheets();
				if (gs) {
					for(var i=0;i< gs.size();i++) {
						var guideSheetObj = gs.get(i);
						if (guideSheetObj && gName.toUpperCase() == guideSheetObj.getGuideType().toUpperCase()) {
							var guidesheetItem = guideSheetObj.getItems();
							for(var j=0;j< guidesheetItem.size();j++) {
								var item = guidesheetItem.get(j);
								//1. Filter Guide Sheet items by Guide sheet item name && ASI group code
								if(item && gItem == item.getGuideItemText() && asiGroup == item.getGuideItemASIGroupName()) {
									var ASISubGroups = item.getItemASISubgroupList();
									if(ASISubGroups) {
										//2. Filter ASI sub group by ASI Sub Group name
										for(var k=0;k< ASISubGroups.size();k++) {
											var ASISubGroup = ASISubGroups.get(k);
											if(ASISubGroup && ASISubGroup.getSubgroupCode() == asiSubGroup) {
												var ASIModels =  ASISubGroup.getAsiList();
												if(ASIModels) {
													//3. Filter ASI by ASI name
													for( var m = 0; m< ASIModels.size();m++) {
														var ASIModel = ASIModels.get(m);
														if(ASIModel && ASIModel.getAsiName() == asiLabel) {
															//logDebug("Change ASI value from:"+ ASIModel.getAttributeValue() +" to "+newValue);
															//4. Reset ASI value
															//ASIModel.setAttributeValue(newValue);		
															return ASIModel.getAttributeValue();
														}
													}
												}
											}
										}
									}
								}
							}							
						}
					}
				} else {
					// if there are guidesheets
					logDebug("No guidesheets for this inspection");
					return false;
				}
			}
		}
	} else {
		logDebug("No inspections on the record");
		return false;
	}
	logDebug("No checklist item found.");
	return false;
}catch(err){
	logDebug("A JavaScript Error occurred: getGuidesheetASIValue: " + err.message);
	logDebug(err.stack);
}}

function sepScheduleInspectDate(iType,DateToSched){ // optional inspector ID.
// DQ - Added Optional 4th parameter inspTime Valid format is HH12:MIAM or AM (SR5110)
// DQ - Added Optional 5th parameter inspComm
try{
	var inspectorObj = null;
	var inspTime = null;
	var inspComm = "Scheduled via Script";
	if (arguments.length >= 3)
		if (arguments[2] != null)
			{
			var inspRes = aa.person.getUser(arguments[2]);
			if (inspRes.getSuccess())
				inspectorObj = inspRes.getOutput();
			}

        if (arguments.length >= 4)
            if(arguments[3] != null)
		        inspTime = arguments[3];

		if (arguments.length >= 5)
		    if(arguments[4] != null)
		        inspComm = arguments[4];

	var schedRes = aa.inspection.scheduleInspection(capId, inspectorObj, aa.date.parseDate(DateToSched), inspTime, iType, inspComm)

	if (schedRes.getSuccess())
		logDebug("Successfully scheduled inspection : " + iType + " for " + DateToSched);
	else{
		if(schedRes.getErrorMessage()=="Can't get the Service Provider Code from the I18NModel."){
			logDebug("Ignoring I18NMODEL error. Successfully scheduled inspection : " + iType + " for " + DateToSched);
		}else{
			logDebug( "**ERROR: adding scheduling inspection (" + iType + "): " + schedRes.getErrorMessage());
		}
	}
}catch(err){
	logDebug("A JavaScript Error occurred: sepScheduleInspectDate: " + err.message);
	logDebug(err.stack);
}}
 

//INCLUDES_SEP_CUSTOM END