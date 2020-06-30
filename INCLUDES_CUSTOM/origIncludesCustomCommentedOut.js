// setting globals per EMSE_ENVIRONMENT standard choice

/* lwacht: 200630: not sure what all this is but it's causing issues so commenting out until i find out why 

var ENVIRON = lookup("EMSE_ENVIRONMENT","ENVIRON");
var EMAILREPLIES = lookup("EMSE_ENVIRONMENT","EMAILREPLIES");
var SENDEMAILS = lookup("EMSE_ENVIRONMENT","SENDEMAILS").toUpperCase().equals("TRUE");
var ACAURL = lookup("EMSE_ENVIRONMENT","ACAURL");
var SLACKURL = lookup("EMSE_ENVIRONMENT","SLACKURL");
var DEBUGUSERS = lookup("EMSE_ENVIRONMENT","DEBUGUSERS");

//set Debug
var vDebugUsers = DEBUGUSERS.split(",");
if (exists(currentUserID,vDebugUsers)) {
	showDebug = 3;
	showMessage = true;
}
function addACAUrlsVarToEmail(vEParams) {
	//Get base ACA site from standard choices
	var acaSite = lookup("ACA_CONFIGS", "ACA_SITE");
	acaSite = acaSite.substr(0, acaSite.toUpperCase().indexOf("/ADMIN"));

	//Save Base ACA URL
	addParameter(vEParams,"$$acaURL$$",acaSite);

	//Save Record Direct URL
	addParameter(vEParams,"$$acaRecordURL$$",acaSite + getACAUrl());
}
function addAdHocTaskAssignDept_BCC(adHocProcess, adHocTask, adHocNote, vAsgnDept) {
//adHocProcess must be same as one defined in R1SERVER_CONSTANT
//adHocTask must be same as Task Name defined in AdHoc Process
//adHocNote can be variable
//vAsgnDept Assigned to Department must match an AA Department
//Optional 5 parameters = CapID
//Optional 6 parameters = Due Date
	var thisCap = capId;
	var dueDate = aa.util.now();
	if(arguments.length > 4){
		thisCap = arguments[4] != null && arguments[4] != "" ? arguments[4] : capId;
	}
	if (arguments.length > 5) {
		var dateParam = arguments[5];
		if (dateParam != null && dateParam != "") { dueDate = convertDate(dateParam); }
	}

	var departSplits = vAsgnDept.split("/");
	var assignedUser = aa.person.getUser(null,null,null,null,departSplits[0],departSplits[1],departSplits[2],departSplits[3],departSplits[4],departSplits[5]).getOutput();
	assignedUser.setDeptOfUser("BCC/" + vAsgnDept);
	
	var taskObj = aa.workflow.getTasks(thisCap).getOutput()[0].getTaskItem()
	taskObj.setProcessCode(adHocProcess);
	taskObj.setTaskDescription(adHocTask);
	taskObj.setDispositionNote(adHocNote);
	taskObj.setProcessID(0);
	taskObj.setAssignmentDate(aa.util.now());
	taskObj.setDueDate(dueDate);
	taskObj.setAssignedUser(assignedUser);
	wf = aa.proxyInvoker.newInstance("com.accela.aa.workflow.workflow.WorkflowBusiness").getOutput();
	wf.createAdHocTaskItem(taskObj);
	return true;
}
/ **
* Add ASIT rows data, format: Array[Map<columnName, columnValue>]
** /
function addAppSpecificTableInfors(tableName, capIDModel, asitFieldArray/ ** Array[Map<columnName, columnValue>] ** /)
{
	if (asitFieldArray == null || asitFieldArray.length == 0)
	{
		return;
	}
	
	var asitTableScriptModel = aa.appSpecificTableScript.createTableScriptModel();
	var asitTableModel = asitTableScriptModel.getTabelModel();
	var rowList = asitTableModel.getRows();
	asitTableModel.setSubGroup(tableName);
	for (var i = 0; i < asitFieldArray.length; i++)
	{
		var rowScriptModel = aa.appSpecificTableScript.createRowScriptModel();
		var rowModel = rowScriptModel.getRow();
		rowModel.setFields(asitFieldArray[i]);
		rowList.add(rowModel);
	}
	return aa.appSpecificTableScript.addAppSpecificTableInfors(capIDModel, asitTableModel);
}

function addRefContactToRecord(refNum, cType) {
	itemCap = capId;
	if (arguments.length > 2)
		itemCap = arguments[2];

	var refConResult = aa.people.getPeople(refNum);
	if (refConResult.getSuccess()) {
		var refPeopleModel = refConResult.getOutput();
		if (refPeopleModel != null) {
			pm = refPeopleModel;
			pm.setContactType(cType);
			pm.setFlag("N");
			pm.setContactAddressList(getRefAddContactList(refNum));
			
			var result = aa.people.createCapContactWithRefPeopleModel(itemCap, pm);
			if (result.getSuccess()) {
				logDebug("Successfully added the contact");
			}	
			else {
				logDebug("Error creating the applicant " + result.getErrorMessage());
			}
		}
	}
}



function addStdVarsToEmail(vEParams, vCapId) {
	//Define variables
	var servProvCode;
	var cap;
	var capId;
	var capIDString;
	var currentUserID;
	var currentUserGroup;
	var appTypeResult;
	var appTypeString;
	var appTypeArray;
	var capTypeAlias;
	var capName;
	var fileDateObj;
	var fileDate;
	var fileDateYYYYMMDD;
	var parcelArea;
	var valobj;
	var estValue;
	var calcValue;
	var feeFactor;
	var capDetailObjResult;
	var capDetail;
	var houseCount;
	var feesInvoicedTotal;
	var balanceDue;
	var parentCapString;
	var parentArray;
	var parentCapId;
	var addressLine;
	
	//get standard variables for the record provided
	if(vCapId != null){
		capId = vCapId;
		servProvCode = capId.getServiceProviderCode();
		capIDString = capId.getCustomID();
		cap = aa.cap.getCap(capId).getOutput();	
		appTypeResult = cap.getCapType();
		appTypeString = appTypeResult.toString();
		capTypeAlias = cap.getCapType().getAlias();
		capName = cap.getSpecialText();
		capStatus = cap.getCapStatus();
		fileDateObj = cap.getFileDate();
		fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
		fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(),fileDateObj.getDayOfMonth(),fileDateObj.getYear(),"YYYY-MM-DD");
		valobj = aa.finance.getContractorSuppliedValuation(vCapId,null).getOutput();	
		if (valobj.length) {
			estValue = valobj[0].getEstimatedValue();
			calcValue = valobj[0].getCalculatedValue();
			feeFactor = valobj[0].getbValuatn().getFeeFactorFlag();
		}
		
		var capDetailObjResult = aa.cap.getCapDetail(vCapId);		
		if (capDetailObjResult.getSuccess())
		{
			capDetail = capDetailObjResult.getOutput();
			houseCount = capDetail.getHouseCount();
			feesInvoicedTotal = capDetail.getTotalFee();
			balanceDue = capDetail.getBalance();
			if (Number(balanceDue) != 'NaN') {
				balanceDue = Number(balanceDue).toFixed(2);
			}
		}
		parentCapString = "" + aa.env.getValue("ParentCapID");
		if (parentCapString.length > 0) {
			parentArray = parentCapString.split("-"); 
			parentCapId = aa.cap.getCapID(parentArray[0], parentArray[1], parentArray[2]).getOutput(); 
		}
		if (!parentCapId) {
			parentCapId = getParent(); 
		}
		if (!parentCapId) {
			parentCapId = getParentLicenseCapID(vCapId); 
		}		
		addressLine = getAddressInALine();
		currentUserID = aa.env.getValue("CurrentUserID");
		appTypeArray = appTypeString.split("/");
		if(appTypeArray[0].substr(0,1) !="_") 
		{
			var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0],currentUserID).getOutput()
			if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
		}
		parcelArea = 0;;

		//save variables to email paramater hashtable
		addParameter(vEParams,"$$altid$$",capIDString);	
		addParameter(vEParams,"$$capIDString$$",capIDString);
		addParameter(vEParams,"$$currentUserID$$",currentUserID); // seems to cause the issue
		addParameter(vEParams,"$$currentUserGroup$$",currentUserGroup); // seems to cause the issue
		addParameter(vEParams,"$$appTypeString$$",appTypeString);
		addParameter(vEParams,"$$capAlias$$",capTypeAlias);
		addParameter(vEParams,"$$capName$$",capName);
		addParameter(vEParams,"$$capStatus$$",capStatus);
		addParameter(vEParams,"$$fileDate$$",fileDate);
		addParameter(vEParams,"$$fileDateYYYYMMDD$$",fileDateYYYYMMDD);
		addParameter(vEParams,"$$parcelArea$$",parcelArea); // seems to cause the issue
		addParameter(vEParams,"$$estValue$$",estValue);
		addParameter(vEParams,"$$calcValue$$",calcValue);
		addParameter(vEParams,"$$feeFactor$$",feeFactor);
		addParameter(vEParams,"$$houseCount$$",houseCount);
		addParameter(vEParams,"$$feesInvoicedTotal$$",feesInvoicedTotal);
		addParameter(vEParams,"$$balanceDue$$",balanceDue);	
		if (parentCapId) {
			addParameter(vEParams,"$$parentCapId$$",parentCapId.getCustomID());
		}
		//Add ACA Urls to Email Variables
		addACAUrlsVarToEmail(vEParams);
		//Add address information
		if (addressLine != null) {
			addParameter(vEParams,"$$capAddress$$",addressLine);
		}
	}
	return vEParams;
}
/ *===========================================
Title: addToCat
Purpose: Add the given capId to the CAT_UPDATES set. These records will be sent to the CAT API
Author: John Towell

Parameters:
	capId: table model
============================================== * /
function addToCat(capId) {
    try {
        var SET_ID = 'CAT_UPDATES';
        var createResult = createSetIfNeeded(SET_ID);
        if (!createResult.getSuccess()) {
            logDebug("**ERROR: Failed to create " + SET_ID + " set: " + createResult.getErrorMessage());
            return false;
        }
        var addResult = aa.set.add(SET_ID, capId);
        if (!addResult.getSuccess()) {
            logDebug("**ERROR: Failed to add [" + capId + "] to " + SET_ID + " set: " + addResult.getErrorMessage());
            return false;
        }
    } catch (err) {
        logDebug("A JavaScript Error occurred: addToCat: " + err.message);
        logDebug(err.stack);
    }

    return true;

    / **
     * PRIVATE FUNCTIONS
     * /

    / **
     * Creates the set if needed.
     * /
    function createSetIfNeeded(setId) {
        var theSetResult = aa.set.getSetByPK(setId);
        if (!theSetResult.getSuccess()) {
            theSetResult = aa.set.createSet(setId, setId, null, null);
        }

        return theSetResult;
    }
}


function areRequiredDocumentConditionsMet(stageName) {
	retValue = "";
	itemCap = capId;
	if (arguments.length > 1)
		itemCap = arguments[1];
	
	if (stageName == "OnSubmit" && publicUser) { // pageflow
		cap = aa.env.getValue("CapModel");
		tmpTable = loadASITable4ACA("REQUIRED DOCUMENTS", cap);
	}
	else {
		tmpTable = loadASITable("REQUIRED DOCUMENTS");
	}
	if (!tmpTable || tmpTable.length == 0) return "";
	
	for (rowIndex in tmpTable) {
		thisRow = tmpTable[rowIndex];
		thisDocType = thisRow["Document Type"].fieldValue;
		thisStage = thisRow["Record Stage"].fieldValue;
		
		if (thisStage == stageName) {
			// recording check
			mustBeRecorded = thisRow["Must be recorded?"].fieldValue;
			if (mustBeRecorded == "Yes" || mustBeRecorded == "Y")
				mustBeRecorded = true;
			else mustBeRecorded = false;
			
			if (mustBeRecorded) {
				recNumber = thisRow["Recording Number"].fieldValue;
				dateRec = thisRow["Date Received for Recording"].fieldValue;
				if ( (recNumber == null || recNumber =="") && (dateRec == null || dateRec == "") )
					retValue += " " +  thisDocType + " document must be recorded before proceeding." + br;
			}
			else { // attached doc check
				numReq = thisRow["Number Required"].fieldValue;
				if (numReq == null || numReq == "") numReq = 0
				else numReq = parseInt(numReq);
				if (numReq > 0) {
					docListArray = null;
					if (stageName == "OnSubmit" && publicUser) { // pageflow
						docListArray = aa.document.getDocumentListByEntity(capIDString,"TMP_CAP").getOutput().toArray();
					}
					else {
						docListResult = aa.document.getCapDocumentList(itemCap,currentUserID);
						if (docListResult.getSuccess()) {		
							docListArray = docListResult.getOutput();
						}
						else { logDebug("Exception getting document list " + docListResult.getErrorMessage()); }
					}
					if (docListArray == null || docListArray.length == 0) {
						retValue +=  " You must attach " + numReq + " " + thisDocType + " document(s) before proceeding." + br;
					}
					else {
						docsFound = 0;
						for (dIndex in docListArray) {
							thisDoc = docListArray[dIndex];
							if (thisDoc.getDocCategory() == thisDocType) 
								docsFound++;
						}
						if (docsFound < numReq) {
							retValue +=  " You must attach " + numReq + " " + thisDocType + " document(s) before proceeding." + br;
						}
					}
				} // end numReq = 0
			}
		}
	}
	return retValue; // passed
}


function associateLPToPublicUserModel(licenseNum, pu) {
	var licResult = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(), licenseNum);
	if (licResult.getSuccess()) {
		var licObj = licResult.getOutput();
		if (licObj != null) {
			licObj = licObj[0];
			if (pu != null) {
				assocResult = aa.licenseScript.associateLpWithPublicUser(pu, licObj);
				if (assocResult.getSuccess()) 
					logDebug("Successfully linked ref lp " + licenseNum + " to public user account");
				else
					logDebug("Link failed for " + licenseNum + " : " + assocResult.getErrorMessage());
			}
			else { logDebug("Public user object is null"); }
		}
		else { logDebug("lp object is null"); }
	}
	else { logDebug("Error associating lp to pu " + licResult.getErrorMessage()); }
}

function autoInvoiceVoidedFees() {
	var feeSeqListString = aa.env.getValue("FeeItemsSeqNbrArray");	// invoicing fee item list in string type
	var feeSeqList = [];					// fee item list in number type
	var xx;
	for(xx in feeSeqListString) {
		feeSeqList.push(Number(feeSeqListString[xx])); 	// convert the string type array to number type array
	}

	var paymentPeriodList = [];	// payment periods, system need not this parameter for daily side

	// The fee item should not belong to a POS before set the fee item status to "CREDITED".
	if (feeSeqList.length && !(capStatus == '#POS' && capType == '_PER_GROUP/_PER_TYPE/_PER_SUB_TYPE/_PER_CATEGORY')) {
		// the following method will set the fee item status from 'VOIDED' to 'CREDITED' after void the fee item;
		invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
		if (invoiceResult.getSuccess()) {
			logMessage("Invoicing assessed fee items is successful.");
		}
		else {
			logDebug("ERROR: Invoicing the fee items assessed to app # " + capId + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
		}
	}
}


function branchTask(wfstr,wfstat,wfcomment,wfnote) { // optional process name, cap id
                
                var useProcess = false;
                var processName = "";
                if (arguments.length > 4) 
                                {
                                if (arguments[4] != "")
                                                {
                                                processName = arguments[4]; // subprocess
                                                useProcess = true;
                                                }
                                }
                var itemCap = capId;
                if (arguments.length == 6) {
					itemCap = arguments[5]; // use cap ID specified in args
				}
                
                var workflowResult = aa.workflow.getTasks(itemCap);
               if (workflowResult.getSuccess()) {
                                var wfObj = workflowResult.getOutput();
			   }
                else
                                { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }
                
                if (!wfstat) {
					wfstat = "NA";
				}
                
				var i;
                for (i in wfObj)
                                {
                                var fTask = wfObj[i];
                               if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
                                                {
                                                var dispositionDate = aa.date.getCurrentDate();
                                                var stepnumber = fTask.getStepNumber();
                                                var processID = fTask.getProcessID();

                                                if (useProcess) {
                                                    aa.workflow.handleDisposition(itemCap,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"B");
												}
                                                else {
                                                    aa.workflow.handleDisposition(itemCap,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"B");
                                                }
                                                logMessage("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Branching...");
                                                logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Branching...");
                                                }                                              
                                }
                }

/ **
* Contact Object 
* <p>
* Properties: 
*	people - PeopleModel Object
*   capContact - CapContactModel Object
*	capContactScript - CapContactScriptModel Object
*	capId - capID Object
*	type - Contact Type
*	seqNumber - Transactional Seqence Number
*	asi - associative array of people template attributes
*	customFields - associative array of custom template fields
*	customTables - Not yet implemented
*	primary - Contact is Primary
*	relation - Contact Relation
*	addresses - associative array of address
*	validAttrs - Boolean indicating people template attributes
*	validCustomFields - Boolean indicating custom template fields
*	validCustomTables - Not implemented yet
*	infoTables - Table Array ex infoTables[name][row][column].getValue()
*	attribs - Array of LP Attributes ex attribs[name]
*	valid - Get the Attributes for LP
*	validTables - true if LP has infoTables
*	validAttrs - true if LP has attributes
* </p>
* <p>
* Methods:
*	toString() - Outputs a string of key contact fields 
*	getEmailTemplateParams(params,[vContactType]) - Contact Parameters for use in Notification Templates
*	replace(targetCapId) - send this contact to another record, optional new contact type
*	equals(contactObj) - Compares this contact to another contact by comparing key elements
*	saveBase() - Saves base information such as contact type, primary flag, relation
*	save() - Saves all current information to the transactional contact
*	syncCapContactToReference() - Synchronize the contact data from the record with the reference contact by pushing data from the record into reference.
*	syncCapContactFromReference() - Synchronize the reference contact data with the contact on the record by pulling data from reference into the record.
*	getAttribute(vAttributeName) - Get method for people template attributes
*	setAttribute(vAttributeName, vAttributeValue) - Set method for people template attributes
*	getCustomField(vFieldName) - Get method for Custom Template Fields
*	setCustomField(vFieldName,vFieldValue) - Set method for Custom Template Fields
*	remove() - Removes this contact from the transactional record
*	isSingleAddressPerType() - Boolean indicating if this contact has a Single Addresss Per Type
*	getAddressTypeCounts() - returns an associative array of how many adddresses are attached
*	createPublicUser() - For individual contact types, this function checkes to see if public user exists already based on email address then creates a public user and activates it for the agency. It also sends an Activate email and sends a Password Email. If there is a reference contact, it will assocated it with the newly created public user.
*	getCaps([record type filter]) - Returns an array of records related to the reference contact
*	getRelatedContactObjs([record type filter]) - Returns an array of contact objects related to the reference contact
*	getRelatedRefLicProfObjs() - Returns an array of Reference License Professional objects related to the reference contact
*	createRefLicProf(licNum,rlpType,addressType,licenseState, [servProvCode]) - Creates a Reference License Professional based on the contact information. If this contact is linked to a Reference Contact, it will link the new Reference License Professional to the Reference Contact.
*	linkRefContactWithRefLicProf(licnumber, [lictype]) - Link a Reference License Professional to the Reference Contact.
*	getAKA() - Returns an array of AKA Names for the assocated reference contact
*	addAKA(firstName,middleName,lastName,fullName,startDate,endDate) - Adds an AKA Name to the assocated reference contact
*	removeAKA(firstName,middleName,lastName) - Removes an AKA Name from the assocated reference contact
*	hasPublicUser() - Boolean indicating if the contact has an assocated public user account
*	linkToPublicUser(pUserId) - Links the assocated reference contact to the public user account
*	sendCreateAndLinkNotification() - Sends a Create and Link Notification using the PUBLICUSER CREATE AND LINK notification template to the contact for the scenario in AA where a paper application has been submitted
*	getRelatedRefContacts([relConsArray]) - Returns an array of related reference contacts. An optional relationship types array can be used
* </p>
* <p>
* Call Example:
* 	var vContactObj = new contactObj(vCCSM);
*	var contactRecordArray = vContactObj.getAssociatedRecords();
*	var cParams = aa.util.newHashtable();
*	vContactObj.getEmailTemplateParams(cParams);
* </p>
* @param ccsm {CapContactScriptModel}
* @return {contactObj}
* /

function contactObj(ccsm)  {
logDebug("ETW: new 9.0 contactObj function.");
    this.people = null;         // for access to the underlying data
    this.capContact = null;     // for access to the underlying data
    this.capContactScript = null;   // for access to the underlying data
    this.capId = null;
    this.type = null;
    this.seqNumber = null;
    this.refSeqNumber = null;
    this.asiObj = null;
    this.asi = new Array();    // associative array of attributes
	this.customFieldsObj = null;
	this.customFields = new Array();
	this.customTablesObj = null;
	this.customTables = new Array();
    this.primary = null;
    this.relation = null;
    this.addresses = null;  // array of addresses
    this.validAttrs = false;
	this.validCustomFields = false;
	this.validCustomTables = false;
        
    this.capContactScript = ccsm;
    if (ccsm)  {
        if (ccsm.getCapContactModel == undefined) {  // page flow
            this.people = this.capContactScript.getPeople();
            this.refSeqNumber = this.capContactScript.getRefContactNumber();
            }
        else {
            this.capContact = ccsm.getCapContactModel();
            this.people = this.capContact.getPeople();
            this.refSeqNumber = this.capContact.getRefContactNumber();

			// contact attributes
			// Load People Template Fields
            if (this.people.getAttributes() != null) {
                this.asiObj = this.people.getAttributes().toArray();
                if (this.asiObj != null) {
                    for (var xx1 in this.asiObj) this.asi[this.asiObj[xx1].attributeName] = this.asiObj[xx1];
                    this.validAttrs = true; 
                }   
            }
			// Load Custom Template Fields
			if (this.capContact.getTemplate() != null && this.capContact.getTemplate().getTemplateForms() != null) {
				var customTemplate = this.capContact.getTemplate();
				this.customFieldsObj = customTemplate.getTemplateForms();
				if (!(this.customFieldsObj == null || this.customFieldsObj.size() == 0)) {
					for (var i = 0; i < this.customFieldsObj.size(); i++) {
						var eachForm = this.customFieldsObj.get(i);
						//Sub Group
						var subGroup = eachForm.subgroups;
						if (subGroup == null) {
							continue;
						}
						for (var j = 0; j < subGroup.size(); j++) {
							var eachSubGroup = subGroup.get(j);
							if (eachSubGroup == null || eachSubGroup.fields == null) {
								continue;
							}
							var allFields = eachSubGroup.fields;
							if (!(allFields == null || allFields.size() == 0)) {
								for (var k = 0; k < allFields.size(); k++) {
									var eachField = allFields.get(k);
									this.customFields[eachField.displayFieldName] = eachField.defaultValue;
									logDebug("(contactObj) {" + eachField.displayFieldName + "} = " +  eachField.defaultValue);
									this.validCustomFields = true;
								}
							}
						}
					}
				}
			}
        }  

		// contact ASI
		var tm = this.people.getTemplate();
		if (tm)	{
			var templateGroups = tm.getTemplateForms();
			var gArray = new Array();
			if (!(templateGroups == null || templateGroups.size() == 0)) {
				var subGroups = templateGroups.get(0).getSubgroups();
				if (!(subGroups == null || subGroups.size() == 0)) {
					for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++) {
						var subGroup = subGroups.get(subGroupIndex);
						var fields = subGroup.getFields();
						if (!(fields == null || fields.size() == 0)) {
							for (var fieldIndex = 0; fieldIndex < fields.size(); fieldIndex++) {
								var field = fields.get(fieldIndex);
								this.asi[field.getDisplayFieldName()] = field.getDefaultValue();
							}
						}
					}
				}
			}
		}

        //this.primary = this.capContact.getPrimaryFlag().equals("Y");
        this.relation = this.people.relation;
        this.seqNumber = this.people.contactSeqNumber;
        this.type = this.people.getContactType();
        this.capId = this.capContactScript.getCapID();
        var contactAddressrs = aa.address.getContactAddressListByCapContact(this.capContact);
        if (contactAddressrs.getSuccess()) {
            this.addresses = contactAddressrs.getOutput();
            var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
            this.people.setContactAddressList(contactAddressModelArr);
            }
        else {
            pmcal = this.people.getContactAddressList();
            if (pmcal) {
                this.addresses = pmcal.toArray();
            }
        }
    }       
        this.toString = function() { return this.capId + " : " + this.type + " " + this.people.getLastName() + "," + this.people.getFirstName() + " (id:" + this.seqNumber + "/" + this.refSeqNumber + ") #ofAddr=" + this.addresses.length + " primary=" + this.primary;  }
        
        this.getEmailTemplateParams = function (params, vContactType) {
			var contactType = "";
			if (arguments.length == 2) contactType = arguments[1];
			
            addParameter(params, "$$" + contactType + "LastName$$", this.people.getLastName());
            addParameter(params, "$$" + contactType + "FirstName$$", this.people.getFirstName());
            addParameter(params, "$$" + contactType + "MiddleName$$", this.people.getMiddleName());
            addParameter(params, "$$" + contactType + "BusinesName$$", this.people.getBusinessName());
            addParameter(params, "$$" + contactType + "ContactSeqNumber$$", this.seqNumber);
            addParameter(params, "$$ContactType$$", this.type);
            addParameter(params, "$$" + contactType + "Relation$$", this.relation);
            addParameter(params, "$$" + contactType + "Phone1$$", this.people.getPhone1());
            addParameter(params, "$$" + contactType + "Phone2$$", this.people.getPhone2());
            addParameter(params, "$$" + contactType + "Email$$", this.people.getEmail());
            addParameter(params, "$$" + contactType + "AddressLine1$$", this.people.getCompactAddress().getAddressLine1());
            addParameter(params, "$$" + contactType + "AddressLine2$$", this.people.getCompactAddress().getAddressLine2());
            addParameter(params, "$$" + contactType + "City$$", this.people.getCompactAddress().getCity());
            addParameter(params, "$$" + contactType + "State$$", this.people.getCompactAddress().getState());
            addParameter(params, "$$" + contactType + "Zip$$", this.people.getCompactAddress().getZip());
            addParameter(params, "$$" + contactType + "Fax$$", this.people.getFax());
            addParameter(params, "$$" + contactType + "Country$$", this.people.getCompactAddress().getCountry());
            addParameter(params, "$$" + contactType + "FullName$$", this.people.getFullName());
            return params;
            }
        
        this.replace = function(targetCapId) { // send to another record, optional new contact type
        
            var newType = this.type;
            if (arguments.length == 2) newType = arguments[1];
            //2. Get people with target CAPID.
            var targetPeoples = getContactObjs(targetCapId,[String(newType)]);
            //3. Check to see which people is matched in both source and target.
            for (var loopk in targetPeoples)  {
                var targetContact = targetPeoples[loopk];
                if (this.equals(targetPeoples[loopk])) {
                    targetContact.people.setContactType(newType);
                    aa.people.copyCapContactModel(this.capContact, targetContact.capContact);
                    targetContact.people.setContactAddressList(this.people.getContactAddressList());
                    overwriteResult = aa.people.editCapContactWithAttribute(targetContact.capContact);
                    if (overwriteResult.getSuccess())
                        logDebug("overwrite contact " + targetContact + " with " + this);
                    else
                        logDebug("error overwriting contact : " + this + " : " + overwriteResult.getErrorMessage());
                    return true;
                    }
                }

                var tmpCapId = this.capContact.getCapID();
                var tmpType = this.type;
                this.people.setContactType(newType);
                this.capContact.setCapID(targetCapId);
                createResult = aa.people.createCapContactWithAttribute(this.capContact);
                if (createResult.getSuccess())
                    logDebug("(contactObj) contact created : " + this);
                else
                    logDebug("(contactObj) error creating contact : " + this + " : " + createResult.getErrorMessage());
                this.capContact.setCapID(tmpCapId);
                this.type = tmpType;
                return true;
        }

        this.equals = function(t) {
            if (t == null) return false;
            if (!String(this.people.type).equals(String(t.people.type))) { return false; }
            if (!String(this.people.getFirstName()).equals(String(t.people.getFirstName()))) { return false; }
            if (!String(this.people.getLastName()).equals(String(t.people.getLastName()))) { return false; }
            if (!String(this.people.getFullName()).equals(String(t.people.getFullName()))) { return false; }
            if (!String(this.people.getBusinessName()).equals(String(t.people.getBusinessName()))) { return false; }
            return  true;
        }
        
        this.saveBase = function() {
            // set the values we store outside of the models.
            this.people.setContactType(this.type);
            this.capContact.setPrimaryFlag(this.primary ? "Y" : "N");
            this.people.setRelation(this.relation);
            saveResult = aa.people.editCapContact(this.capContact);
            if (saveResult.getSuccess())
                logDebug("(contactObj) base contact saved : " + this);
            else
                logDebug("(contactObj) error saving base contact : " + this + " : " + saveResult.getErrorMessage());
            }               
        
        this.save = function() {
            // set the values we store outside of the models
            this.people.setContactType(this.type);
            this.capContact.setPrimaryFlag(this.primary ? "Y" : "N");
            this.people.setRelation(this.relation);
            this.capContact.setPeople(this.people);
            saveResult = aa.people.editCapContactWithAttribute(this.capContact);
            if (saveResult.getSuccess())
                logDebug("(contactObj) contact saved : " + this);
            else
                logDebug("(contactObj) error saving contact : " + this + " : " + saveResult.getErrorMessage());
            }
			
		this.syncCapContactToReference = function() {
			
			if(this.refSeqNumber){
				var vRefContPeopleObj = aa.people.getPeople(this.refSeqNumber).getOutput();
				var saveResult = aa.people.syncCapContactToReference(this.capContact,vRefContPeopleObj);
				if (saveResult.getSuccess())
					logDebug("(contactObj) syncCapContactToReference : " + this);
				else
					logDebug("(contactObj) error syncCapContactToReference : " + this + " : " + saveResult.getErrorMessage());
			}
			else{
				logDebug("(contactObj) error syncCapContactToReference : No Reference Contact to Syncronize With");
			}
            
		}
		this.syncCapContactFromReference = function() {
			
			if(this.refSeqNumber){
				var vRefContPeopleObj = aa.people.getPeople(this.refSeqNumber).getOutput();
				var saveResult = aa.people.syncCapContactFromReference(this.capContact,vRefContPeopleObj);
				if (saveResult.getSuccess())
					logDebug("(contactObj) syncCapContactFromReference : " + this);
				else
					logDebug("(contactObj) error syncCapContactFromReference : " + this + " : " + saveResult.getErrorMessage());
			}
			else{
				logDebug("(contactObj) error syncCapContactFromReference : No Reference Contact to Syncronize With");
			}
            
		}

        //get method for Attributes
        this.getAttribute = function (vAttributeName){
            var retVal = null;
            if(this.validAttrs){
                var tmpVal = this.asi[vAttributeName.toString().toUpperCase()];
                if(tmpVal != null)
                    retVal = tmpVal.getAttributeValue();
            }
            return retVal;
        }
        
        //Set method for Attributes
        this.setAttribute = function(vAttributeName,vAttributeValue){
			var retVal = false;
            if(this.validAttrs){
                var tmpVal = this.asi[vAttributeName.toString().toUpperCase()];
                if(tmpVal != null){
                    tmpVal.setAttributeValue(vAttributeValue);
                    retVal = true;
                }
            }
            return retVal;
        }
		
		//get method for Custom Template Fields
        this.getCustomField = function(vFieldName){
            var retVal = null;
            if(this.validCustomFields){
                var tmpVal = this.customFields[vFieldName.toString()];
                if(!matches(tmpVal,undefined,null,"")){
                    retVal = tmpVal;
				}
            }
            return retVal;
        }
		
		//Set method for Custom Template Fields
        this.setCustomField = function(vFieldName,vFieldValue){
            
            var retVal = false;
            if(this.validCustomFields){
				if (!(this.customFieldsObj == null || this.customFieldsObj.size() == 0)) {
					for (var i = 0; i < this.customFieldsObj.size(); i++) {
						var eachForm = this.customFieldsObj.get(i);
						//Sub Group
						var subGroup = eachForm.subgroups;
						if (subGroup == null) {
							continue;
						}
						for (var j = 0; j < subGroup.size(); j++) {
							var eachSubGroup = subGroup.get(j);
							if (eachSubGroup == null || eachSubGroup.fields == null) {
								continue;
							}
							var allFields = eachSubGroup.fields;
							for (var k = 0; k < allFields.size(); k++) {
								var eachField = allFields.get(k);
								if(eachField.displayFieldName == vFieldName){
								logDebug("(contactObj) updating custom field {" + eachField.displayFieldName + "} = " +  eachField.defaultValue + " to " + vFieldValue);
								eachField.setDefaultValue(vFieldValue);
								retVal = true;
								}
							}
						}
					}
				}
            }
            return retVal;
        }

        this.remove = function() {
            var removeResult = aa.people.removeCapContact(this.capId, this.seqNumber)
            if (removeResult.getSuccess())
                logDebug("(contactObj) contact removed : " + this + " from record " + this.capId.getCustomID());
            else
                logDebug("(contactObj) error removing contact : " + this + " : from record " + this.capId.getCustomID() + " : " + removeResult.getErrorMessage());
            }

        this.isSingleAddressPerType = function() {
            if (this.addresses.length > 1) 
                {
                
                var addrTypeCount = new Array();
                for (y in this.addresses) 
                    {
                    thisAddr = this.addresses[y];
                    addrTypeCount[thisAddr.addressType] = 0;
                    }

                for (yy in this.addresses) 
                    {
                    thisAddr = this.addresses[yy];
                    addrTypeCount[thisAddr.addressType] += 1;
                    }

                for (z in addrTypeCount) 
                    {
                    if (addrTypeCount[z] > 1) 
                        return false;
                    }
                }
            else
                {
                return true;    
                }

            return true;

            }

        this.getAddressTypeCounts = function() { //returns an associative array of how many adddresses are attached.
           
            var addrTypeCount = new Array();
            
            for (y in this.addresses) 
                {
                thisAddr = this.addresses[y];
                addrTypeCount[thisAddr.addressType] = 0;
                }

            for (yy in this.addresses) 
                {
                thisAddr = this.addresses[yy];
                addrTypeCount[thisAddr.addressType] += 1;
                }

            return addrTypeCount;

            }

        this.createPublicUser = function() {

            if (!this.capContact.getEmail())
            { logDebug("(contactObj) Couldn't create public user for : " + this +  ", no email address"); return false; }

            if (String(this.people.getContactTypeFlag()).equals("organization"))
            { logDebug("(contactObj) Couldn't create public user for " + this + ", the contact is an organization"); return false; }
            
            // check to see if public user exists already based on email address
            var getUserResult = aa.publicUser.getPublicUserByEmail(this.capContact.getEmail())
            if (getUserResult.getSuccess() && getUserResult.getOutput()) {
                userModel = getUserResult.getOutput();
                logDebug("(contactObj) createPublicUserFromContact: Found an existing public user: " + userModel.getUserID());
            }

            if (!userModel) // create one
                {
                logDebug("(contactObj) CreatePublicUserFromContact: creating new user based on email address: " + this.capContact.getEmail()); 
                var publicUser = aa.publicUser.getPublicUserModel();
                publicUser.setFirstName(this.capContact.getFirstName());
                publicUser.setLastName(this.capContact.getLastName());
                publicUser.setEmail(this.capContact.getEmail());
                publicUser.setUserID(this.capContact.getEmail());
                publicUser.setPassword("e8248cbe79a288ffec75d7300ad2e07172f487f6"); //password : 1111111111
                publicUser.setAuditID("PublicUser");
                publicUser.setAuditStatus("A");
                publicUser.setCellPhone(this.people.getPhone2());

                var result = aa.publicUser.createPublicUser(publicUser);
                if (result.getSuccess()) {

                logDebug("(contactObj) Created public user " + this.capContact.getEmail() + "  sucessfully.");
                var userSeqNum = result.getOutput();
                var userModel = aa.publicUser.getPublicUser(userSeqNum).getOutput()

                // create for agency
                aa.publicUser.createPublicUserForAgency(userModel);

                // activate for agency
                var userPinBiz = aa.proxyInvoker.newInstance("com.accela.pa.pin.UserPINBusiness").getOutput()
                userPinBiz.updateActiveStatusAndLicenseIssueDate4PublicUser(aa.getServiceProviderCode(),userSeqNum,"ADMIN");

                // reset password
                var resetPasswordResult = aa.publicUser.resetPassword(this.capContact.getEmail());
                if (resetPasswordResult.getSuccess()) {
                    var resetPassword = resetPasswordResult.getOutput();
                    userModel.setPassword(resetPassword);
                    logDebug("(contactObj) Reset password for " + this.capContact.getEmail() + "  sucessfully.");
                } else {
                    logDebug("(contactObj **WARNING: Reset password for  " + this.capContact.getEmail() + "  failure:" + resetPasswordResult.getErrorMessage());
                }

                // send Activate email
                aa.publicUser.sendActivateEmail(userModel, true, true);

                // send another email
                aa.publicUser.sendPasswordEmail(userModel);
                }
                else {
                    logDebug("(contactObj) **WARNIJNG creating public user " + this.capContact.getEmail() + "  failure: " + result.getErrorMessage()); return null;
                }
            }

        //  Now that we have a public user let's connect to the reference contact       
            
        if (this.refSeqNumber)
            {
            logDebug("(contactObj) CreatePublicUserFromContact: Linking this public user with reference contact : " + this.refSeqNumber);
            aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), this.refSeqNumber);
            }
            

        return userModel; // send back the new or existing public user
        }

        this.getCaps = function() { // option record type filter

        
            if (this.refSeqNumber) {
                aa.print("ref seq : " + this.refSeqNumber);
                var capTypes = "* /* /* /*";
                var resultArray = new Array();
                if (arguments.length == 1) capTypes = arguments[0];

                var pm = aa.people.createPeopleModel().getOutput().getPeopleModel(); 
                var ccb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactDAOOracle").getOutput(); 
                pm.setServiceProviderCode(aa.getServiceProviderCode()) ; 
                pm.setContactSeqNumber(this.refSeqNumber); 

                var cList = ccb.getCapContactsByRefContactModel(pm).toArray();
                
                for (var j in cList) {
                    var thisCapId = aa.cap.getCapID(cList[j].getCapID().getID1(),cList[j].getCapID().getID2(),cList[j].getCapID().getID3()).getOutput();
                    if (appMatch(capTypes,thisCapId)) {
                        resultArray.push(thisCapId)
                        }
                    }
				} 
            
        return resultArray;
        }

        this.getRelatedContactObjs = function() { // option record type filter
        
            if (this.refSeqNumber) {
                var capTypes = null;
                var resultArray = new Array();
                if (arguments.length == 1) capTypes = arguments[0];

                var pm = aa.people.createPeopleModel().getOutput().getPeopleModel(); 
                var ccb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactDAOOracle").getOutput(); 
                pm.setServiceProviderCode(aa.getServiceProviderCode()) ; 
                pm.setContactSeqNumber(this.refSeqNumber); 

                var cList = ccb.getCapContactsByRefContactModel(pm).toArray();
                
                for (var j in cList) {
                    var thisCapId = aa.cap.getCapID(cList[j].getCapID().getID1(),cList[j].getCapID().getID2(),cList[j].getCapID().getID3()).getOutput();
                    if (capTypes && appMatch(capTypes,thisCapId)) {
                        var ccsm = aa.people.getCapContactByPK(thisCapId, cList[j].getPeople().contactSeqNumber).getOutput();
                        var newContactObj = new contactObj(ccsm);
                        resultArray.push(newContactObj)
                        }
                    }
            }
            
        return resultArray;
        }
        
		this.getRelatedRefLicProfObjs = function(){
			
			var refLicProfObjArray = new Array();
			
			// optional 2rd parameter serv_prov_code
				var updating = false;
				var serv_prov_code_4_lp = aa.getServiceProviderCode();
				if (arguments.length == 1) {
					serv_prov_code_4_lp = arguments[0];
					}
		
			if(this.refSeqNumber && serv_prov_code_4_lp)
			{
			  var xRefContactEntity = aa.people.getXRefContactEntityModel().getOutput();
			  xRefContactEntity.setServiceProviderCode(serv_prov_code_4_lp);
			  xRefContactEntity.setContactSeqNumber(parseInt(this.refSeqNumber));
			  xRefContactEntity.setEntityType("PROFESSIONAL");
			  //xRefContactEntity.setEntityID1(parseInt(refLicProfSeq));
			  var auditModel = xRefContactEntity.getAuditModel();
			  auditModel.setAuditDate(new Date());
			  auditModel.setAuditID(currentUserID);
			  auditModel.setAuditStatus("A")
			  xRefContactEntity.setAuditModel(auditModel);
			  var xRefContactEntityBusiness = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.XRefContactEntityBusiness").getOutput();
			  var xRefContactEntList = xRefContactEntityBusiness.getXRefContactEntityList(xRefContactEntity);
			  var xRefContactEntArray = xRefContactEntList.toArray();
			  if(xRefContactEntArray)
			  {
				 for(iLP in xRefContactEntArray){
					 var xRefContactEnt = xRefContactEntArray[iLP];
					 var lpSeqNbr = xRefContactEnt.getEntityID1();
					 var lpObjResult = aa.licenseScript.getRefLicenseProfBySeqNbr(aa.getServiceProviderCode(),lpSeqNbr);
					 var refLicNum = lpObjResult.getOutput().getStateLicense();
					 
					 refLicProfObjArray.push(new licenseProfObject1(refLicNum));
				 
				 }
				
			  }
			  else
			  {
				  logDebug("(contactObj.getRelatedRefLicProfObjs) - No Related Reference License License Professionals");
			  }
			  
			  return refLicProfObjArray;
			}
			else
			{
			  logDebug("**ERROR:Some Parameters are empty");
			}

		}
		
		this.linkRefContactWithRefLicProf = function(licnumber, lictype){
			
			var lpObj = new licenseProfObject(licnumber,lictype);
			var refLicProfSeq = lpObj.refLicModel.getLicSeqNbr();
			// optional 2rd parameter serv_prov_code
				var updating = false;
				var serv_prov_code_4_lp = aa.getServiceProviderCode();
				if (arguments.length == 3) {
					serv_prov_code_4_lp = arguments[2];
					}
		
			if(this.refSeqNumber && refLicProfSeq && serv_prov_code_4_lp)
			{
			  var xRefContactEntity = aa.people.getXRefContactEntityModel().getOutput();
			  xRefContactEntity.setServiceProviderCode(serv_prov_code_4_lp);
			  xRefContactEntity.setContactSeqNumber(parseInt(this.refSeqNumber));
			  xRefContactEntity.setEntityType("PROFESSIONAL");
			  xRefContactEntity.setEntityID1(parseInt(refLicProfSeq));
			  var auditModel = xRefContactEntity.getAuditModel();
			  auditModel.setAuditDate(new Date());
			  auditModel.setAuditID(currentUserID);
			  auditModel.setAuditStatus("A")
			  xRefContactEntity.setAuditModel(auditModel);
			  var xRefContactEntityBusiness = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.XRefContactEntityBusiness").getOutput();
			  var existedModel = xRefContactEntityBusiness.getXRefContactEntityByUIX(xRefContactEntity);
			  if(existedModel.getContactSeqNumber())
			  {
				logDebug("(contactObj) The License Professional has been linked to the Reference Contact.");
			  }
			  else
			  {
				var XRefContactEntityCreatedResult = xRefContactEntityBusiness.createXRefContactEntity(xRefContactEntity);
				if (XRefContactEntityCreatedResult)
				{
				  logDebug("(contactObj) The License Professional has been linked to the Reference Contact.");
				}
				else
				{
				  logDebug("(contactObj) **ERROR:License professional failed to link to reference contact.  Reason: " +  XRefContactEntityCreatedResult.getErrorMessage());
				}
			  }
			}
			else
			{
			  logDebug("**ERROR:Some Parameters are empty");
			}

		}
        
        this.createRefLicProf = function(licNum,rlpType,addressType,licenseState) {
            
            // optional 3rd parameter serv_prov_code
            var updating = false;
            var serv_prov_code_4_lp = aa.getServiceProviderCode();
            if (arguments.length == 5) {
                serv_prov_code_4_lp = arguments[4];
                aa.setDelegateAgencyCode(serv_prov_code_4_lp);
                }
            
            // addressType = one of the contact address types, or null to pull from the standard contact fields.
            var newLic = getRefLicenseProf(licNum,rlpType);

            if (newLic) {
                updating = true;
                logDebug("(contactObj) Updating existing Ref Lic Prof : " + licNum);
                }
            else {
                var newLic = aa.licenseScript.createLicenseScriptModel();
                }

            peop = this.people;
            cont = this.capContact;
            if (cont.getFirstName() != null) newLic.setContactFirstName(cont.getFirstName());
            if (peop.getMiddleName() != null) newLic.setContactMiddleName(peop.getMiddleName()); // use people for this
            if (cont.getLastName() != null) if (peop.getNamesuffix() != null) newLic.setContactLastName(cont.getLastName() + " " + peop.getNamesuffix()); else newLic.setContactLastName(cont.getLastName());
            if (peop.getBusinessName() != null) newLic.setBusinessName(peop.getBusinessName());
            if (peop.getPhone1() != null) newLic.setPhone1(peop.getPhone1());
            if (peop.getPhone2() != null) newLic.setPhone2(peop.getPhone2());
            if (peop.getEmail() != null) newLic.setEMailAddress(peop.getEmail());
            if (peop.getFax() != null) newLic.setFax(peop.getFax());
            newLic.setAgencyCode(serv_prov_code_4_lp);
            newLic.setAuditDate(sysDate);
            newLic.setAuditID(currentUserID);
            newLic.setAuditStatus("A");
            newLic.setLicenseType(rlpType);
            newLic.setStateLicense(licNum);
            newLic.setLicState(licenseState);
            //setting this field for a future enhancement to filter license types by the licensing board field. (this will be populated with agency names)
            var agencyLong = lookup("CONTACT_ACROSS_AGENCIES",servProvCode);
            if (!matches(agencyLong,undefined,null,"")) newLic.setLicenseBoard(agencyLong); else newLic.setLicenseBoard("");
 
            var addr = null;

            if (addressType) {
                for (var i in this.addresses) {
                    var cAddr = this.addresses[i];
                    if (addressType.equals(cAddr.getAddressType())) {
                        addr = cAddr;
                    }
                }
            }
            
            if (!addr) addr = peop.getCompactAddress();   //  only used on non-multiple addresses or if we can't find the right multi-address
            
            if (addr.getAddressLine1() != null) newLic.setAddress1(addr.getAddressLine1());
            if (addr.getAddressLine2() != null) newLic.setAddress2(addr.getAddressLine2());
            if (addr.getAddressLine3() != null) newLic.getLicenseModel().setTitle(addr.getAddressLine3());
            if (addr.getCity() != null) newLic.setCity(addr.getCity());
            if (addr.getState() != null) newLic.setState(addr.getState());
            if (addr.getZip() != null) newLic.setZip(addr.getZip());
            if (addr.getCountryCode() != null) newLic.getLicenseModel().setCountryCode(addr.getCountryCode());
            
            if (updating){
                myResult = aa.licenseScript.editRefLicenseProf(newLic);
				
			}
            else{
                myResult = aa.licenseScript.createRefLicenseProf(newLic);
				if (myResult.getSuccess())
                {
					var newRefLicSeqNbr = parseInt(myResult.getOutput());
					this.linkRefContactWithRefLicProf(licNum,rlpType,serv_prov_code_4_lp);
				}
			}

            if (arguments.length == 5) {
                aa.resetDelegateAgencyCode();
            }
                
            if (myResult.getSuccess())
                {
                logDebug("Successfully added/updated License No. " + licNum + ", Type: " + rlpType + " From Contact " + this);
                return true;
                }
            else
                {
                logDebug("**WARNING: can't create ref lic prof: " + myResult.getErrorMessage());
                return false;
                }
        }
        
        this.getAKA = function() {
            var aka = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleAKABusiness").getOutput();
            if (this.refSeqNumber) {
                return aka.getPeopleAKAListByContactNbr(aa.getServiceProviderCode(),String(this.refSeqNumber)).toArray();
                }
            else {
                logDebug("contactObj: Cannot get AKA names for a non-reference contact");
                return false;
                }
            }
            
        this.addAKA = function(firstName,middleName,lastName,fullName,startDate,endDate) {
            if (!this.refSeqNumber) {
                logDebug("contactObj: Cannot add AKA name for non-reference contact");
                return false;
                }
                
            var aka = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleAKABusiness").getOutput();
            var args = new Array();
            var akaModel = aa.proxyInvoker.newInstance("com.accela.orm.model.contact.PeopleAKAModel",args).getOutput();
            var auditModel = aa.proxyInvoker.newInstance("com.accela.orm.model.common.AuditModel",args).getOutput();

            var a = aka.getPeopleAKAListByContactNbr(aa.getServiceProviderCode(),String(this.refSeqNumber));
            akaModel.setServiceProviderCode(aa.getServiceProviderCode());
            akaModel.setContactNumber(parseInt(this.refSeqNumber));
            akaModel.setFirstName(firstName);
            akaModel.setMiddleName(middleName);
            akaModel.setLastName(lastName);
            akaModel.setFullName(fullName);
            akaModel.setStartDate(startDate);
            akaModel.setEndDate(endDate);
            auditModel.setAuditDate(new Date());
            auditModel.setAuditStatus("A");
            auditModel.setAuditID("ADMIN");
            akaModel.setAuditModel(auditModel);
            a.add(akaModel);

            aka.saveModels(aa.getServiceProviderCode(), this.refSeqNumber, a);
            }

        this.removeAKA = function(firstName,middleName,lastName) {
            if (!this.refSeqNumber) {
                logDebug("contactObj: Cannot remove AKA name for non-reference contact");
                return false;
                }
            
            var removed = false;
            var aka = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleAKABusiness").getOutput();
            var l = aka.getPeopleAKAListByContactNbr(aa.getServiceProviderCode(),String(this.refSeqNumber));
            
            var i = l.iterator();
            while (i.hasNext()) {
                var thisAKA = i.next();
                if ((!thisAKA.getFirstName() || thisAKA.getFirstName().equals(firstName)) && (!thisAKA.getMiddleName() || thisAKA.getMiddleName().equals(middleName)) && (!thisAKA.getLastName() || thisAKA.getLastName().equals(lastName))) {
                    i.remove();
                    logDebug("contactObj: removed AKA Name : " + firstName + " " + middleName + " " + lastName);
                    removed = true;
                    }
                }   
                    
            if (removed)
                aka.saveModels(aa.getServiceProviderCode(), this.refSeqNumber, l);
            }

        this.hasPublicUser = function() { 
            if (this.refSeqNumber == null) return false;
            var s_publicUserResult = aa.publicUser.getPublicUserListByContactNBR(aa.util.parseLong(this.refSeqNumber));
            
            if (s_publicUserResult.getSuccess()) {
                var fpublicUsers = s_publicUserResult.getOutput();
                if (fpublicUsers == null || fpublicUsers.size() == 0) {
                    logDebug("The contact("+this.refSeqNumber+") is not associated with any public user.");
                    return false;
                } else {
                    logDebug("The contact("+this.refSeqNumber+") is associated with "+fpublicUsers.size()+" public users.");
                    return true;
                }
            } else { logMessage("**ERROR: Failed to get public user by contact number: " + s_publicUserResult.getErrorMessage()); return false; }
        }

        this.linkToPublicUser = function(pUserId) { 
           
            if (pUserId != null) {
                var pSeqNumber = pUserId.replace('PUBLICUSER','');
                
                var s_publicUserResult = aa.publicUser.getPublicUser(aa.util.parseLong(pSeqNumber));

                if (s_publicUserResult.getSuccess()) {
                    var linkResult = aa.licenseScript.associateContactWithPublicUser(pSeqNumber, this.refSeqNumber);

                    if (linkResult.getSuccess()) {
                        logDebug("Successfully linked public user " + pSeqNumber + " to contact " + this.refSeqNumber);
                    } else {
                        logDebug("Failed to link contact to public user");
                        return false;
                    }
                } else {
                    logDebug("Could not find a public user with the seq number: " + pSeqNumber);
                    return false;
                }


            } else {
                logDebug("No public user id provided");
                return false;
            }
        }

        this.sendCreateAndLinkNotification = function() {
            //for the scenario in AA where a paper application has been submitted
            var toEmail = this.people.getEmail();

            if (toEmail) {
                var params = aa.util.newHashtable();
                getACARecordParam4Notification(params,acaUrl);
                addParameter(params, "$$licenseType$$", cap.getCapType().getAlias());
                addParameter(params,"$$altID$$",capIDString);
                var notificationName;

                if (this.people.getContactTypeFlag() == "individual") {
                    notificationName = this.people.getFirstName() + " " + this.people.getLastName();
                } else {
                    notificationName = this.people.getBusinessName();
                }

                if (notificationName)
                    addParameter(params,"$$notificationName$$",notificationName);
                if (this.refSeqNumber) {
                    var v = new verhoeff();
                    var pinCode = v.compute(String(this.refSeqNumber));
                    addParameter(params,"$$pinCode$$",pinCode);

                    sendNotification(sysFromEmail,toEmail,"","PUBLICUSER CREATE AND LINK",params,null);                    
                }

                               
            }

        }

        this.getRelatedRefContacts = function() { //Optional relationship types array 
            
            var relTypes;
            if (arguments.length > 0) relTypes = arguments[0];
            
            var relConsArray = new Array();

            if (matches(this.refSeqNumber,null,undefined,"")) return relConsArray;

            //check as the source
            var xrb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.XRefContactEntityBusiness").getOutput();
            xRefContactEntityModel = aa.people.getXRefContactEntityModel().getOutput();
            xRefContactEntityModel.setContactSeqNumber(parseInt(this.refSeqNumber));
            x = xrb.getXRefContactEntityList(xRefContactEntityModel);


            if (x.size() > 0) {
                var relConList = x.toArray();

                for (var zz in relConList) {
                    var thisRelCon = relConList[zz];
                    var addThisCon = true;
                    if (relTypes) {
                        addThisCon = exists(thisRelCon.getEntityID4(),relTypes);
                    }

                    if (addThisCon) {
                        var peopResult = aa.people.getPeople(thisRelCon.getEntityID1());
                        if (peopResult.getSuccess()) {
                            var peop = peopResult.getOutput();
                            relConsArray.push(peop);
                        }
                    }

                }
            }

            //check as the target
            var xrb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.XRefContactEntityBusiness").getOutput();
            xRefContactEntityModel = aa.people.getXRefContactEntityModel().getOutput();
            xRefContactEntityModel.setEntityID1(parseInt(this.refSeqNumber));
            x = xrb.getXRefContactEntityList(xRefContactEntityModel);

            if (x.size() > 0) {
                var relConList = x.toArray();

                for (var zz in relConList) {
                    var thisRelCon = relConList[zz];
                    var addThisCon = true;
                    if (relTypes) {
                        addThisCon = exists(thisRelCon.getEntityID4(),relTypes);
                    }

                    if (addThisCon) {
                        var peopResult = aa.people.getPeople(thisRelCon.getContactSeqNumber());
                        if (peopResult.getSuccess()) {
                            var peop = peopResult.getOutput();
                            relConsArray.push(peop);
                        }
                    }

                }
            }           

            return relConsArray;
        }
    }
function contactSetPrimary(pContactNbr)
{
// Makes contact the Primary Contact
// 06SSP-00186
//
if (pContactNbr==null)
	{
	logDebug("**ERROR: ContactNbr parameter is null");
	return false;
	}
else
	{
	var capContactResult = aa.people.getCapContactByPK(capId, pContactNbr);
	if (capContactResult.getSuccess())
		{
		var contact = capContactResult.getOutput();;
		var peopleObj=contact.getCapContactModel().getPeople();
		peopleObj.setFlag("Y");
		contact.getCapContactModel().setPeople(peopleObj);
		var editResult = aa.people.editCapContact(contact.getCapContactModel());
		if (editResult.getSuccess())
			{
			logDebug("Contact successfully set to Primary");
			return true;
			}
		else
			{
			logDebug("**ERROR: Could not set contact to Primary: "+editResult.getErrorMessage());
			return false;
			}
		}
	else
		{
		logDebug("**ERROR: Can't get contact: "+capContactResult.getErrorMessage());
		return false;
		}
	}
}

function copyAddress(srcCapId, targetCapId)
{
	//1. Get address with source CAPID.
	var capAddresses = getAddress(srcCapId);
	if (capAddresses == null || capAddresses.length == 0)
	{
		return;
	}
	//2. Get addresses with target CAPID.
	var targetAddresses = getAddress(targetCapId);
	//3. Check to see which address is matched in both source and target.
	for (loopk in capAddresses)
	{
		sourceAddressfModel = capAddresses[loopk];
		//3.1 Set target CAPID to source address.
		sourceAddressfModel.setCapID(targetCapId);
		targetAddressfModel = null;
		//3.2 Check to see if sourceAddress exist.
		if (targetAddresses != null && targetAddresses.length > 0)
		{
			for (loop2 in targetAddresses)
			{
				if (isMatchAddress(sourceAddressfModel, targetAddresses[loop2]))
				{
					targetAddressfModel = targetAddresses[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched address model.
		if (targetAddressfModel != null)
		{
		
			//3.3.1 Copy information from source to target.
			aa.address.copyAddressModel(sourceAddressfModel, targetAddressfModel);
			//3.3.2 Edit address with source address information. 
			aa.address.editAddressWithAPOAttribute(targetCapId, targetAddressfModel);
			logDebug("Copying address");
		}
		//3.4 It is new address model.
		else
		{	
			//3.4.1 Create new address.
			logDebug("Copying address");
			aa.address.createAddressWithAPOAttribute(targetCapId, sourceAddressfModel);
		}
	}
}
function copyAppSpecificInfo(srcCapId, targetCapId)
{
	//1. Get Application Specific Information with source CAPID.
	var  appSpecificInfo = getAppSpecificInfo(srcCapId);
	if (appSpecificInfo == null || appSpecificInfo.length == 0)
	{
		return;
	}
	//2. Set target CAPID to source Specific Information.
	for (loopk in appSpecificInfo)
	{
		var sourceAppSpecificInfoModel = appSpecificInfo[loopk];
		
		sourceAppSpecificInfoModel.setPermitID1(targetCapId.getID1());
		sourceAppSpecificInfoModel.setPermitID2(targetCapId.getID2());
		sourceAppSpecificInfoModel.setPermitID3(targetCapId.getID3());	
		//3. Edit ASI on target CAP (Copy info from source to target)
		aa.appSpecificInfo.editAppSpecInfoValue(sourceAppSpecificInfoModel);
	}
}
function copyAppSpecificRenewal(AInfo,newCap) // copy all App Specific info into new Cap, 1 optional parameter for ignoreArr
{
	var ignoreArr = new Array();
	var limitCopy = false;
	if (arguments.length > 2) 
	{
		ignoreArr = arguments[2];
		limitCopy = true;
	}
	
	for (asi in AInfo){
		//Check list
		if(limitCopy){
			var ignore=false;
		  	for(var i = 0; i < ignoreArr.length; i++)
		  		if(ignoreArr[i] == asi){
		  			ignore=true;
					logDebug("Skipping ASI Field: " + ignoreArr[i]);
		  			break;
		  		}
		  	if(ignore)
		  		continue;
		}
		//logDebug("Copying ASI Field: " + asi);
		editAppSpecific(asi,AInfo[asi],newCap);
	}
}
function copyASIInfo(srcCapId, targetCapId)
{
	//copy ASI infomation
	var AppSpecInfo = new Array();
	loadAppSpecific(AppSpecInfo,srcCapId);
	var recordType = "";
	
	var targetCapResult = aa.cap.getCap(targetCapId);

	if (!targetCapResult.getSuccess()) {
			logDebug("Could not get target cap object: " + targetCapId);
		}
	else	{
		var targetCap = targetCapResult.getOutput();
			targetAppType = targetCap.getCapType();		//create CapTypeModel object
			targetAppTypeString = targetAppType.toString();
			logDebug(targetAppTypeString);
		}

	var ignore = lookup("EMSE:ASI Copy Exceptions",targetAppTypeString); 
	var ignoreArr = new Array(); 
	if(ignore != null) 
	{
		ignoreArr = ignore.split("|");
		copyAppSpecificRenewal(AppSpecInfo,targetCapId, ignoreArr);
	}
	else
	{
		aa.print("something");
		copyAppSpecificRenewal(AppSpecInfo,targetCapId);

	}
}
function copyASITablesWithRemove(pFromCapId, pToCapId) {
	// Function dependencies on addASITable()
	// par3 is optional 0 based string array of table to ignore
	var itemCap = pFromCapId;

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
		var tai = ta.iterator();
	var tableArr = new Array();
	var ignoreArr = new Array();
	var limitCopy = false;
	if (arguments.length > 2) {
		ignoreArr = arguments[2];
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
			var ignore = false;
			for (var i = 0; i < ignoreArr.length; i++)
				if (ignoreArr[i] == tn) {
					ignore = true;
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
		removeASITable(tn, pToCapId)
		addASITable(tn, tempArray, pToCapId);
		logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	}
} 
 
/ *--------------------------------------------------------------------------------------------------------------------/
| Start ETW 12/3/14 copyContacts3_0
/--------------------------------------------------------------------------------------------------------------------* /
function copyContacts3_0(srcCapId, targetCapId) {
    //1. Get people with source CAPID.
    var capPeoples = getPeople3_0(srcCapId);
    if (capPeoples == null || capPeoples.length == 0) {
        return;
    }
    //2. Get people with target CAPID.
    var targetPeople = getPeople3_0(targetCapId);
    //3. Check to see which people is matched in both source and target.
    for (loopk in capPeoples) {
        sourcePeopleModel = capPeoples[loopk];
        //3.1 Set target CAPID to source people.
        sourcePeopleModel.getCapContactModel().setCapID(targetCapId);
        targetPeopleModel = null;
        //3.2 Check to see if sourcePeople exist.
        if (targetPeople != null && targetPeople.length > 0) {
            for (loop2 in targetPeople) {
                if (isMatchPeople3_0(sourcePeopleModel, targetPeople[loop2])) {
                    targetPeopleModel = targetPeople[loop2];
                    break;
                }
            }
        }
        //3.3 It is a matched people model.
        if (targetPeopleModel != null) {
            //3.3.1 Copy information from source to target.
            aa.people.copyCapContactModel(sourcePeopleModel.getCapContactModel(), targetPeopleModel.getCapContactModel());
            //3.3.2 Copy contact address from source to target.
            if (targetPeopleModel.getCapContactModel().getPeople() != null && sourcePeopleModel.getCapContactModel().getPeople()) {
                targetPeopleModel.getCapContactModel().getPeople().setContactAddressList(sourcePeopleModel.getCapContactModel().getPeople().getContactAddressList());
            }
            //3.3.3 Edit People with source People information.
            aa.people.editCapContactWithAttribute(targetPeopleModel.getCapContactModel());
        }
            //3.4 It is new People model.
        else {
            //3.4.1 Create new people.
            aa.people.createCapContactWithAttribute(sourcePeopleModel.getCapContactModel());
        }
    }
}
/ *--------------------------------------------------------------------------------------------------------------------/
| End ETW 12/3/14 copyContacts3_0
/--------------------------------------------------------------------------------------------------------------------* /


function copyDocuments(pFromCapId, pToCapId) {

	//Copies all attachments (documents) from pFromCapId to pToCapId
	var vFromCapId = pFromCapId;
	var vToCapId = pToCapId;
	var categoryArray = new Array();
	
	// third optional parameter is comma delimited list of categories to copy.
	if (arguments.length > 2) {
		categoryList = arguments[2];
		categoryArray = categoryList.split(",");
	}

	var capDocResult = aa.document.getDocumentListByEntity(capId,"CAP");
	if(capDocResult.getSuccess()) {
		if(capDocResult.getOutput().size() > 0) {
	    	for(docInx = 0; docInx < capDocResult.getOutput().size(); docInx++) {
	    		var documentObject = capDocResult.getOutput().get(docInx);
	    		currDocCat = "" + documentObject.getDocCategory();
	    		if (categoryArray.length == 0 || exists(currDocCat, categoryArray)) {
	    			// download the document content
					var useDefaultUserPassword = true;
					//If useDefaultUserPassword = true, there is no need to set user name & password, but if useDefaultUserPassword = false, we need define EDMS user name & password.
					var EMDSUsername = null;
					var EMDSPassword = null;
					var downloadResult = aa.document.downloadFile2Disk(documentObject, documentObject.getModuleName(), EMDSUsername, EMDSPassword, useDefaultUserPassword);
					if(downloadResult.getSuccess()) {
						var path = downloadResult.getOutput();
						logDebug("path=" + path);
					}
					var tmpEntId = vToCapId.getID1() + "-" + vToCapId.getID2() + "-" + vToCapId.getID3();
					documentObject.setDocumentNo(null);
					documentObject.setCapID(vToCapId)
					documentObject.setEntityID(tmpEntId);
	
					// Open and process file
					try {
						// put together the document content - use java.io.FileInputStream
						var newContentModel = aa.document.newDocumentContentModel().getOutput();
						inputstream = new java.io.FileInputStream(path);
						newContentModel.setDocInputStream(inputstream);
						documentObject.setDocumentContent(newContentModel);
						var newDocResult = aa.document.createDocument(documentObject);
						if (newDocResult.getSuccess()) {
							newDocResult.getOutput();
							logDebug("Successfully copied document: " + documentObject.getFileName());
						}
						else {
							logDebug("Failed to copy document: " + documentObject.getFileName());
							logDebug(newDocResult.getErrorMessage());
						}
					}
					catch (err) {
						logDebug("Error copying document: " + err.message);
						return false;
					}
				}
	    	} // end for loop
		}
    }
}
function doAllContactsHaveEmail(itemCap) {
	vConObjArry = getContactObjsByCap_SEA(itemCap);
	for (x in vConObjArry) {
		vConObj = vConObjArry[x];
		if (vConObj) {
			conEmail = vConObj.people.getEmail();
		}
		if (conEmail && conEmail != ""  ) {
			continue;
		}
		return false;
	}
	return true;
}
function doAssocFormRecs(formDataField, newAfData) {

	// FormDataField contains information about the child records already created.  it is either null, or the label of a hidden textArea field on the parent record.
	// if FormDataField is null, we will use the database to get info on thechild records that are already created.
	// if FormDataField is not null, the field will be used to store JSON data about the records.

	// newAfData is a JSON object that describes the records to create.  Structured like:
	// [{"ID":"1","Alias":"Food License","recordId":"14TMP-11111"}];
	//

	try {

		// get all record types

		var allRecordTypeMap = aa.util.newHashMap();
		var allRecordTypes = aa.cap.getCapTypeList(null).getOutput();
		if (allRecordTypes != null && allRecordTypes.length > 0) {
			for (var i = 0; i < allRecordTypes.length; i++) {
				var recordType = allRecordTypes[i].getCapType();
				var alias = recordType.getAlias();
				allRecordTypeMap.put(alias, recordType);
			}
		}

		// get an object representing all the existing child records in the database

		var childRecs = [];
		var capScriptModels = aa.cap.getChildByMasterID(capId).getOutput();
		if (capScriptModels) {
			for (var i = 0; i < capScriptModels.length; i++) {
				var capScriptModel = capScriptModels[i];
				if (capScriptModel) {
					var project = capScriptModel.getProjectModel();
					if (capScriptModel.getCapID() != null && project != null && project.getProject() != null && "AssoForm".equals(project.getProject().getRelationShip())) {
						var ct = capScriptModel.getCapModel().getCapType();
						childRecs.push({
							"ID" : i,
							"Alias" : String(capScriptModel.getCapModel().getAppTypeAlias()),
							"recordId" : String(capScriptModel.getCapID().getCustomID())
						});
						logDebug("adding : " + String(capScriptModel.getCapID().getCustomID()) + " to list of viable child records");
					}
				}
			}
		}

		if (!formDataField) { // use child records in database
			var afData = childRecs;
		} else { // use form field on record as the list of existing child records
			var afData = AInfo[formDataField];
			if (!afData || afData == "") {
				afData = [];
			} else {
				afData = JSON.parse(afData);
			}

			// filter this list against the existing child records, remove any that aren't really child records.
			afData = afData.filter(function (o) {
					bool = childRecs.map(function (e) {
							return e.recordId
						}).indexOf(o.recordId) >= 0;
					if (!bool)
						logDebug("Removing " + o.recordId + " from the list as it is not a viable child record");
					return bool
				});

			// remove any child recs that aren't in the form data field.
			for (var i in childRecs) {
				if (afData.map(function (e) {
						return e.recordId
					}).indexOf(childRecs[i].recordId) == -1) {
					logDebug("removing " + childRecs[i].recordId + " from record association, not found in " + formDataField);
					aa.cap.removeAppHierarchy(capId, aa.cap.getCapID(childRecs[i].recordId).getOutput());
				}
			}
		}

		logDebug("Existing Record Form Data (after filtering out bad data) : " + JSON.stringify(afData));

		// Check the existing child records and re-use any of the same type.
		// This code only looks at the record type to be created, not an ID field.  It's assumed that if we are using this code
		// we probably aren't using an ASI table, so we're ignoring the ID field.

		for (var i in newAfData) {
			var n = newAfData[i];
			var z = afData.map(function (e) {
					return e.Alias;
				}).indexOf(n.Alias); // found a match
			if (z >= 0) {
				n.recordId = afData[z].recordId; // use this record
				logDebug(n.Alias + " will use existing viable child record id " + n.recordId);
				afData.splice(z, 1);
			} else {
				logDebug("no " + n.Alias + " record found in existing afData");
			}
		}

		// Delete everything thats left in AfData, we aren't using it.

		for (var i in afData) {
			logDebug("removing unused child record " + afData[i].recordId);
			aa.cap.removeAppHierarchy(capId, aa.cap.getCapID(afData[i].recordId).getOutput());
		}

		// create any records that don't already exist.

		for (var i in newAfData) {
			var r = newAfData[i];
			var ctm = allRecordTypeMap.get(r.Alias);
			if (!newAfData[i].recordId || newAfData[i].recordId == "") {
				logDebug("attempting to create record : " + ctm);
				var result = aa.cap.createSimplePartialRecord(ctm, null, "INCOMPLETE CAP");
				if (result.getSuccess() && result.getOutput() != null) {
					var newCapId = result.getOutput();
					logDebug("created new associated form record " + newCapId.getCustomID() + " for type " + r.Alias);
					aa.cap.createAssociatedFormsHierarchy(capId, newCapId);
					var capResult = aa.cap.getCap(newCapId);
					var capModel = capResult.getOutput().getCapModel();
					// custom for BCC.   Set a value on the child record so we can testing the page flow in order to skip the "parentID" request.
					capModel.setSpecialText("form");
					//capModel.setApplicantModel(cap.getApplicantModel());
					aa.cap.editCapByPK(capModel);
					r.recordId = String(newCapId.getCustomID());
					// stuff can be copied in here, if needed.   I think it should be copied in after the CTRCA
				} else {
					logDebug("error creating new associated form record for type " + r.Alias + ", " + result.getErrorMessage());
				}
			} else {
				logDebug("using existing associated form record " + r.recordId + " for type " + r.Alias);
			}
		}

		// save JSON data to field on parent page.

		if (formDataField) {editAppSpecific(formDataField, JSON.stringify(newAfData));}
	} catch (err) {
		logDebug("runtime error : " + err.message);
		logDebug("runtime error : " + err.stack);
	}

}
function doesContactExistOnRecord(cSeqNum, itemCap) {
	var contactArr = getContactObjsByCap_BCC(itemCap);
	for (var cIndex in contactArr) {
		var thisContact = contactArr[cIndex];
		if (thisContact.type == "Business Owner") {
			var refContactSeqNum = thisContact.refSeqNumber;
			if (refContactSeqNum == cSeqNum) {
				return true;
			}
		}
	}
	return false;	
}
function doScriptActions() {
                include(prefix + ":" + "* /* /* /*");
                if (typeof(appTypeArray) == "object") {
                                                include(prefix + ":" + appTypeArray[0] + "/~/~/~");
                                                include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/~/~");
                                                include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/~");
                                                include(prefix + ":" + appTypeArray[0] + "/~/" + appTypeArray[2] + "/~");
                                                include(prefix + ":" + appTypeArray[0] + "/~/" + appTypeArray[2] + "/" + appTypeArray[3]);
                                                include(prefix + ":" + appTypeArray[0] + "/~/~/" + appTypeArray[3]);
                                                include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/~/" + appTypeArray[3]);
                                                include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/" + appTypeArray[3]);
                                                }
                }

function editAppSpecificACALabel(itemName,itemValue)  // optional: itemCap
{
	var appSpecInfoResult;
	var vAppSpecInfoArry;
	var vAppSpecScriptModel;
	var vAppSaveResult;
	var x;
	var itemCap = capId;
	var itemGroup = null;

	if (arguments.length == 3) {
		itemCap = arguments[2]; // use cap ID specified in args	
	}
   	
	appSpecInfoResult = aa.appSpecificInfo.getAppSpecificInfos(itemCap, itemName);

	if (appSpecInfoResult.getSuccess()) {
		vAppSpecInfoArry = appSpecInfoResult.getOutput();
		for (x in vAppSpecInfoArry) {
			vAppSpecScriptModel = vAppSpecInfoArry[x];
			vAppSpecScriptModel.setAlternativeLabel(itemValue);
		}
		vAppSaveResult = aa.appSpecificInfo.editAppSpecificInfo(vAppSpecInfoArry);
		if (vAppSaveResult.getSuccess()) {
			aa.print('ACA label changed to: ' + itemValue);
		}
		else {
			aa.print('Failed to update the ACA label for ASI field: ' + itemName);
		}
	} 	
	else {
		aa.print( "WARNING: " + itemName + " was not updated."); 
	}
}
function editASITDisplay4ACAPageFlow(destinationTableGroupModel, tableName, vDisp) // optional capId
{
	var itemCap = capId
		if (arguments.length > 3)
			itemCap = arguments[3]; // use cap ID specified in args

	var ta = destinationTableGroupModel.getTablesMap().values();
	var tai = ta.iterator();

	var found = false;
	while (tai.hasNext()) {
		var tsm = tai.next(); // com.accela.aa.aamain.appspectable.AppSpecificTableModel
		if (tsm.getTableName().equals(tableName)) {
			found = true;
			break;
		}
	}

	if (!found) {
		logDebug("cannot update asit for ACA, no matching table name");
		return false;
	}

	tsm.setVchDispFlag(vDisp);
	
	tssm = tsm;
	return destinationTableGroupModel;
}
function editContactASI(cContact, asiName, asiValue) {
	peopleModel = cContact.getPeople();
	peopleTemplate = peopleModel.getTemplate();
	if (peopleTemplate == null) return;
	var templateGroups = peopleTemplate.getTemplateForms(); //ArrayList
	var gArray = new Array(); 
	if (!(templateGroups == null || templateGroups.size() == 0)) {
		thisGroup = templateGroups.get(0);
		var subGroups = templateGroups.get(0).getSubgroups();
		for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++) {
			var subGroup = subGroups.get(subGroupIndex);
			var fArray = new Array();
			var fields = subGroup.getFields();
			for (var fieldIndex = 0; fieldIndex < fields.size(); fieldIndex++) {
				var field = fields.get(fieldIndex);
				fArray[field.getDisplayFieldName()] = field.getDefaultValue();
				if(field.getDisplayFieldName().toString().toUpperCase()==asiName.toString().toUpperCase()) {
					field.setDefaultValue(asiValue);
					fields.set(fieldIndex, field);  //set the field in the ArrayList of fields
					subGroup.setFields(fields);	
					subGroups.set(subGroupIndex, subGroup);
					thisGroup.setSubgroups(subGroups);
					templateGroups.set(0, thisGroup);
					peopleTemplate.setTemplateForms(templateGroups);
					peopleModel.setTemplate(peopleTemplate);
					cContact.setPeople(peopleModel);
					editResult = aa.people.editCapContact(cContact.getCapContactModel());
					if (editResult.getSuccess()) 
						logDebug("Successfully edited the contact ASI");
				}
			}
		}
	}
}
/ *
emailAsync_BCC - parallel function for emailContacts_BCC when you have actual email addresses instead of contact types
  Required Params:
     sendEmailToAddresses = comma-separated list of email addresses, no spaces
     emailTemplate = notification template name
  Optional Params: (use blank string, not null, if missing!)
     vEParams = parameters to be filled in notification template
     reportTemplate = if provided, will run report and attach to record and include a link to it in the email
     vRParams  = report parameters
     manualNotificationList = comma-separated list of contact names without email to be listed in Manual Notification adhoc task
     changeReportName = if using reportTemplate, will change the title of the document produced by the report from its default

Sample: emailAsync_BCC('gephartj@seattle.gov', 'DPD_WAITING_FOR_PAYMENT'); //minimal
        emailAsync_BCC('gephartj@seattle.gov,joe@smith.com', 'DPD_PERMIT_ISSUED', "", 'Construction Permit', paramHashtable, 'Jane Doe-Applicant,Adam West-Batman', 'This is Your Permit'); //full
 * /
function emailAsync_BCC(sendEmailToAddresses, emailTemplate, vEParams, reportTemplate, vRParams, manualNotificationList, changeReportName) {
	var vAsyncScript = "SEND_EMAIL_ASYNC";
	
	//Start modification to support batch script
	var vEvntTyp = aa.env.getValue("eventType");
	if (vEvntTyp == "Batch Process") {
		aa.env.setValue("sendEmailToAddresses", sendEmailToAddresses);
		aa.env.setValue("emailTemplate", emailTemplate);
		aa.env.setValue("vEParams", vEParams);
		aa.env.setValue("reportTemplate", reportTemplate);
		aa.env.setValue("vRParams", vRParams);
		aa.env.setValue("vChangeReportName", changeReportName);
		aa.env.setValue("CapId", capId);
		aa.env.setValue("adHocTaskContactsList", manualNotificationList);		
		//call sendEmailASync script
		logDebug("Attempting to run Non-Async: " + vAsyncScript);
		aa.includeScript(vAsyncScript);
	}
	else {
		//Can't store nulls in a hashmap, so check optional params just in case
		if (vEParams == null || vEParams == "") { vEParams = aa.util.newHashtable(); }
		if (vRParams == null || vRParams == "") { vRParams = aa.util.newHashtable(); }
		if (reportTemplate == null) { reportTemplate = ""; }
		if (changeReportName == null) { changeReportName = ""; }
		if (manualNotificationList == null) { manualNotificationList = ""; }
		
		//Save variables to the hash table and call sendEmailASync script. This allows for the email to contain an ACA deep link for the document
		var envParameters = aa.util.newHashMap();
		envParameters.put("sendEmailToAddresses", sendEmailToAddresses);
		envParameters.put("emailTemplate", emailTemplate);
		envParameters.put("vEParams", vEParams);
		envParameters.put("reportTemplate", reportTemplate);
		envParameters.put("vRParams", vRParams);
		envParameters.put("vChangeReportName", changeReportName);
		envParameters.put("CapId", capId);
		envParameters.put("adHocTaskContactsList", manualNotificationList);
		
		//call sendEmailASync script
		logDebug("Attempting to run Async: " + vAsyncScript);
		aa.runAsyncScript(vAsyncScript, envParameters);
	}
	//End modification to support batch script
	
	return true;
}
/ *
emailContacts_BCC
  Required Params:
     sendEmailToContactTypes = comma-separated list of contact types to send to, no spaces
     emailTemplate = notification template name
  Optional Params: (use blank string, not null, if missing!)
     vEParams = parameters to be filled in notification template
     reportTemplate = if provided, will run report and attach to record and include a link to it in the email
     vRParams  = report parameters
	 vAddAdHocTask = Y/N for adding manual notification task when no email exists
     changeReportName = if using reportTemplate, will change the title of the document produced by the report from its default

Sample: emailContacts_BCC('OWNER APPLICANT', 'DPD_WAITING_FOR_PAYMENT'); //minimal
        emailContacts_BCC('OWNER APPLICANT,BUSINESS OWNER', 'DPD_PERMIT_ISSUED', eParamHashtable, 'Construction Permit', rParamHashtable, 'Y', 'New Report Name'); //full
 * /
function emailContacts_BCC(sendEmailToContactTypes, emailTemplate, vEParams, reportTemplate, vRParams) {
	var vChangeReportName = "";
	var conTypeArray = [];
	var validConTypes = getContactTypes_BCC();
	var x = 0;
	var vConType;
	var vAsyncScript = "SEND_EMAIL_TO_CONTACTS_ASYNC";
	var envParameters = aa.util.newHashMap();
	var vAddAdHocTask = true;

	//Ad-hoc Task Requested
	if (arguments.length > 5) {
		vAddAdHocTask = arguments[5]; // use provided prefrence for adding an ad-hoc task for manual notification
		if (vAddAdHocTask == "N") {
logDebug("No adhoc task");			
			vAddAdHocTask = false;
		}
	}
	
	//Change Report Name Requested
	if (arguments.length > 6) {
		vChangeReportName = arguments[6]; // use provided report name
	}

logDebug("Provided contact types to send to: " + sendEmailToContactTypes);
	
	//Check to see if provided contact type(s) is/are valid
	if (sendEmailToContactTypes != "All" && sendEmailToContactTypes != null && sendEmailToContactTypes != '') {
		conTypeArray = sendEmailToContactTypes.split(",");
	}
	for (x in conTypeArray) {
		//check all that are not "Primary"
		vConType = conTypeArray[x];
		if (vConType != "Primary" && !exists(vConType, validConTypes)) {
			logDebug(vConType + " is not a valid contact type. No actions will be taken for this type.");
			conTypeArray.splice(x, (x+1));
		}
	}
	//Check if any types remain. If not, don't continue processing
	if ((sendEmailToContactTypes != "All" && sendEmailToContactTypes != null && sendEmailToContactTypes != '') && conTypeArray.length <= 0) {
		logDebug(vConType + " is not a valid contact type. No actions will be taken for this type.");
		return false;	
	}
	else if((sendEmailToContactTypes != "All" && sendEmailToContactTypes != null && sendEmailToContactTypes != '') && conTypeArray.length > 0) {
		sendEmailToContactTypes = conTypeArray.toString();
	}
	
logDebug("Validated contact types to send to: " + sendEmailToContactTypes);	
	//Save variables to the hash table and call sendEmailASync script. This allows for the email to contain an ACA deep link for the document
	envParameters.put("sendEmailToContactTypes", sendEmailToContactTypes);
	envParameters.put("emailTemplate", emailTemplate);
	envParameters.put("vEParams", vEParams);
	envParameters.put("reportTemplate", reportTemplate);
	envParameters.put("vRParams", vRParams);
	envParameters.put("vChangeReportName", vChangeReportName);
	envParameters.put("CapId", capId);
	envParameters.put("vAddAdHocTask", vAddAdHocTask);
	
	//Start modification to support batch script
	var vEvntTyp = aa.env.getValue("eventType");
	if (vEvntTyp == "Batch Process") {
		aa.env.setValue("sendEmailToContactTypes", sendEmailToContactTypes);
		aa.env.setValue("emailTemplate", emailTemplate);
		aa.env.setValue("vEParams", vEParams);
		aa.env.setValue("reportTemplate", reportTemplate);
		aa.env.setValue("vRParams", vRParams);
		aa.env.setValue("vChangeReportName", vChangeReportName);
		aa.env.setValue("CapId", capId);
		aa.env.setValue("vAddAdHocTask", vAddAdHocTask);		
		//call sendEmailASync script
		logDebug("Attempting to run Non-Async: " + vAsyncScript);
		aa.includeScript(vAsyncScript);
	}
	else {
		//call sendEmailASync script
		logDebug("Attempting to run Async: " + vAsyncScript);
		aa.runAsyncScript(vAsyncScript, envParameters);
	}
	//End modification to support batch script
	
	return true;
}
function getExistingBusinessInfo(C) {
	return existingBusinesses().filter(function (I) {
		return I.B.equals(C)
	})
}
function isGroup1(C) {
	return existingBusinesses().filter(function (I) {
		return I.B.equals(C) && 1 == I.S
	}).length > 0
}
function isGroup2(C) {
	return existingBusinesses().filter(function (I) {
		return I.B.equals(C) && 2 == I.S
	}).length > 0
}
function validateId(C, I, A) {
	var C = String(parseFloat(C.replace(/-/g, ""))),
	I = I.replace(/-/g, ""),
	N = idLookupTable(),
	A = right(A, 4),
	O = N.filter(function (A) {
			return String(A.A).equals(C) && String(A.F).equals(I)
		}),
	T = N.filter(function (I) {
			return String(I.A).equals(C) && String(I.S).equals(A)
		});
	return O.length > 0 || T.length > 0
}
function right(C, I) {
	if (0 >= I)
		return "";
	if (I > String(C).length)
		return C;
	var A = String(C).length;
	return String(C).substring(A, A - I)
}


function existingBusinesses(){return[{B:"0000999999-9999-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-8888-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-8877-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-8866-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-8855-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-8844-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-8833-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-8822-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-8811-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-8800-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-7799-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-7788-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-7777-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-7766-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-7755-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-7744-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-7733-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-7722-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-7711-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-7700-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-6699-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-6688-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-6677-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-6666-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-6655-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-6644-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-6633-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-6622-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-6611-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-6600-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-5599-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-5588-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-5577-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-5566-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-5555-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-5544-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-5533-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-5522-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-5511-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000999999-5500-9",COUNCIL_DISTRICT:1,LOCATION:"1,1",S:1},{B:"0000978516-0001-2",COUNCIL_DISTRICT:3,LOCATION:"34.1996, -118.5347",S:1},{B:"0000097184-0001-2",COUNCIL_DISTRICT:15,LOCATION:"33.7898, -118.3084",S:1},{B:"0002033952-0001-0",COUNCIL_DISTRICT:3,LOCATION:"34.1698, -118.6062",S:1},{B:"0002053218-0001-8",COUNCIL_DISTRICT:5,LOCATION:"34.0752, -118.3836",S:1},{B:"0002072981-0001-4",COUNCIL_DISTRICT:14,LOCATION:"34.0159, -118.2067",S:1},{B:"0002072463-0001-5",COUNCIL_DISTRICT:11,LOCATION:"33.9906, -118.4455",S:1},{B:"0002581502-0001-3",COUNCIL_DISTRICT:13,LOCATION:"34.0945, -118.2403",S:1},{B:"0002086145-0001-8",COUNCIL_DISTRICT:14,LOCATION:"34.0446, -118.2544",S:1},{B:"0002086566-0001-2",COUNCIL_DISTRICT:3,LOCATION:"34.1657, -118.624",S:1},{B:"0002097999-0001-3",COUNCIL_DISTRICT:11,LOCATION:"34.0021, -118.4696",S:1},{B:"0002095479-0001-1",COUNCIL_DISTRICT:11,LOCATION:"34.0116, -118.4203",S:1},{B:"0002112599-0001-9",COUNCIL_DISTRICT:12,LOCATION:"34.2216, -118.5012",S:1},{B:"0002107645-0001-1",COUNCIL_DISTRICT:13,LOCATION:"34.1, -118.3223",S:1},{B:"0002192299-0001-5",COUNCIL_DISTRICT:14,LOCATION:"34.0296, -118.2466",S:1},{B:"0002112115-0001-9",COUNCIL_DISTRICT:11,LOCATION:"33.9926, -118.4233",S:1},{B:"0002112381-0001-2",COUNCIL_DISTRICT:12,LOCATION:"34.2572, -118.5999",S:1},{B:"0000382947-0002-9",COUNCIL_DISTRICT:14,LOCATION:"34.0235, -118.2448",S:1},{B:"0002118901-0001-6",COUNCIL_DISTRICT:12,LOCATION:"0, 0",S:1},{B:"0002115894-0001-2",COUNCIL_DISTRICT:13,LOCATION:"34.082, -118.272",S:1},{B:"0000410225-0002-1",COUNCIL_DISTRICT:13,LOCATION:"34.107, -118.2552",S:1},{B:"0002117413-0001-1",COUNCIL_DISTRICT:14,LOCATION:"34.0595, -118.2156",S:1},{B:"0002173768-0001-5",COUNCIL_DISTRICT:5,LOCATION:"34.0445, -118.4323",S:1},{B:"0002163060-0001-5",COUNCIL_DISTRICT:4,LOCATION:"34.1494, -118.4396",S:1},{B:"0002165101-0001-1",COUNCIL_DISTRICT:2,LOCATION:"34.2096, -118.4486",S:1},{B:"0002132954-0001-7",COUNCIL_DISTRICT:5,LOCATION:"34.0835, -118.3506",S:1},{B:"0002168149-0001-3",COUNCIL_DISTRICT:4,LOCATION:"34.164, -118.4661",S:1},{B:"0002173088-0001-5",COUNCIL_DISTRICT:11,LOCATION:"34.0289, -118.4542",S:1},{B:"0002172987-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0178, -118.1986",S:1},{B:"0002173631-0001-4",COUNCIL_DISTRICT:3,LOCATION:"34.1971, -118.5351",S:1},{B:"0002174731-0001-0",COUNCIL_DISTRICT:2,LOCATION:"34.1558, -118.3702",S:1},{B:"0002104144-0003-0",COUNCIL_DISTRICT:11,LOCATION:"34.0116, -118.4203",S:1},{B:"0002174190-0001-8",COUNCIL_DISTRICT:12,LOCATION:"34.2368, -118.5962",S:1},{B:"0002184683-0001-5",COUNCIL_DISTRICT:2,LOCATION:"34.1441, -118.3624",S:1},{B:"0002176979-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2167, -118.4715",S:1},{B:"0002181643-0001-9",COUNCIL_DISTRICT:11,LOCATION:"34.0004, -118.4659",S:1},{B:"0002178426-0001-3",COUNCIL_DISTRICT:2,LOCATION:"34.1644, -118.3674",S:1},{B:"0002179348-0001-9",COUNCIL_DISTRICT:11,LOCATION:"34.0431, -118.4689",S:1},{B:"0000460382-0001-1",COUNCIL_DISTRICT:12,LOCATION:"34.2505, -118.6062",S:1},{B:"0002182264-0001-5",COUNCIL_DISTRICT:2,LOCATION:"34.1396, -118.3787",S:1},{B:"0002181863-0001-2",COUNCIL_DISTRICT:13,LOCATION:"34.0835, -118.3072",S:1},{B:"0002183298-0001-1",COUNCIL_DISTRICT:2,LOCATION:"34.1637, -118.3702",S:1},{B:"0002175639-0001-5",COUNCIL_DISTRICT:8,LOCATION:"33.9833, -118.3148",S:1},{B:"0002101730-0002-7",COUNCIL_DISTRICT:11,LOCATION:"33.9877, -118.4708",S:1},{B:"0002178151-0001-7",COUNCIL_DISTRICT:11,LOCATION:"33.9619, -118.421",S:1},{B:"0002195358-0001-6",COUNCIL_DISTRICT:12,LOCATION:"34.2357, -118.5728",S:1},{B:"0002184569-0001-7",COUNCIL_DISTRICT:12,LOCATION:"34.2325, -118.5794",S:1},{B:"0002189179-0001-4",COUNCIL_DISTRICT:6,LOCATION:"34.198, -118.4858",S:1},{B:"0002189128-0001-1",COUNCIL_DISTRICT:14,LOCATION:"34.0282, -118.2322",S:1},{B:"0002191730-0001-6",COUNCIL_DISTRICT:4,LOCATION:"34.1498, -118.4421",S:1},{B:"0002183557-0001-7",COUNCIL_DISTRICT:6,LOCATION:"34.2371, -118.3713",S:1},{B:"0002209814-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2221, -118.36",S:1},{B:"0002190335-0001-9",COUNCIL_DISTRICT:1,LOCATION:"34.0754, -118.2215",S:1},{B:"0002189025-0001-0",COUNCIL_DISTRICT:5,LOCATION:"34.0285, -118.3924",S:1},{B:"0002201626-0001-0",COUNCIL_DISTRICT:2,LOCATION:"34.182, -118.3703",S:1},{B:"0002289515-0001-2",COUNCIL_DISTRICT:3,LOCATION:"34.1567, -118.6063",S:1},{B:"0002193580-0001-2",COUNCIL_DISTRICT:12,LOCATION:"34.2418, -118.6061",S:1},{B:"0002178173-0001-3",COUNCIL_DISTRICT:15,LOCATION:"33.8314, -118.3079",S:1},{B:"0002195649-0001-1",COUNCIL_DISTRICT:4,LOCATION:"34.0911, -118.3431",S:1},{B:"0002198991-0001-0",COUNCIL_DISTRICT:2,LOCATION:"34.1399, -118.3837",S:1},{B:"0002202307-0001-0",COUNCIL_DISTRICT:12,LOCATION:"34.2282, -118.537",S:1},{B:"0002203172-0001-3",COUNCIL_DISTRICT:14,LOCATION:"34.0272, -118.2531",S:1},{B:"0002200695-0001-3",COUNCIL_DISTRICT:4,LOCATION:"34.1793, -118.4574",S:1},{B:"0002198520-0001-7",COUNCIL_DISTRICT:5,LOCATION:"34.0422, -118.4417",S:1},{B:"0002205101-0001-8",COUNCIL_DISTRICT:14,LOCATION:"34.0256, -118.2329",S:1},{B:"0002201665-0001-0",COUNCIL_DISTRICT:15,LOCATION:"33.7805, -118.2523",S:1},{B:"0002206249-0001-4",COUNCIL_DISTRICT:13,LOCATION:"34.0874, -118.3091",S:1},{B:"0002207035-0001-3",COUNCIL_DISTRICT:2,LOCATION:"34.1414, -118.388",S:1},{B:"0002207291-0001-3",COUNCIL_DISTRICT:6,LOCATION:"34.2409, -118.39",S:1},{B:"0002207858-0001-0",COUNCIL_DISTRICT:14,LOCATION:"34.0155, -118.2006",S:1},{B:"0002205123-0001-4",COUNCIL_DISTRICT:3,LOCATION:"34.1664, -118.6219",S:1},{B:"0002210244-0001-4",COUNCIL_DISTRICT:7,LOCATION:"34.2916, -118.4125",S:1},{B:"0002211289-0001-9",COUNCIL_DISTRICT:9,LOCATION:"34.0177, -118.2438",S:1},{B:"0002211556-0001-9",COUNCIL_DISTRICT:5,LOCATION:"34.0636, -118.4477",S:1},{B:"0002210665-0001-9",COUNCIL_DISTRICT:10,LOCATION:"34.0478, -118.348",S:1},{B:"0002211791-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0186, -118.2396",S:1},{B:"0002212464-0001-2",COUNCIL_DISTRICT:2,LOCATION:"34.1457, -118.4172",S:1},{B:"0002225069-0001-1",COUNCIL_DISTRICT:5,LOCATION:"34.0888, -118.3764",S:1},{B:"0002231857-0001-1",COUNCIL_DISTRICT:5,LOCATION:"34.0768, -118.4687",S:1},{B:"0002226675-0001-2",COUNCIL_DISTRICT:13,LOCATION:"34.1259, -118.2637",S:1},{B:"0002212486-0001-9",COUNCIL_DISTRICT:14,LOCATION:"34.1417, -118.222",S:1},{B:"0002208457-0001-0",COUNCIL_DISTRICT:7,LOCATION:"34.2572, -118.465",S:1},{B:"0002215717-0001-4",COUNCIL_DISTRICT:7,LOCATION:"34.2573, -118.4708",S:1},{B:"0002208428-0001-3",COUNCIL_DISTRICT:5,LOCATION:"34.0706, -118.3759",S:1},{B:"0002218104-0001-0",COUNCIL_DISTRICT:4,LOCATION:"34.1522, -118.3649",S:1},{B:"0002218073-0001-2",COUNCIL_DISTRICT:10,LOCATION:"34.0508, -118.363",S:1},{B:"0002219954-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.1849, -118.6233",S:1},{B:"0002220478-0001-6",COUNCIL_DISTRICT:9,LOCATION:"34.0108, -118.2796",S:1},{B:"0002220929-0001-3",COUNCIL_DISTRICT:14,LOCATION:"0, 0",S:1},{B:"0002227446-0001-7",COUNCIL_DISTRICT:5,LOCATION:"34.063, -118.3623",S:1},{B:"0002224451-0001-6",COUNCIL_DISTRICT:5,LOCATION:"34.0613, -118.4474",S:1},{B:"0002227550-0001-1",COUNCIL_DISTRICT:11,LOCATION:"33.9979, -118.4749",S:1},{B:"0002224443-0001-1",COUNCIL_DISTRICT:15,LOCATION:"33.8583, -118.2955",S:1},{B:"0002225065-0001-2",COUNCIL_DISTRICT:10,LOCATION:"34.0444, -118.3525",S:1},{B:"0002225456-0001-6",COUNCIL_DISTRICT:3,LOCATION:"34.1647, -118.6271",S:1},{B:"0002184860-0010-0",COUNCIL_DISTRICT:5,LOCATION:"34.084, -118.3697",S:1},{B:"0002231724-0001-8",COUNCIL_DISTRICT:2,LOCATION:"34.21, -118.3634",S:1},{B:"0002226606-0001-1",COUNCIL_DISTRICT:5,LOCATION:"34.0471, -118.4438",S:1},{B:"0002228941-0001-2",COUNCIL_DISTRICT:6,LOCATION:"34.1999, -118.4662",S:1},{B:"0002248388-0002-1",COUNCIL_DISTRICT:6,LOCATION:"34.247, -118.3844",S:1},{B:"0002236085-0001-3",COUNCIL_DISTRICT:14,LOCATION:"34.0753, -118.1666",S:1},{B:"0002232461-0001-1",COUNCIL_DISTRICT:7,LOCATION:"34.2648, -118.4671",S:1},{B:"0002246867-0001-7",COUNCIL_DISTRICT:15,LOCATION:"33.8176, -118.3065",S:1},{B:"0002233176-0001-1",COUNCIL_DISTRICT:10,LOCATION:"34.045, -118.3486",S:1},{B:"0002233236-0001-4",COUNCIL_DISTRICT:11,LOCATION:"33.9868, -118.4444",S:1},{B:"0002082405-0002-7",COUNCIL_DISTRICT:3,LOCATION:"34.1662, -118.5931",S:1},{B:"0002234992-0001-2",COUNCIL_DISTRICT:13,LOCATION:"34.0928, -118.2803",S:1},{B:"0002235309-0001-0",COUNCIL_DISTRICT:7,LOCATION:"34.2738, -118.4314",S:1},{B:"0002236381-0001-0",COUNCIL_DISTRICT:8,LOCATION:"0, 0",S:1},{B:"0002239633-0001-7",COUNCIL_DISTRICT:3,LOCATION:"34.2018, -118.5954",S:1},{B:"0002238832-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.1799, -118.535",S:1},{B:"0002239627-0001-1",COUNCIL_DISTRICT:4,LOCATION:"34.1793, -118.4453",S:1},{B:"0002243958-0001-4",COUNCIL_DISTRICT:14,LOCATION:"34.0523, -118.232",S:1},{B:"0002228537-0001-3",COUNCIL_DISTRICT:14,LOCATION:"34.0348, -118.2237",S:1},{B:"0002193730-0002-9",COUNCIL_DISTRICT:9,LOCATION:"33.9919, -118.2568",S:1},{B:"0002239291-0001-7",COUNCIL_DISTRICT:9,LOCATION:"33.9856, -118.2606",S:1},{B:"0002239788-0001-6",COUNCIL_DISTRICT:10,LOCATION:"34.0188, -118.3193",S:1},{B:"0002240228-0001-4",COUNCIL_DISTRICT:2,LOCATION:"34.2024, -118.4247",S:1},{B:"0002247944-0001-1",COUNCIL_DISTRICT:12,LOCATION:"34.2273, -118.5319",S:1},{B:"0002242390-0001-6",COUNCIL_DISTRICT:5,LOCATION:"34.1646, -118.5248",S:1},{B:"0002243160-0001-6",COUNCIL_DISTRICT:6,LOCATION:"34.2113, -118.4629",S:1},{B:"0002262577-0001-0",COUNCIL_DISTRICT:3,LOCATION:"34.1998, -118.5977",S:1},{B:"0002244476-0001-9",COUNCIL_DISTRICT:6,LOCATION:"34.2078, -118.4836",S:1},{B:"0002245640-0001-4",COUNCIL_DISTRICT:5,LOCATION:"34.1532, -118.4686",S:1},{B:"0002245971-0001-4",COUNCIL_DISTRICT:13,LOCATION:"34.0985, -118.3298",S:1},{B:"0002246086-0001-4",COUNCIL_DISTRICT:14,LOCATION:"34.0305, -118.2306",S:1},{B:"0002245715-0001-4",COUNCIL_DISTRICT:6,LOCATION:"34.2281, -118.3743",S:1},{B:"0002248953-0001-8",COUNCIL_DISTRICT:14,LOCATION:"34.036, -118.2634",S:1},{B:"0002275032-0001-0",COUNCIL_DISTRICT:11,LOCATION:"33.957, -118.4432",S:1},{B:"0002179615-0002-7",COUNCIL_DISTRICT:7,LOCATION:"34.307, -118.4695",S:1},{B:"0002254141-0001-7",COUNCIL_DISTRICT:6,LOCATION:"34.2023, -118.4859",S:1},{B:"0002253054-0001-9",COUNCIL_DISTRICT:2,LOCATION:"34.1787, -118.4399",S:1},{B:"0002257045-0001-9",COUNCIL_DISTRICT:15,LOCATION:"33.9018, -118.2858",S:1},{B:"0002255600-0001-6",COUNCIL_DISTRICT:2,LOCATION:"34.1721, -118.3823",S:1},{B:"0002256288-0001-6",COUNCIL_DISTRICT:14,LOCATION:"34.0336, -118.2644",S:1},{B:"0002256972-0001-2",COUNCIL_DISTRICT:3,LOCATION:"34.2164, -118.595",S:1},{B:"0002257519-0001-7",COUNCIL_DISTRICT:6,LOCATION:"34.226, -118.467",S:1},{B:"0002258885-0001-6",COUNCIL_DISTRICT:14,LOCATION:"0, 0",S:1},{B:"0002257223-0001-9",COUNCIL_DISTRICT:6,LOCATION:"34.2022, -118.4661",S:1},{B:"0002262794-0001-0",COUNCIL_DISTRICT:4,LOCATION:"34.1724, -118.4661",S:1},{B:"0002262211-0002-4",COUNCIL_DISTRICT:14,LOCATION:"34.0202, -118.2206",S:1},{B:"0002269618-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2177, -118.3898",S:1},{B:"0002260907-0001-2",COUNCIL_DISTRICT:11,LOCATION:"33.9452, -118.3725",S:1},{B:"0002270444-0001-9",COUNCIL_DISTRICT:6,LOCATION:"34.2343, -118.3732",S:1},{B:"0002270852-0001-6",COUNCIL_DISTRICT:10,LOCATION:"34.0561, -118.3449",S:1},{B:"0002273685-0001-6",COUNCIL_DISTRICT:2,LOCATION:"34.2017, -118.391",S:1},{B:"0002034460-0002-9",COUNCIL_DISTRICT:6,LOCATION:"34.2362, -118.4116",S:1},{B:"0002273482-0001-6",COUNCIL_DISTRICT:9,LOCATION:"33.978, -118.2612",S:1},{B:"0002274403-0001-9",COUNCIL_DISTRICT:3,LOCATION:"34.2314, -118.5838",S:1},{B:"0002274496-0001-5",COUNCIL_DISTRICT:5,LOCATION:"34.076, -118.3703",S:1},{B:"0002275038-0001-7",COUNCIL_DISTRICT:15,LOCATION:"33.7813, -118.2427",S:1},{B:"0002274920-0001-3",COUNCIL_DISTRICT:2,LOCATION:"34.1411, -118.3719",S:1},{B:"0002275041-0001-9",COUNCIL_DISTRICT:14,LOCATION:"34.0476, -118.2439",S:1},{B:"0002406834-0001-8",COUNCIL_DISTRICT:4,LOCATION:"34.1358, -118.3619",S:1},{B:"0002580753-0001-5",COUNCIL_DISTRICT:1,LOCATION:"34.1222, -118.2109",S:1},{B:"0002263119-0001-1",COUNCIL_DISTRICT:2,LOCATION:"34.1939, -118.3807",S:1},{B:"0002277718-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.1643, -118.6279",S:1},{B:"0002210774-0001-6",COUNCIL_DISTRICT:4,LOCATION:"34.1344, -118.3596",S:1},{B:"0002265879-0001-5",COUNCIL_DISTRICT:4,LOCATION:"34.1721, -118.4645",S:1},{B:"0002220313-0001-3",COUNCIL_DISTRICT:6,LOCATION:"0, 0",S:1},{B:"0002237919-0001-7",COUNCIL_DISTRICT:7,LOCATION:"34.2479, -118.2873",S:1},{B:"0002248188-0001-6",COUNCIL_DISTRICT:9,LOCATION:"33.9823, -118.2608",S:1},{B:"0002604287-0001-7",COUNCIL_DISTRICT:12,LOCATION:"34.2484, -118.5862",S:1},{B:"0002221186-0001-3",COUNCIL_DISTRICT:15,LOCATION:"33.8706, -118.2831",S:1},{B:"0002380246-0009-9",COUNCIL_DISTRICT:9,LOCATION:"34.0189, -118.2724",S:2},{B:"0002380246-0002-1",COUNCIL_DISTRICT:14,LOCATION:"0, 0",S:2},{B:"0002380246-0001-3",COUNCIL_DISTRICT:8,LOCATION:"34.0037, -118.3094",S:2},{B:"0002112222-0001-7",COUNCIL_DISTRICT:9,LOCATION:"34.0084, -118.2783",S:""},{B:"0002168000-0001-0",COUNCIL_DISTRICT:6,LOCATION:"34.2188, -118.4667",S:""},{B:"0002173946-0001-5",COUNCIL_DISTRICT:13,LOCATION:"34.0997, -118.3446",S:""},{B:"0002185259-0001-6",COUNCIL_DISTRICT:8,LOCATION:"33.9889, -118.3485",S:2},{B:"0002185207-0001-9",COUNCIL_DISTRICT:7,LOCATION:"34.2947, -118.4526",S:2},{B:"0002436130-0001-1",COUNCIL_DISTRICT:12,LOCATION:"34.2214, -118.4738",S:2},{B:"0002689415-0001-6",COUNCIL_DISTRICT:7,LOCATION:"34.2947, -118.4526",S:2},{B:"0002217119-0001-9",COUNCIL_DISTRICT:15,LOCATION:"33.8614, -118.2992",S:""},{B:"0002738349-0001-3",COUNCIL_DISTRICT:8,LOCATION:"33.9888, -118.3517",S:""},{B:"0002707587-0001-9",COUNCIL_DISTRICT:7,LOCATION:"34.2736, -118.4116",S:""},{B:"0002824374-0001-1",COUNCIL_DISTRICT:15,LOCATION:"33.736, -118.291",S:""},{B:"0002787059-0001-7",COUNCIL_DISTRICT:9,LOCATION:"34.0119, -118.2652",S:2},{B:"0002804368-0001-3",COUNCIL_DISTRICT:8,LOCATION:"33.9535, -118.309",S:2},{B:"0002326879-0001-2",COUNCIL_DISTRICT:11,LOCATION:"34.0025, -118.4359",S:2},{B:"0002095479-0002-9",COUNCIL_DISTRICT:14,LOCATION:"34.0738, -118.1635",S:2},{B:"0002843430-0001-2",COUNCIL_DISTRICT:7,LOCATION:"34.3005, -118.4618",S:2},{B:"0002255629-0001-4",COUNCIL_DISTRICT:7,LOCATION:"34.2953, -118.4127",S:2},{B:"0002257137-0001-2",COUNCIL_DISTRICT:2,LOCATION:"34.1405, -118.3855",S:2},{B:"0002229201-0002-6",COUNCIL_DISTRICT:5,LOCATION:"34.1552, -118.4753",S:2},{B:"0002203314-0002-5",COUNCIL_DISTRICT:4,LOCATION:"34.0832, -118.3099",S:2},{B:"0002730356-0001-5",COUNCIL_DISTRICT:4,LOCATION:"34.0885, -118.344",S:2},{B:"0002203314-0003-3",COUNCIL_DISTRICT:0,LOCATION:"33.9454, -118.3012",S:2},{B:"0002866069-0001-6",COUNCIL_DISTRICT:9,LOCATION:"34.0315, -118.2738",S:2},{B:"0002275044-0001-2",COUNCIL_DISTRICT:5,LOCATION:"34.0835, -118.3477",S:2},{B:"0002868317-0001-8",COUNCIL_DISTRICT:14,LOCATION:"34.0369, -118.2627",S:2},{B:"0000995653-0001-2",COUNCIL_DISTRICT:1,LOCATION:"",S:""},{B:"0000032121-0001-2",COUNCIL_DISTRICT:6,LOCATION:"34.201, -118.517",S:""},{B:"0002075443-0001-0",COUNCIL_DISTRICT:9,LOCATION:"33.9932, -118.2786",S:""},{B:"0002175460-0001-9",COUNCIL_DISTRICT:10,LOCATION:"34.0392, -118.3881",S:""},{B:"0002185255-0001-8",COUNCIL_DISTRICT:8,LOCATION:"33.9889, -118.3485",S:""},{B:"0002179615-0001-9",COUNCIL_DISTRICT:12,LOCATION:"",S:""},{B:"0002181088-0001-7",COUNCIL_DISTRICT:8,LOCATION:"33.9722, -118.3312",S:""},{B:"0002318022-0001-5",COUNCIL_DISTRICT:3,LOCATION:"34.1718, -118.5683",S:""},{B:"0002346679-0001-9",COUNCIL_DISTRICT:5,LOCATION:"34.057, -118.3836",S:""},{B:"0002359483-0001-7",COUNCIL_DISTRICT:2,LOCATION:"34.1732, -118.3615",S:""},{B:"0002367880-0001-8",COUNCIL_DISTRICT:7,LOCATION:"34.2525, -118.2949",S:""},{B:"0002378387-0001-2",COUNCIL_DISTRICT:7,LOCATION:"34.2501, -118.4052",S:""},{B:"0002380986-0001-5",COUNCIL_DISTRICT:4,LOCATION:"34.1503, -118.4218",S:""},{B:"0002392118-0001-4",COUNCIL_DISTRICT:13,LOCATION:"34.1, -118.3223",S:""},{B:"0002401583-0001-1",COUNCIL_DISTRICT:10,LOCATION:"34.0635, -118.3083",S:""},{B:"0002584603-0001-8",COUNCIL_DISTRICT:2,LOCATION:"34.1721, -118.4033",S:""},{B:"0002417543-0001-6",COUNCIL_DISTRICT:13,LOCATION:"34.0906, -118.2781",S:""},{B:"0002418224-0001-6",COUNCIL_DISTRICT:15,LOCATION:"33.7792, -118.2758",S:""},{B:"0002420077-0001-0",COUNCIL_DISTRICT:7,LOCATION:"34.3016, -118.4419",S:""},{B:"0002417875-0001-1",COUNCIL_DISTRICT:7,LOCATION:"34.2521, -118.2964",S:""},{B:"0002423726-0001-6",COUNCIL_DISTRICT:12,LOCATION:"34.2548, -118.606",S:""},{B:"0002424289-0001-8",COUNCIL_DISTRICT:2,LOCATION:"34.2011, -118.3862",S:""},{B:"0002427077-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2201, -118.3706",S:""},{B:"0002554812-0001-4",COUNCIL_DISTRICT:12,LOCATION:"34.2227, -118.4967",S:""},{B:"0002438593-0001-4",COUNCIL_DISTRICT:2,LOCATION:"34.1399, -118.3837",S:""},{B:"0002432704-0001-9",COUNCIL_DISTRICT:6,LOCATION:"34.2012, -118.4672",S:""},{B:"0002584537-0001-9",COUNCIL_DISTRICT:12,LOCATION:"34.2257, -118.536",S:""},{B:"0002437515-0001-7",COUNCIL_DISTRICT:13,LOCATION:"34.0866, -118.3091",S:""},{B:"0002437979-0001-0",COUNCIL_DISTRICT:6,LOCATION:"34.2157, -118.3965",S:""},{B:"0002438225-0001-3",COUNCIL_DISTRICT:4,LOCATION:"34.0973, -118.2755",S:""},{B:"0002447485-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2395, -118.3932",S:""},{B:"0002445423-0001-5",COUNCIL_DISTRICT:3,LOCATION:"34.2082, -118.6044",S:""},{B:"0002470508-0001-1",COUNCIL_DISTRICT:14,LOCATION:"34.039, -118.2645",S:""},{B:"0002449315-0001-1",COUNCIL_DISTRICT:14,LOCATION:"34.1435, -118.2255",S:""},{B:"0002450975-0002-1",COUNCIL_DISTRICT:1,LOCATION:"34.0757, -118.2176",S:""},{B:"0002224443-0002-0",COUNCIL_DISTRICT:15,LOCATION:"33.8583, -118.2955",S:""},{B:"0002480765-0001-2",COUNCIL_DISTRICT:2,LOCATION:"34.2012, -118.4102",S:""},{B:"0002494746-0001-5",COUNCIL_DISTRICT:14,LOCATION:"34.0505, -118.2406",S:""},{B:"0002605684-0001-3",COUNCIL_DISTRICT:2,LOCATION:"34.1649, -118.3674",S:""},{B:"0002780869-0001-5",COUNCIL_DISTRICT:11,LOCATION:"33.9554, -118.3962",S:""},{B:"0002780865-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0168, -118.21",S:""},{B:"0002555952-0001-4",COUNCIL_DISTRICT:10,LOCATION:"34.0058, -118.334",S:""},{B:"0002515971-0001-1",COUNCIL_DISTRICT:5,LOCATION:"34.0421, -118.4302",S:""},{B:"0002526486-0001-1",COUNCIL_DISTRICT:15,LOCATION:"33.7522, -118.3078",S:""},{B:"0002533639-0001-7",COUNCIL_DISTRICT:1,LOCATION:"34.0846, -118.2213",S:""},{B:"0002534171-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.1672, -118.5322",S:""},{B:"0002599882-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2216, -118.4338",S:""},{B:"0002544377-0001-1",COUNCIL_DISTRICT:4,LOCATION:"34.1793, -118.4582",S:""},{B:"0002554812-0002-2",COUNCIL_DISTRICT:6,LOCATION:"34.1852, -118.4487",S:""},{B:"0002785652-0001-0",COUNCIL_DISTRICT:6,LOCATION:"34.193, -118.4487",S:""},{B:"0002535486-0001-0",COUNCIL_DISTRICT:10,LOCATION:"34.0442, -118.309",S:""},{B:"0002536692-0001-9",COUNCIL_DISTRICT:2,LOCATION:"34.1649, -118.3724",S:""},{B:"0002812338-0001-4",COUNCIL_DISTRICT:7,LOCATION:"34.3007, -118.4612",S:""},{B:"0002604487-0001-3",COUNCIL_DISTRICT:8,LOCATION:"33.9676, -118.2871",S:""},{B:"0002797117-0001-8",COUNCIL_DISTRICT:9,LOCATION:"33.9956, -118.2915",S:""},{B:"0002537633-0001-9",COUNCIL_DISTRICT:2,LOCATION:"34.1984, -118.3943",S:""},{B:"0002778897-0001-9",COUNCIL_DISTRICT:10,LOCATION:"34.0508, -118.3112",S:""},{B:"0002541972-0001-6",COUNCIL_DISTRICT:5,LOCATION:"34.1544, -118.47",S:""},{B:"0002701799-0001-4",COUNCIL_DISTRICT:2,LOCATION:"34.1409, -118.3714",S:""},{B:"0002551107-0001-4",COUNCIL_DISTRICT:3,LOCATION:"34.1722, -118.566",S:""},{B:"0002554583-0001-0",COUNCIL_DISTRICT:2,LOCATION:"34.1409, -118.3714",S:""},{B:"0002579765-0001-7",COUNCIL_DISTRICT:13,LOCATION:"34.0795, -118.269",S:""},{B:"0002535283-0001-0",COUNCIL_DISTRICT:2,LOCATION:"34.1939, -118.3687",S:""},{B:"0002575292-0001-4",COUNCIL_DISTRICT:2,LOCATION:"34.1794, -118.3815",S:""},{B:"0002583498-0001-0",COUNCIL_DISTRICT:2,LOCATION:"34.1866, -118.4323",S:""},{B:"0002748003-0001-3",COUNCIL_DISTRICT:2,LOCATION:"34.2017, -118.4487",S:""},{B:"0002565523-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.1681, -118.5793",S:""},{B:"0002584453-0001-0",COUNCIL_DISTRICT:5,LOCATION:"34.1598, -118.501",S:""},{B:"0002584857-0001-1",COUNCIL_DISTRICT:5,LOCATION:"34.1562, -118.4828",S:""},{B:"0002584771-0001-2",COUNCIL_DISTRICT:5,LOCATION:"34.0835, -118.3498",S:""},{B:"0002583130-0001-7",COUNCIL_DISTRICT:5,LOCATION:"34.1617, -118.5157",S:""},{B:"0002584762-0001-3",COUNCIL_DISTRICT:6,LOCATION:"34.183, -118.4702",S:""},{B:"0002580810-0001-5",COUNCIL_DISTRICT:7,LOCATION:"34.2596, -118.3039",S:""},{B:"0002583990-0001-4",COUNCIL_DISTRICT:7,LOCATION:"34.3049, -118.4667",S:""},{B:"0002434598-0001-8",COUNCIL_DISTRICT:9,LOCATION:"33.9998, -118.2564",S:""},{B:"0002550381-0001-5",COUNCIL_DISTRICT:10,LOCATION:"34.0479, -118.3485",S:""},{B:"0002584755-0001-3",COUNCIL_DISTRICT:11,LOCATION:"33.986, -118.4009",S:""},{B:"0002641279-0001-6",COUNCIL_DISTRICT:11,LOCATION:"34.0025, -118.4359",S:""},{B:"0002583985-0001-3",COUNCIL_DISTRICT:12,LOCATION:"34.2238, -118.536",S:""},{B:"0002593426-0001-1",COUNCIL_DISTRICT:12,LOCATION:"34.2257, -118.536",S:""},{B:"0002585695-0001-7",COUNCIL_DISTRICT:13,LOCATION:"34.0917, -118.3094",S:""},{B:"0002583506-0001-6",COUNCIL_DISTRICT:14,LOCATION:"34.1375, -118.1891",S:""},{B:"0002591521-0001-2",COUNCIL_DISTRICT:15,LOCATION:"33.8314, -118.3073",S:""},{B:"0002564606-0001-9",COUNCIL_DISTRICT:12,LOCATION:"34.2356, -118.4907",S:""},{B:"0002603874-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.1681, -118.5793",S:""},{B:"0002584844-0001-3",COUNCIL_DISTRICT:4,LOCATION:"34.1731, -118.4661",S:""},{B:"0002565460-0001-4",COUNCIL_DISTRICT:2,LOCATION:"34.1576, -118.3973",S:""},{B:"0002194623-0002-8",COUNCIL_DISTRICT:3,LOCATION:"34.1727, -118.5569",S:""},{B:"0002585609-0001-2",COUNCIL_DISTRICT:14,LOCATION:"34.0375, -118.2459",S:""},{B:"0002593941-0001-7",COUNCIL_DISTRICT:10,LOCATION:"34.0414, -118.3527",S:""},{B:"0002568614-0001-2",COUNCIL_DISTRICT:6,LOCATION:"34.2012, -118.4821",S:""},{B:"0002513372-0001-2",COUNCIL_DISTRICT:4,LOCATION:"34.151, -118.4491",S:""},{B:"0002572669-0003-2",COUNCIL_DISTRICT:2,LOCATION:"34.1648, -118.4059",S:""},{B:"0002572669-0002-4",COUNCIL_DISTRICT:4,LOCATION:"34.098, -118.3588",S:""},{B:"0002572669-0004-1",COUNCIL_DISTRICT:5,LOCATION:"34.0247, -118.4116",S:""},{B:"0002572669-0005-9",COUNCIL_DISTRICT:15,LOCATION:"33.7444, -118.2797",S:""},{B:"0002537633-0002-7",COUNCIL_DISTRICT:11,LOCATION:"34.0111, -118.4392",S:""},{B:"0002690224-0001-0",COUNCIL_DISTRICT:1,LOCATION:"34.0714, -118.2506",S:""},{B:"0002577400-0001-3",COUNCIL_DISTRICT:5,LOCATION:"34.0246, -118.3962",S:""},{B:"0002624869-0001-1",COUNCIL_DISTRICT:7,LOCATION:"34.2597, -118.3185",S:""},{B:"0002553754-0004-7",COUNCIL_DISTRICT:5,LOCATION:"34.039, -118.4307",S:""},{B:"0002553754-0001-2",COUNCIL_DISTRICT:11,LOCATION:"33.9598, -118.3939",S:""},{B:"0002592482-0001-8",COUNCIL_DISTRICT:11,LOCATION:"33.9994, -118.4639",S:""},{B:"0002577238-0001-4",COUNCIL_DISTRICT:12,LOCATION:"34.2648, -118.5144",S:""},{B:"0002578743-0001-3",COUNCIL_DISTRICT:2,LOCATION:"34.18, -118.3703",S:""},{B:"0002708774-0001-5",COUNCIL_DISTRICT:5,LOCATION:"34.0546, -118.3831",S:""},{B:"0002580241-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.1647, -118.6271",S:""},{B:"0002577487-0001-4",COUNCIL_DISTRICT:3,LOCATION:"34.2015, -118.6002",S:""},{B:"0002583930-0001-2",COUNCIL_DISTRICT:3,LOCATION:"34.2074, -118.5535",S:""},{B:"0002580243-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.1647, -118.6271",S:""},{B:"0002583301-0001-7",COUNCIL_DISTRICT:7,LOCATION:"34.2551, -118.2985",S:""},{B:"0002584587-0001-7",COUNCIL_DISTRICT:13,LOCATION:"34.1029, -118.3296",S:""},{B:"0002580247-0001-9",COUNCIL_DISTRICT:6,LOCATION:"34.2012, -118.4672",S:""},{B:"0002582009-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2053, -118.3965",S:""},{B:"0002581059-0001-2",COUNCIL_DISTRICT:6,LOCATION:"34.2172, -118.4635",S:""},{B:"0002581087-0001-4",COUNCIL_DISTRICT:10,LOCATION:"34.0485, -118.3341",S:""},{B:"0002581834-0001-8",COUNCIL_DISTRICT:4,LOCATION:"34.1312, -118.3449",S:""},{B:"0002603879-0001-4",COUNCIL_DISTRICT:14,LOCATION:"34.0771, -118.1679",S:""},{B:"0002582889-0001-6",COUNCIL_DISTRICT:4,LOCATION:"34.1787, -118.3703",S:""},{B:"0002584590-0001-9",COUNCIL_DISTRICT:2,LOCATION:"34.2017, -118.4487",S:""},{B:"0002584038-0001-2",COUNCIL_DISTRICT:14,LOCATION:"34.0401, -118.2615",S:""},{B:"0002584580-0001-5",COUNCIL_DISTRICT:4,LOCATION:"34.1524, -118.4575",S:""},{B:"0002584563-0001-1",COUNCIL_DISTRICT:1,LOCATION:"34.0523, -118.2633",S:""},{B:"0002584588-0002-0",COUNCIL_DISTRICT:4,LOCATION:"34.0907, -118.3334",S:""},{B:"0002592092-0001-9",COUNCIL_DISTRICT:1,LOCATION:"34.1006, -118.2345",S:""},{B:"0002596067-0001-0",COUNCIL_DISTRICT:7,LOCATION:"34.2504, -118.4675",S:""},{B:"0002586650-0001-7",COUNCIL_DISTRICT:7,LOCATION:"34.2467, -118.2769",S:""},{B:"0002590035-0001-6",COUNCIL_DISTRICT:5,LOCATION:"34.0885, -118.3446",S:""},{B:"0002665338-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0569, -118.2107",S:""},{B:"0002589200-0001-8",COUNCIL_DISTRICT:7,LOCATION:"34.254, -118.2973",S:""},{B:"0002380246-0006-4",COUNCIL_DISTRICT:9,LOCATION:"33.9886, -118.2859",S:""},{B:"0002587812-0001-5",COUNCIL_DISTRICT:13,LOCATION:"34.0987, -118.3443",S:""},{B:"0002590287-0003-6",COUNCIL_DISTRICT:13,LOCATION:"34.1021, -118.3333",S:""},{B:"0002537633-0003-5",COUNCIL_DISTRICT:3,LOCATION:"34.1665, -118.6217",S:""},{B:"0002590933-0001-1",COUNCIL_DISTRICT:4,LOCATION:"34.1517, -118.4661",S:""},{B:"0002553754-0003-9",COUNCIL_DISTRICT:7,LOCATION:"34.3015, -118.4426",S:""},{B:"0002553754-0002-1",COUNCIL_DISTRICT:12,LOCATION:"34.2477, -118.6063",S:""},{B:"0002590933-0002-9",COUNCIL_DISTRICT:13,LOCATION:"34.0897, -118.2917",S:""},{B:"0002590933-0003-7",COUNCIL_DISTRICT:5,LOCATION:"34.1269, -118.4444",S:""},{B:"0002590933-0004-5",COUNCIL_DISTRICT:5,LOCATION:"34.0191, -118.4225",S:""},{B:"0002592117-0001-1",COUNCIL_DISTRICT:13,LOCATION:"34.0795, -118.269",S:""},{B:"0002592488-0001-5",COUNCIL_DISTRICT:2,LOCATION:"34.2012, -118.4142",S:""},{B:"0002592488-0002-3",COUNCIL_DISTRICT:3,LOCATION:"34.201, -118.6128",S:""},{B:"0002592488-0003-1",COUNCIL_DISTRICT:5,LOCATION:"34.0442, -118.4311",S:""},{B:"0002614765-0003-4",COUNCIL_DISTRICT:2,LOCATION:"34.2012, -118.4253",S:""},{B:"0002614765-0002-6",COUNCIL_DISTRICT:3,LOCATION:"34.1647, -118.6271",S:""},{B:"0002594197-0001-4",COUNCIL_DISTRICT:6,LOCATION:"34.2011, -118.4945",S:""},{B:"0002605812-0001-5",COUNCIL_DISTRICT:6,LOCATION:"34.185, -118.4661",S:""},{B:"0002730062-0001-6",COUNCIL_DISTRICT:7,LOCATION:"34.2529, -118.2956",S:""},{B:"0002614460-0001-1",COUNCIL_DISTRICT:9,LOCATION:"34.0038, -118.2721",S:""},{B:"0002614765-0001-8",COUNCIL_DISTRICT:14,LOCATION:"34.1413, -118.221",S:""},{B:"0002619351-0001-0",COUNCIL_DISTRICT:14,LOCATION:"34.0258, -118.2404",S:""},{B:"0002621342-0001-9",COUNCIL_DISTRICT:14,LOCATION:"34.036, -118.2634",S:""},{B:"0002595899-0001-8",COUNCIL_DISTRICT:2,LOCATION:"34.1721, -118.3826",S:""},{B:"0002592531-0001-3",COUNCIL_DISTRICT:4,LOCATION:"34.098, -118.353",S:""},{B:"0002601611-0001-5",COUNCIL_DISTRICT:13,LOCATION:"34.098, -118.3202",S:""},{B:"0002593873-0001-9",COUNCIL_DISTRICT:1,LOCATION:"34.1227, -118.2138",S:""},{B:"0002594446-0001-6",COUNCIL_DISTRICT:14,LOCATION:"34.0345, -118.2315",S:""},{B:"0002594897-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.229, -118.3664",S:""},{B:"0002595748-0001-7",COUNCIL_DISTRICT:6,LOCATION:"34.193, -118.4487",S:""},{B:"0002596817-0001-7",COUNCIL_DISTRICT:13,LOCATION:"34.1002, -118.3295",S:""},{B:"0002597316-0001-9",COUNCIL_DISTRICT:14,LOCATION:"34.048, -118.2506",S:""},{B:"0002599502-0001-8",COUNCIL_DISTRICT:3,LOCATION:"34.2011, -118.5788",S:""},{B:"0002590646-0001-3",COUNCIL_DISTRICT:11,LOCATION:"33.9994, -118.4639",S:""},{B:"0002597847-0001-5",COUNCIL_DISTRICT:13,LOCATION:"34.0998, -118.3228",S:""},{B:"0002597698-0001-1",COUNCIL_DISTRICT:10,LOCATION:"34.0498, -118.3602",S:""},{B:"0002606803-0001-3",COUNCIL_DISTRICT:10,LOCATION:"34.0478, -118.348",S:""},{B:"0002599975-0001-0",COUNCIL_DISTRICT:10,LOCATION:"34.0518, -118.3685",S:""},{B:"0002601503-0001-2",COUNCIL_DISTRICT:12,LOCATION:"34.2572, -118.5371",S:""},{B:"0002650298-0001-8",COUNCIL_DISTRICT:12,LOCATION:"34.2257, -118.536",S:""},{B:"0002708181-0001-6",COUNCIL_DISTRICT:8,LOCATION:"33.9888, -118.3517",S:""},{B:"0002613231-0001-1",COUNCIL_DISTRICT:13,LOCATION:"34.1001, -118.3243",S:""},{B:"0002603135-0001-4",COUNCIL_DISTRICT:13,LOCATION:"34.0907, -118.3074",S:""},{B:"0002595187-0001-8",COUNCIL_DISTRICT:14,LOCATION:"34.0378, -118.2596",S:""},{B:"0002613996-0001-2",COUNCIL_DISTRICT:4,LOCATION:"34.0976, -118.3674",S:""},{B:"0002608524-0001-5",COUNCIL_DISTRICT:2,LOCATION:"34.1555, -118.3702",S:""},{B:"0002608006-0001-6",COUNCIL_DISTRICT:15,LOCATION:"33.8189, -118.2995",S:""},{B:"0002611586-0001-1",COUNCIL_DISTRICT:13,LOCATION:"34.0835, -118.3029",S:""},{B:"0002607392-0001-8",COUNCIL_DISTRICT:13,LOCATION:"34.0759, -118.2873",S:""},{B:"0002609685-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0382, -118.2646",S:""},{B:"0002608719-0001-1",COUNCIL_DISTRICT:4,LOCATION:"34.1494, -118.4396",S:""},{B:"0002609305-0001-3",COUNCIL_DISTRICT:13,LOCATION:"34.0856, -118.2868",S:""},{B:"0002611398-0001-8",COUNCIL_DISTRICT:2,LOCATION:"34.142, -118.3946",S:""},{B:"0002618070-0001-1",COUNCIL_DISTRICT:13,LOCATION:"34.1052, -118.3164",S:""},{B:"0002623707-0001-4",COUNCIL_DISTRICT:3,LOCATION:"34.2186, -118.5885",S:""},{B:"0002613219-0001-0",COUNCIL_DISTRICT:5,LOCATION:"34.0413, -118.4295",S:""},{B:"0002612099-0001-5",COUNCIL_DISTRICT:15,LOCATION:"33.7744, -118.262",S:""},{B:"0002612686-0001-7",COUNCIL_DISTRICT:8,LOCATION:"33.9777, -118.3089",S:""},{B:"0002613762-0001-7",COUNCIL_DISTRICT:10,LOCATION:"34.0484, -118.3558",S:""},{B:"0002611257-0001-1",COUNCIL_DISTRICT:2,LOCATION:"34.202, -118.4487",S:""},{B:"0002609366-0001-0",COUNCIL_DISTRICT:3,LOCATION:"34.1672, -118.5322",S:""},{B:"0002614160-0001-6",COUNCIL_DISTRICT:15,LOCATION:"33.723, -118.313",S:""},{B:"0002170698-0002-4",COUNCIL_DISTRICT:14,LOCATION:"34.1213, -118.2058",S:""},{B:"0002614628-0001-9",COUNCIL_DISTRICT:6,LOCATION:"34.2012, -118.4824",S:""},{B:"0002665482-0001-6",COUNCIL_DISTRICT:15,LOCATION:"33.7309, -118.2923",S:""},{B:"0002615696-0001-2",COUNCIL_DISTRICT:6,LOCATION:"34.193, -118.4487",S:""},{B:"0002615420-0001-3",COUNCIL_DISTRICT:13,LOCATION:"34.0896, -118.3091",S:""},{B:"0002615865-0001-3",COUNCIL_DISTRICT:10,LOCATION:"34.0325, -118.334",S:""},{B:"0002616176-0001-1",COUNCIL_DISTRICT:1,LOCATION:"34.1235, -118.2178",S:""},{B:"0002597316-0003-5",COUNCIL_DISTRICT:1,LOCATION:"34.0472, -118.2886",S:""},{B:"0002621772-0001-2",COUNCIL_DISTRICT:14,LOCATION:"34.0441, -118.2516",S:""},{B:"0002621639-0001-1",COUNCIL_DISTRICT:1,LOCATION:"34.0472, -118.2861",S:""},{B:"0002621952-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2253, -118.4676",S:""},{B:"0002623844-0001-3",COUNCIL_DISTRICT:10,LOCATION:"34.0484, -118.3335",S:""},{B:"0002617083-0001-1",COUNCIL_DISTRICT:10,LOCATION:"34.0523, -118.3711",S:""},{B:"0002623346-0001-1",COUNCIL_DISTRICT:15,LOCATION:"33.736, -118.2884",S:""},{B:"0002619255-0001-0",COUNCIL_DISTRICT:15,LOCATION:"33.7792, -118.2758",S:""},{B:"0002615254-0002-4",COUNCIL_DISTRICT:15,LOCATION:"33.7404, -118.2923",S:""},{B:"0002615254-0001-6",COUNCIL_DISTRICT:15,LOCATION:"33.7342, -118.293",S:""},{B:"0002620230-0001-1",COUNCIL_DISTRICT:1,LOCATION:"34.0392, -118.2828",S:""},{B:"0002620079-0001-0",COUNCIL_DISTRICT:3,LOCATION:"34.1938, -118.5192",S:""},{B:"0002620781-0001-4",COUNCIL_DISTRICT:4,LOCATION:"34.1312, -118.3449",S:""},{B:"0002621441-0001-2",COUNCIL_DISTRICT:4,LOCATION:"34.1506, -118.4469",S:""},{B:"0002621391-0001-2",COUNCIL_DISTRICT:8,LOCATION:"33.9643, -118.3089",S:""},{B:"0002614081-0001-0",COUNCIL_DISTRICT:15,LOCATION:"33.779, -118.2649",S:""},{B:"0002621909-0001-5",COUNCIL_DISTRICT:2,LOCATION:"34.1648, -118.4042",S:""},{B:"0002622506-0001-6",COUNCIL_DISTRICT:2,LOCATION:"34.1726, -118.3793",S:""},{B:"0002622557-0001-9",COUNCIL_DISTRICT:0,LOCATION:"34.0154, -118.134",S:""},{B:"0002622800-0001-3",COUNCIL_DISTRICT:3,LOCATION:"34.1974, -118.5345",S:""},{B:"0002629184-0002-2",COUNCIL_DISTRICT:8,LOCATION:"34.0075, -118.3089",S:""},{B:"0002624260-0001-1",COUNCIL_DISTRICT:7,LOCATION:"34.3114, -118.429",S:""},{B:"0002626527-0001-7",COUNCIL_DISTRICT:6,LOCATION:"34.1939, -118.4902",S:""},{B:"0002628615-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0771, -118.1679",S:""},{B:"0002632768-0001-0",COUNCIL_DISTRICT:15,LOCATION:"33.791, -118.2465",S:""},{B:"0002631963-0001-6",COUNCIL_DISTRICT:9,LOCATION:"33.9936, -118.2871",S:""},{B:"0002630332-0001-4",COUNCIL_DISTRICT:1,LOCATION:"34.0472, -118.2959",S:""},{B:"0002656699-0001-9",COUNCIL_DISTRICT:2,LOCATION:"34.1866, -118.3752",S:""},{B:"0002631092-0001-9",COUNCIL_DISTRICT:15,LOCATION:"33.7792, -118.2758",S:""},{B:"0002646690-0001-1",COUNCIL_DISTRICT:13,LOCATION:"34.0835, -118.2946",S:""},{B:"0002646646-0001-1",COUNCIL_DISTRICT:14,LOCATION:"34.0375, -118.2593",S:""},{B:"0002250236-0003-1",COUNCIL_DISTRICT:4,LOCATION:"34.0835, -118.3166",S:""},{B:"0002682515-0001-3",COUNCIL_DISTRICT:6,LOCATION:"34.2089, -118.5098",S:""},{B:"0002640452-0001-6",COUNCIL_DISTRICT:13,LOCATION:"34.098, -118.3225",S:""},{B:"0002632770-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0771, -118.1679",S:""},{B:"0002634244-0001-8",COUNCIL_DISTRICT:2,LOCATION:"34.185, -118.3757",S:""},{B:"0002638255-0001-5",COUNCIL_DISTRICT:1,LOCATION:"34.0585, -118.239",S:""},{B:"0002690211-0001-2",COUNCIL_DISTRICT:10,LOCATION:"34.0388, -118.3882",S:""},{B:"0002641702-0001-0",COUNCIL_DISTRICT:10,LOCATION:"34.0498, -118.36",S:""},{B:"0002641633-0001-7",COUNCIL_DISTRICT:12,LOCATION:"34.2229, -118.5393",S:""},{B:"0002647877-0001-0",COUNCIL_DISTRICT:7,LOCATION:"34.2938, -118.4617",S:""},{B:"0002645492-0001-7",COUNCIL_DISTRICT:15,LOCATION:"33.7284, -118.2923",S:""},{B:"0002646714-0001-9",COUNCIL_DISTRICT:6,LOCATION:"34.1939, -118.4902",S:""},{B:"0002648427-0001-6",COUNCIL_DISTRICT:8,LOCATION:"34.0255, -118.2985",S:""},{B:"0002649708-0001-5",COUNCIL_DISTRICT:13,LOCATION:"34.0866, -118.3091",S:""},{B:"0002649973-0001-4",COUNCIL_DISTRICT:9,LOCATION:"33.9986, -118.2826",S:""},{B:"0002650724-0001-5",COUNCIL_DISTRICT:14,LOCATION:"34.0277, -118.2504",S:""},{B:"0002690217-0001-0",COUNCIL_DISTRICT:4,LOCATION:"34.1323, -118.3537",S:""},{B:"0002843577-0001-7",COUNCIL_DISTRICT:10,LOCATION:"34.048, -118.3435",S:""},{B:"0002650847-0001-4",COUNCIL_DISTRICT:14,LOCATION:"34.0385, -118.2553",S:""},{B:"0002651189-0001-8",COUNCIL_DISTRICT:7,LOCATION:"34.2525, -118.2949",S:""},{B:"0002651651-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2012, -118.4824",S:""},{B:"0002655749-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2011, -118.4494",S:""},{B:"0002813565-0001-5",COUNCIL_DISTRICT:15,LOCATION:"33.7395, -118.2923",S:""},{B:"0002654330-0001-7",COUNCIL_DISTRICT:8,LOCATION:"33.9597, -118.2782",S:""},{B:"0002655278-0001-7",COUNCIL_DISTRICT:13,LOCATION:"34.0799, -118.3091",S:""},{B:"0002655364-0001-3",COUNCIL_DISTRICT:13,LOCATION:"34.0667, -118.2704",S:""},{B:"0002655735-0001-0",COUNCIL_DISTRICT:8,LOCATION:"33.9789, -118.3308",S:""},{B:"0002659210-0001-8",COUNCIL_DISTRICT:2,LOCATION:"34.2084, -118.378",S:""},{B:"0002661336-0001-9",COUNCIL_DISTRICT:0,LOCATION:"33.9839, -118.4587",S:""},{B:"0002657480-0001-5",COUNCIL_DISTRICT:13,LOCATION:"34.0804, -118.2702",S:""},{B:"0002658051-0001-3",COUNCIL_DISTRICT:15,LOCATION:"33.7387, -118.2879",S:""},{B:"0002655749-0002-0",COUNCIL_DISTRICT:2,LOCATION:"34.1866, -118.3946",S:""},{B:"0002672414-0001-4",COUNCIL_DISTRICT:8,LOCATION:"33.9562, -118.309",S:""},{B:"0002661365-0001-5",COUNCIL_DISTRICT:4,LOCATION:"34.1503, -118.4299",S:""},{B:"0002663489-0001-3",COUNCIL_DISTRICT:8,LOCATION:"33.9934, -118.3089",S:""},{B:"0002664638-0001-4",COUNCIL_DISTRICT:14,LOCATION:"",S:""},{B:"0002666224-0001-4",COUNCIL_DISTRICT:3,LOCATION:"34.2018, -118.5954",S:""},{B:"0002659691-0001-4",COUNCIL_DISTRICT:10,LOCATION:"34.069, -118.3011",S:""},{B:"0002667609-0001-0",COUNCIL_DISTRICT:13,LOCATION:"34.1017, -118.3126",S:""},{B:"0002667301-0001-9",COUNCIL_DISTRICT:13,LOCATION:"34.1017, -118.3126",S:""},{B:"0002671908-0001-2",COUNCIL_DISTRICT:6,LOCATION:"34.1926, -118.4487",S:""},{B:"0002671011-0001-1",COUNCIL_DISTRICT:8,LOCATION:"33.9745, -118.3011",S:""},{B:"0002671150-0001-9",COUNCIL_DISTRICT:10,LOCATION:"34.0045, -118.333",S:""},{B:"0002671147-0001-7",COUNCIL_DISTRICT:11,LOCATION:"33.9618, -118.4208",S:""},{B:"0002671710-0001-3",COUNCIL_DISTRICT:6,LOCATION:"34.1911, -118.4487",S:""},{B:"0002588344-0002-0",COUNCIL_DISTRICT:8,LOCATION:"33.9611, -118.2827",S:""},{B:"0002674968-0001-6",COUNCIL_DISTRICT:6,LOCATION:"34.2282, -118.4657",S:""},{B:"0002675135-0001-3",COUNCIL_DISTRICT:15,LOCATION:"33.7908, -118.269",S:""},{B:"0002672771-0001-7",COUNCIL_DISTRICT:1,LOCATION:"34.0501, -118.2808",S:""},{B:"0002677151-0001-7",COUNCIL_DISTRICT:13,LOCATION:"34.097, -118.2872",S:""},{B:"0002677463-0001-4",COUNCIL_DISTRICT:14,LOCATION:"34.036, -118.2634",S:""},{B:"0002654238-0002-3",COUNCIL_DISTRICT:6,LOCATION:"34.2282, -118.4346",S:""},{B:"0002706032-0001-0",COUNCIL_DISTRICT:2,LOCATION:"34.1866, -118.3946",S:""},{B:"0002678594-0001-5",COUNCIL_DISTRICT:4,LOCATION:"34.1522, -118.3636",S:""},{B:"0002682385-0001-2",COUNCIL_DISTRICT:8,LOCATION:"33.9891, -118.3129",S:""},{B:"0002680777-0001-6",COUNCIL_DISTRICT:11,LOCATION:"33.9883, -118.4546",S:""},{B:"0002681817-0001-0",COUNCIL_DISTRICT:2,LOCATION:"34.1405, -118.3855",S:""},{B:"0002682108-0001-1",COUNCIL_DISTRICT:1,LOCATION:"34.0472, -118.2911",S:""},{B:"0002682307-0001-2",COUNCIL_DISTRICT:14,LOCATION:"34.0172, -118.2199",S:""},{B:"0002682422-0001-5",COUNCIL_DISTRICT:10,LOCATION:"34.069, -118.298",S:""},{B:"0002682999-0001-3",COUNCIL_DISTRICT:3,LOCATION:"34.2077, -118.571",S:""},{B:"0002683754-0001-7",COUNCIL_DISTRICT:3,LOCATION:"",S:""},{B:"0002680987-0001-6",COUNCIL_DISTRICT:6,LOCATION:"",S:""},{B:"0002685308-0001-9",COUNCIL_DISTRICT:10,LOCATION:"34.0428, -118.3643",S:""},{B:"0002687754-0001-6",COUNCIL_DISTRICT:8,LOCATION:"33.957, -118.2827",S:""},{B:"0002690939-0001-3",COUNCIL_DISTRICT:3,LOCATION:"34.2018, -118.5954",S:""},{B:"0002691964-0001-9",COUNCIL_DISTRICT:9,LOCATION:"34.0039, -118.2408",S:""},{B:"0002692226-0001-3",COUNCIL_DISTRICT:13,LOCATION:"34.1049, -118.2582",S:""},{B:"0002698545-0001-4",COUNCIL_DISTRICT:6,LOCATION:"34.2228, -118.3877",S:""},{B:"0002694544-0001-1",COUNCIL_DISTRICT:1,LOCATION:"34.0501, -118.2808",S:""},{B:"0002694533-0001-2",COUNCIL_DISTRICT:3,LOCATION:"34.1682, -118.6008",S:""},{B:"0002690946-0001-3",COUNCIL_DISTRICT:5,LOCATION:"34.0564, -118.4424",S:""},{B:"0002694536-0001-6",COUNCIL_DISTRICT:14,LOCATION:"34.0365, -118.2642",S:""},{B:"0002698742-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0465, -118.259",S:""},{B:"0002698740-0001-8",COUNCIL_DISTRICT:0,LOCATION:"34.0155, -118.1344",S:""},{B:"0002678416-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0248, -118.2392",S:""},{B:"0002700654-0001-1",COUNCIL_DISTRICT:1,LOCATION:"34.0736, -118.2161",S:""},{B:"0002699893-0002-3",COUNCIL_DISTRICT:15,LOCATION:"33.736, -118.2884",S:""},{B:"0002700316-0001-1",COUNCIL_DISTRICT:2,LOCATION:"34.18, -118.3703",S:""},{B:"0002701666-0001-1",COUNCIL_DISTRICT:15,LOCATION:"",S:""},{B:"0002700505-0001-0",COUNCIL_DISTRICT:1,LOCATION:"34.066, -118.2083",S:""},{B:"0002700681-0001-9",COUNCIL_DISTRICT:4,LOCATION:"34.1793, -118.4424",S:""},{B:"0002704308-0001-6",COUNCIL_DISTRICT:1,LOCATION:"34.043, -118.2823",S:""},{B:"0002703323-0001-3",COUNCIL_DISTRICT:1,LOCATION:"34.063, -118.2358",S:""},{B:"0002704338-0001-7",COUNCIL_DISTRICT:2,LOCATION:"34.1576, -118.3973",S:""},{B:"0002704046-0001-7",COUNCIL_DISTRICT:3,LOCATION:"34.1971, -118.536",S:""},{B:"0002705954-0001-2",COUNCIL_DISTRICT:4,LOCATION:"34.1793, -118.4583",S:""},{B:"0002706775-0001-5",COUNCIL_DISTRICT:4,LOCATION:"34.1721, -118.4391",S:""},{B:"0002704762-0001-3",COUNCIL_DISTRICT:6,LOCATION:"34.2442, -118.3869",S:""},{B:"0002705834-0001-7",COUNCIL_DISTRICT:6,LOCATION:"34.201, -118.517",S:""},{B:"0002620522-0001-1",COUNCIL_DISTRICT:8,LOCATION:"33.9745, -118.3119",S:""},{B:"0002706821-0001-7",COUNCIL_DISTRICT:15,LOCATION:"33.8314, -118.3067",S:""},{B:"0002706263-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.2074, -118.5535",S:""},{B:"0002706250-0001-4",COUNCIL_DISTRICT:7,LOCATION:"34.2596, -118.3113",S:""},{B:"0002708399-0001-2",COUNCIL_DISTRICT:1,LOCATION:"34.1103, -118.1912",S:""},{B:"0002707893-0001-9",COUNCIL_DISTRICT:6,LOCATION:"34.2216, -118.4278",S:""},{B:"0002708703-0001-5",COUNCIL_DISTRICT:2,LOCATION:"34.2033, -118.4487",S:""},{B:"0002709822-0001-3",COUNCIL_DISTRICT:4,LOCATION:"34.1002, -118.2902",S:""},{B:"0002751800-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.1724, -118.5466",S:""},{B:"0002715126-0001-1",COUNCIL_DISTRICT:9,LOCATION:"34.0001, -118.2783",S:""},{B:"0002713899-0001-3",COUNCIL_DISTRICT:4,LOCATION:"34.1721, -118.4301",S:""},{B:"0002715357-0001-3",COUNCIL_DISTRICT:10,LOCATION:"34.0479, -118.3487",S:""},{B:"0002718595-0001-7",COUNCIL_DISTRICT:3,LOCATION:"34.172, -118.6041",S:""},{B:"0002720591-0001-7",COUNCIL_DISTRICT:8,LOCATION:"33.9745, -118.2964",S:""},{B:"0002721023-0001-7",COUNCIL_DISTRICT:3,LOCATION:"34.1682, -118.6008",S:""},{B:"0002257092-0001-3",COUNCIL_DISTRICT:4,LOCATION:"34.1573, -118.4057",S:""},{B:"0002780117-0001-1",COUNCIL_DISTRICT:8,LOCATION:"33.9789, -118.3089",S:""},{B:"0002742011-0001-4",COUNCIL_DISTRICT:13,LOCATION:"34.0907, -118.3228",S:""},{B:"0002723788-0001-3",COUNCIL_DISTRICT:3,LOCATION:"34.1682, -118.6008",S:""},{B:"0002723854-0001-2",COUNCIL_DISTRICT:14,LOCATION:"34.0335, -118.2625",S:""},{B:"0002724186-0001-2",COUNCIL_DISTRICT:0,LOCATION:"33.9454, -118.317",S:""},{B:"0002727622-0001-5",COUNCIL_DISTRICT:2,LOCATION:"34.1939, -118.3869",S:""},{B:"0002748298-0001-5",COUNCIL_DISTRICT:7,LOCATION:"34.3016, -118.442",S:""},{B:"0002726472-0001-0",COUNCIL_DISTRICT:8,LOCATION:"34.0084, -118.3023",S:""},{B:"0002744951-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0417, -118.2585",S:""},{B:"0002726440-0001-0",COUNCIL_DISTRICT:10,LOCATION:"34.0398, -118.3422",S:""},{B:"0002722786-0001-7",COUNCIL_DISTRICT:5,LOCATION:"34.0243, -118.4112",S:""},{B:"0002720299-0001-9",COUNCIL_DISTRICT:10,LOCATION:"34.0232, -118.3383",S:""},{B:"0002728528-0001-1",COUNCIL_DISTRICT:1,LOCATION:"34.0736, -118.2161",S:""},{B:"0002730739-0001-4",COUNCIL_DISTRICT:3,LOCATION:"34.2197, -118.6004",S:""},{B:"0002731111-0001-9",COUNCIL_DISTRICT:2,LOCATION:"34.2052, -118.3877",S:""},{B:"0002736799-0001-0",COUNCIL_DISTRICT:8,LOCATION:"33.9535, -118.309",S:""},{B:"0002791859-0001-5",COUNCIL_DISTRICT:0,LOCATION:"34.0175, -118.1438",S:""},{B:"0002735248-0001-9",COUNCIL_DISTRICT:1,LOCATION:"34.0953, -118.2281",S:""},{B:"0002736922-0001-9",COUNCIL_DISTRICT:3,LOCATION:"34.1999, -118.5977",S:""},{B:"0002737127-0001-3",COUNCIL_DISTRICT:14,LOCATION:"34.0314, -118.1985",S:""},{B:"0002737922-0001-6",COUNCIL_DISTRICT:2,LOCATION:"34.1794, -118.3958",S:""},{B:"0002739627-0001-9",COUNCIL_DISTRICT:4,LOCATION:"34.0622, -118.3479",S:""},{B:"0002743543-0001-2",COUNCIL_DISTRICT:6,LOCATION:"34.2306, -118.4023",S:""},{B:"0002744392-0001-7",COUNCIL_DISTRICT:3,LOCATION:"34.1694, -118.5376",S:""},{B:"0002742664-0001-5",COUNCIL_DISTRICT:4,LOCATION:"34.1793, -118.4424",S:""},{B:"0002739347-0001-1",COUNCIL_DISTRICT:8,LOCATION:"34.0173, -118.3088",S:""},{B:"0002744602-0001-9",COUNCIL_DISTRICT:1,LOCATION:"34.0513, -118.279",S:""},{B:"0002745344-0001-5",COUNCIL_DISTRICT:2,LOCATION:"34.1911, -118.3877",S:""},{B:"0002745345-0001-0",COUNCIL_DISTRICT:6,LOCATION:"34.2216, -118.4278",S:""},{B:"0002744259-0001-6",COUNCIL_DISTRICT:9,LOCATION:"33.9817, -118.2782",S:""},{B:"0002745150-0001-4",COUNCIL_DISTRICT:14,LOCATION:"34.0365, -118.2642",S:""},{B:"0002745466-0001-0",COUNCIL_DISTRICT:10,LOCATION:"34.0058, -118.334",S:""},{B:"0002739347-0002-0",COUNCIL_DISTRICT:8,LOCATION:"34.0174, -118.3088",S:""},{B:"0002743003-0001-7",COUNCIL_DISTRICT:8,LOCATION:"33.9904, -118.3089",S:""},{B:"0002758100-0001-4",COUNCIL_DISTRICT:8,LOCATION:"33.9745, -118.3246",S:""},{B:"0002757865-0001-9",COUNCIL_DISTRICT:12,LOCATION:"34.2257, -118.536",S:""},{B:"0002380246-0010-2",COUNCIL_DISTRICT:10,LOCATION:"34.0635, -118.3097",S:""},{B:"0002760747-0001-8",COUNCIL_DISTRICT:2,LOCATION:"34.1649, -118.3662",S:""},{B:"0002761008-0001-8",COUNCIL_DISTRICT:8,LOCATION:"33.9621, -118.2918",S:""},{B:"0002765586-0001-8",COUNCIL_DISTRICT:14,LOCATION:"34.0375, -118.2593",S:""},{B:"0002765356-0001-1",COUNCIL_DISTRICT:15,LOCATION:"33.7404, -118.2923",S:""},{B:"0002766233-0001-9",COUNCIL_DISTRICT:15,LOCATION:"33.7777, -118.2622",S:""},{B:"0002767011-0001-3",COUNCIL_DISTRICT:1,LOCATION:"34.0501, -118.2808",S:""},{B:"0002766420-0001-8",COUNCIL_DISTRICT:2,LOCATION:"34.1866, -118.3861",S:""},{B:"0002782405-0001-7",COUNCIL_DISTRICT:9,LOCATION:"34.0039, -118.2408",S:""},{B:"0002767628-0001-8",COUNCIL_DISTRICT:10,LOCATION:"34.0107, -118.3215",S:""},{B:"0002777184-0001-7",COUNCIL_DISTRICT:8,LOCATION:"33.9739, -118.3089",S:""},{B:"0002775134-0001-4",COUNCIL_DISTRICT:8,LOCATION:"33.9535, -118.309",S:""},{B:"0002776235-0001-4",COUNCIL_DISTRICT:9,LOCATION:"33.9866, -118.3002",S:""},{B:"0002776624-0001-9",COUNCIL_DISTRICT:9,LOCATION:"33.9936, -118.2871",S:""},{B:"0002780625-0001-6",COUNCIL_DISTRICT:12,LOCATION:"34.2382, -118.5362",S:""},{B:"0002777839-0001-9",COUNCIL_DISTRICT:13,LOCATION:"34.1196, -118.2592",S:""},{B:"0002780441-0001-9",COUNCIL_DISTRICT:11,LOCATION:"33.9581, -118.3961",S:""},{B:"0002778937-0001-5",COUNCIL_DISTRICT:3,LOCATION:"34.1727, -118.5602",S:""},{B:"0002779092-0001-8",COUNCIL_DISTRICT:0,LOCATION:"34.1633, -118.2792",S:""},{B:"0002777340-0001-1",COUNCIL_DISTRICT:8,LOCATION:"33.9746, -118.2882",S:""},{B:"0002779042-0001-0",COUNCIL_DISTRICT:8,LOCATION:"33.9676, -118.3089",S:""},{B:"0002780278-0001-5",COUNCIL_DISTRICT:0,LOCATION:"33.9813, -118.2302",S:""},{B:"0002780343-0001-0",COUNCIL_DISTRICT:6,LOCATION:"34.2319, -118.4378",S:""},{B:"0002778633-0001-2",COUNCIL_DISTRICT:9,LOCATION:"33.9841, -118.2782",S:""},{B:"0002781692-0001-5",COUNCIL_DISTRICT:9,LOCATION:"34.0097, -118.2565",S:""},{B:"0002784378-0001-2",COUNCIL_DISTRICT:8,LOCATION:"33.9697, -118.3089",S:""},{B:"0002783531-0001-5",COUNCIL_DISTRICT:15,LOCATION:"33.7432, -118.2878",S:""},{B:"0002787044-0001-1",COUNCIL_DISTRICT:15,LOCATION:"33.7773, -118.2622",S:""},{B:"0002790940-0001-1",COUNCIL_DISTRICT:9,LOCATION:"34.0249, -118.2592",S:""},{B:"0002788648-0001-5",COUNCIL_DISTRICT:0,LOCATION:"34.5248, -118.0982",S:""},{B:"0002789925-0001-6",COUNCIL_DISTRICT:14,LOCATION:"34.0318, -118.2653",S:""},{B:"0002792510-0001-2",COUNCIL_DISTRICT:2,LOCATION:"34.2012, -118.4142",S:""},{B:"0002792270-0001-0",COUNCIL_DISTRICT:14,LOCATION:"34.0471, -118.2659",S:""},{B:"0002794167-0001-4",COUNCIL_DISTRICT:1,LOCATION:"34.0602, -118.2744",S:""},{B:"0002795046-0001-1",COUNCIL_DISTRICT:2,LOCATION:"34.2184, -118.368",S:""},{B:"0002799833-0001-9",COUNCIL_DISTRICT:2,LOCATION:"34.1405, -118.3705",S:""},{B:"0002802670-0001-1",COUNCIL_DISTRICT:3,LOCATION:"34.1937, -118.589",S:""},{B:"0002802672-0001-0",COUNCIL_DISTRICT:8,LOCATION:"34.0102, -118.3351",S:""},{B:"0002823131-0001-0",COUNCIL_DISTRICT:10,LOCATION:"34.0664, -118.2979",S:""},{B:"0002796880-0001-1",COUNCIL_DISTRICT:11,LOCATION:"33.9879, -118.471",S:""},{B:"0002799329-0001-1",COUNCIL_DISTRICT:0,LOCATION:"0, 0",S:""},{B:"0002798695-0001-6",COUNCIL_DISTRICT:7,LOCATION:"34.2596, -118.3117",S:""},{B:"0002801804-0001-2",COUNCIL_DISTRICT:12,LOCATION:"34.2572, -118.5895",S:""},{B:"0002834142-0001-1",COUNCIL_DISTRICT:4,LOCATION:"34.1518, -118.467",S:""},{B:"0002796840-0001-7",COUNCIL_DISTRICT:2,LOCATION:"34.2093, -118.3637",S:""},{B:"0002796784-0001-1",COUNCIL_DISTRICT:4,LOCATION:"34.1549, -118.4486",S:""},{B:"0002796853-0001-4",COUNCIL_DISTRICT:8,LOCATION:"33.9745, -118.2991",S:""},{B:"0002796672-0001-1",COUNCIL_DISTRICT:9,LOCATION:"33.9878, -118.3001",S:""},{B:"0002797013-0001-1",COUNCIL_DISTRICT:14,LOCATION:"34.0262, -118.2196",S:""},{B:"0002805422-0001-7",COUNCIL_DISTRICT:9,LOCATION:"34.0092, -118.2793",S:""},{B:"0002804437-0001-6",COUNCIL_DISTRICT:2,LOCATION:"34.2012, -118.4273",S:""},{B:"0002815166-0001-1",COUNCIL_DISTRICT:1,LOCATION:"34.0763, -118.2163",S:""},{B:"0002627252-0002-6",COUNCIL_DISTRICT:9,LOCATION:"33.9865, -118.3002",S:""},{B:"0002804748-0001-9",COUNCIL_DISTRICT:9,LOCATION:"33.9855, -118.2783",S:""},{B:"0002805129-0001-4",COUNCIL_DISTRICT:8,LOCATION:"34.0028, -118.3314",S:""},{B:"0002805125-0001-6",COUNCIL_DISTRICT:10,LOCATION:"34.0399, -118.3023",S:""},{B:"0002806769-0001-5",COUNCIL_DISTRICT:6,LOCATION:"34.1876, -118.4474",S:""},{B:"0002380246-0013-7",COUNCIL_DISTRICT:8,LOCATION:"33.9745, -118.2991",S:""},{B:"0002818736-0001-1",COUNCIL_DISTRICT:13,LOCATION:"34.1027, -118.3417",S:""},{B:"0002808156-0001-3",COUNCIL_DISTRICT:8,LOCATION:"34.0046, -118.3122",S:""},{B:"0002809698-0001-5",COUNCIL_DISTRICT:4,LOCATION:"34.098, -118.3649",S:""},{B:"0002380246-0014-5",COUNCIL_DISTRICT:10,LOCATION:"34.0586, -118.309",S:""},{B:"0002812209-0001-0",COUNCIL_DISTRICT:8,LOCATION:"34.0314, -118.3089",S:""},{B:"0002843425-0001-1",COUNCIL_DISTRICT:6,LOCATION:"34.2216, -118.4338",S:""},{B:"0002817794-0001-7",COUNCIL_DISTRICT:0,LOCATION:"0, 0",S:""},{B:"0002818418-0001-9",COUNCIL_DISTRICT:8,LOCATION:"33.9599, -118.3026",S:""},{B:"0002819847-0001-5",COUNCIL_DISTRICT:9,LOCATION:"33.9745, -118.2782",S:""},{B:"0002821510-0001-6",COUNCIL_DISTRICT:13,LOCATION:"34.1483, -118.2757",S:""},{B:"0002830315-0001-1",COUNCIL_DISTRICT:14,LOCATION:"34.0453, -118.2464",S:""},{B:"0002823765-0001-8",COUNCIL_DISTRICT:0,LOCATION:"33.9565, -118.3002",S:""},{B:"0002380246-0015-3",COUNCIL_DISTRICT:8,LOCATION:"33.9299, -118.2915",S:""},{B:"0002825334-0001-4",COUNCIL_DISTRICT:14,LOCATION:"34.0498, -118.2533",S:""},{B:"0002827965-0001-3",COUNCIL_DISTRICT:8,LOCATION:"33.9754, -118.3308",S:""},{B:"0002827335-0001-3",COUNCIL_DISTRICT:8,LOCATION:"33.9643, -118.3089",S:""},{B:"0002380246-0016-1",COUNCIL_DISTRICT:9,LOCATION:"33.9872, -118.3001",S:""},{B:"0002827461-0001-4",COUNCIL_DISTRICT:15,LOCATION:"33.7832, -118.2627",S:""},{B:"0002828432-0001-5",COUNCIL_DISTRICT:0,LOCATION:"34.1563, -118.7993",S:""},{B:"0002799012-0002-0",COUNCIL_DISTRICT:1,LOCATION:"34.0424, -118.2811",S:""},{B:"0002852420-0001-8",COUNCIL_DISTRICT:3,LOCATION:"34.1725, -118.5624",S:""},{B:"0002870920-0001-7",COUNCIL_DISTRICT:5,LOCATION:"34.0836, -118.3523",S:""},{B:"0002832555-0001-7",COUNCIL_DISTRICT:2,LOCATION:"34.1923, -118.3845",S:""},{B:"0002835314-0001-3",COUNCIL_DISTRICT:3,LOCATION:"34.1937, -118.589",S:""},{B:"0002832609-0001-5",COUNCIL_DISTRICT:10,LOCATION:"34.0398, -118.331",S:""},{B:"0002833338-0001-4",COUNCIL_DISTRICT:2,LOCATION:"34.1866, -118.3861",S:""},{B:"0002837822-0001-3",COUNCIL_DISTRICT:9,LOCATION:"34.0275, -118.2701",S:""},{B:"0002835199-0001-9",COUNCIL_DISTRICT:10,LOCATION:"34.0417, -118.309",S:""},{B:"0002856152-0001-2",COUNCIL_DISTRICT:0,LOCATION:"33.9555, -118.3094",S:""},{B:"0002838602-0001-7",COUNCIL_DISTRICT:10,LOCATION:"34.0657, -118.3095",S:""},{B:"0002855747-0001-3",COUNCIL_DISTRICT:15,LOCATION:"33.8819, -118.2905",S:""},{B:"0002856080-0001-6",COUNCIL_DISTRICT:2,LOCATION:"34.1654, -118.3931",S:""},{B:"0002839066-0001-5",COUNCIL_DISTRICT:8,LOCATION:"0, 0",S:""},{B:"0002856362-0001-2",COUNCIL_DISTRICT:8,LOCATION:"33.9749, -118.3063",S:""},{B:"0002835197-0001-0",COUNCIL_DISTRICT:10,LOCATION:"34.0065, -118.3345",S:""},{B:"0002838312-0001-6",COUNCIL_DISTRICT:10,LOCATION:"34.0543, -118.2919",S:""},{B:"0002837773-0001-8",COUNCIL_DISTRICT:15,LOCATION:"33.7313, -118.2922",S:""},{B:"0002835725-0001-4",COUNCIL_DISTRICT:6,LOCATION:"34.201, -118.5016",S:""},{B:"0002836992-0001-0",COUNCIL_DISTRICT:13,LOCATION:"34.0849, -118.3157",S:""},{B:"0002837443-0001-2",COUNCIL_DISTRICT:2,LOCATION:"34.2012, -118.4189",S:""},{B:"0002837595-0001-8",COUNCIL_DISTRICT:12,LOCATION:"34.2647, -118.504",S:""},{B:"0002839048-0001-7",COUNCIL_DISTRICT:9,LOCATION:"33.9866, -118.3002",S:""},{B:"0002860702-0001-6",COUNCIL_DISTRICT:6,LOCATION:"34.1851, -118.4492",S:""},{B:"0002859861-0001-1",COUNCIL_DISTRICT:8,LOCATION:"33.9528, -118.2781",S:""},{B:"0002839800-0001-1",COUNCIL_DISTRICT:11,LOCATION:"34.0537, -118.4654",S:""},{B:"0002839858-0001-6",COUNCIL_DISTRICT:6,LOCATION:"34.2084, -118.508",S:""},{B:"0002860458-0001-7",COUNCIL_DISTRICT:15,LOCATION:"33.7791, -118.2768",S:""},{B:"0002843793-0001-2",COUNCIL_DISTRICT:2,LOCATION:"34.1398, -118.3791",S:""},{B:"0002844515-0001-3",COUNCIL_DISTRICT:7,LOCATION:"34.2599, -118.3085",S:""},{B:"0002846640-0001-4",COUNCIL_DISTRICT:9,LOCATION:"33.9855, -118.2783",S:""},{B:"0002845333-0001-2",COUNCIL_DISTRICT:0,LOCATION:"34.0264, -118.1439",S:""},{B:"0002845331-0001-3",COUNCIL_DISTRICT:0,LOCATION:"34.0175, -118.1436",S:""},{B:"0002846254-0001-3",COUNCIL_DISTRICT:14,LOCATION:"34.046, -118.2525",S:""},{B:"0002850793-0001-7",COUNCIL_DISTRICT:2,LOCATION:"34.2058, -118.3877",S:""},{B:"0002846211-0001-5",COUNCIL_DISTRICT:13,LOCATION:"34.114, -118.2555",S:""},{B:"0002854012-0001-5",COUNCIL_DISTRICT:15,LOCATION:"33.7444, -118.2797",S:""},{B:"0002855828-0001-9",COUNCIL_DISTRICT:15,LOCATION:"33.8811, -118.2912",S:""},{B:"0002859714-0001-8",COUNCIL_DISTRICT:1,LOCATION:"34.0577, -118.2843",S:""},{B:"0002854143-0001-9",COUNCIL_DISTRICT:7,LOCATION:"34.2517, -118.4273",S:""},{B:"0002854627-0001-1",COUNCIL_DISTRICT:8,LOCATION:"34.0108, -118.3037",S:""},{B:"0002858250-0001-6",COUNCIL_DISTRICT:10,LOCATION:"34.069, -118.2932",S:""},{B:"0002858738-0001-6",COUNCIL_DISTRICT:8,LOCATION:"34.0037, -118.3089",S:""},{B:"0002681797-0005-3",COUNCIL_DISTRICT:8,LOCATION:"34.0037, -118.3062",S:""},{B:"0002863653-0001-2",COUNCIL_DISTRICT:0,LOCATION:"0, 0",S:""},{B:"0002858789-0001-9",COUNCIL_DISTRICT:8,LOCATION:"34.0095, -118.3351",S:""},{B:"0002864147-0001-3",COUNCIL_DISTRICT:3,LOCATION:"34.2015, -118.5928",S:""},{B:"0002862328-0001-2",COUNCIL_DISTRICT:10,LOCATION:"34.0616, -118.3142",S:""},{B:"0002866084-0001-1",COUNCIL_DISTRICT:8,LOCATION:"33.9782, -118.287",S:""},{B:"0002867759-0001-7",COUNCIL_DISTRICT:14,LOCATION:"34.0316, -118.2641",S:""},{B:"0002869310-0001-3",COUNCIL_DISTRICT:10,LOCATION:"34.0479, -118.3439",S:""},{B:"0000163971-0001-8",COUNCIL_DISTRICT:6,LOCATION:"34.186, -118.4487",S:""}]}
function feeAmountAll(checkCapId) {
/ *---------------------------------------------------------------------------------------------------------/
| Function Intent: 
| This function will return the total fee amount for all the fees on the record provided. If optional
| status are provided then it will only return the fee amounts having at status in the lists.
|
| Returns:
| Outcome  Description   Return  Type
| Success: Total fee amount  feeTotal Numeric
| Failure: Error    False  False
|
| Call Example:
| feeAmountAll(capId,"NEW"); 
|
| 05/15/2012 - Ewylam
| Version 1 Created
|
| Required paramaters in order:
| checkCapId - capId model of the record
|
/----------------------------------------------------------------------------------------------------------* / 
 
 // optional statuses to check for (SR5082)
        var checkStatus = false;
 var statusArray = new Array();

 //get optional arguments 
 if (arguments.length > 1)
  {
  checkStatus = true;
  for (var i=1; i<arguments.length; i++)
   statusArray.push(arguments[i]);
  }
        
 var feeTotal = 0;
 var feeResult=aa.fee.getFeeItems(checkCapId);
 if (feeResult.getSuccess())
  { var feeObjArr = feeResult.getOutput(); }
 else
  { logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false; }

 for (ff in feeObjArr) {
  if ( !checkStatus || exists(feeObjArr[ff].getFeeitemStatus(),statusArray) )
   { feeTotal+=feeObjArr[ff].getFee(); }
   }
 return feeTotal;
}
function generateReportForEmail_BCC(itemCap, reportName, module, parameters) {
    //returns the report file which can be attached to an email.
    var vAltId;
	var user = currentUserID;   // Setting the User Name
    var report = aa.reportManager.getReportInfoModelByName(reportName);
	var permit;
	var reportResult;
	var reportOutput;
	var vReportName;
    report = report.getOutput();
    report.setModule(module);
    report.setCapId(itemCap);
    report.setReportParameters(parameters);
	
	vAltId = itemCap.getCustomID();
	report.getEDMSEntityIdModel().setAltId(vAltId);
	
    permit = aa.reportManager.hasPermission(reportName, user);
    if (permit.getOutput().booleanValue()) {
        reportResult = aa.reportManager.getReportResult(report);
        if (!reportResult.getSuccess()) {
            logDebug("System failed get report: " + reportResult.getErrorType() + ":" + reportResult.getErrorMessage());
            return false;
        }
        else {
            reportOutput = reportResult.getOutput();
			vReportName = reportOutput.getName();
			logDebug("Report " + vReportName + " generated for record " + itemCap.getCustomID() + ". " + parameters);
            return vReportName;
        }
    }
    else {
        logDebug("Permissions are not set for report " + reportName + ".");
        return false;
    }
}
function getACAUrl(){

	// returns the path to the record on ACA.  Needs to be appended to the site

	itemCap = capId;
	if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args
   	var acaUrl = "";
	var id1 = capId.getID1();
	var id2 = capId.getID2();
	var id3 = capId.getID3();
	var cap = aa.cap.getCap(capId).getOutput().getCapModel();

	acaUrl += "/urlrouting.ashx?type=1000";
	acaUrl += "&Module=" + cap.getModuleName();
	acaUrl += "&capID1=" + id1 + "&capID2=" + id2 + "&capID3=" + id3;
	acaUrl += "&agencyCode=" + aa.getServiceProviderCode();
	acaUrl += "&fromACA=Y";
	return acaUrl;
	}

function getAddress(capId)
{
	capAddresses = null;
	var s_result = aa.address.getAddressByCapId(capId);
	if(s_result.getSuccess())
	{
		capAddresses = s_result.getOutput();
		if (capAddresses == null || capAddresses.length == 0)
		{
			logDebug("WARNING: no addresses on this CAP:" + capId);
			capAddresses = null;
		}
	}
	else
	{
		logDebug("Error: Failed to address: " + s_result.getErrorMessage());
		capAddresses = null;	
	}
	return capAddresses;
}





function getAddressInALine() {

	var capAddrResult = aa.address.getAddressByCapId(capId);
	var addressToUse = null;
	var strAddress = "";
		
	if (capAddrResult.getSuccess()) {
		var addresses = capAddrResult.getOutput();
		if (addresses) {
			for (zz in addresses) {
  				capAddress = addresses[zz];
				if (capAddress.getPrimaryFlag() && capAddress.getPrimaryFlag().equals("Y")) 
					addressToUse = capAddress;
			}
			if (addressToUse == null)
				addressToUse = addresses[0];

			if (addressToUse) {
			    strAddress = addressToUse.getHouseNumberStart();
			    var addPart = addressToUse.getStreetDirection();
			    if (addPart && addPart != "") 
			    	strAddress += " " + addPart;
			    var addPart = addressToUse.getStreetName();
			    if (addPart && addPart != "") 
			    	strAddress += " " + addPart;	
			    var addPart = addressToUse.getStreetSuffix();
			    if (addPart && addPart != "") 
			    	strAddress += " " + addPart;	
			    var addPart = addressToUse.getCity();
			    if (addPart && addPart != "") 
			    	strAddress += " " + addPart + ",";
			    var addPart = addressToUse.getState();
			    if (addPart && addPart != "") 
			    	strAddress += " " + addPart;	
			    var addPart = addressToUse.getZip();
			    if (addPart && addPart != "") 
			    	strAddress += " " + addPart;	
				return strAddress
			}
		}
	}
	return null;
}

function getAllParents(pAppType) {
	// returns the capId array of all parent caps
	//Dependency: appMatch function
	//

	parentArray = getRoots(capId);

	myArray = new Array();

	if (parentArray.length > 0) {
		if (parentArray.length) {
			for (x in parentArray) {
				if (pAppType != null) {
					//If parent type matches apType pattern passed in, add to return array
					if (appMatch(pAppType, parentArray[x]))
						myArray.push(parentArray[x]);
				} else
					myArray.push(parentArray[x]);
			}

			return myArray;
		} else {
			logDebug("**WARNING: GetParent found no project parent for this application");
			return null;
		}
	} else {
		logDebug("**WARNING: getting project parents:  " + getCapResult.getErrorMessage());
		return null;
	}
}

/ *--------------------------------------------------------------------------------------------------------------------/
| Start ETW 09/16/14 Added getAppName Function
/--------------------------------------------------------------------------------------------------------------------* /
function getAppName() {
    var itemCap = capId;
    if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

    capResult = aa.cap.getCap(itemCap)

    if (!capResult.getSuccess())
    { logDebug("**WARNING: error getting cap : " + capResult.getErrorMessage()); return false }

    capModel = capResult.getOutput().getCapModel()

    return capModel.getSpecialText()
}
/ *--------------------------------------------------------------------------------------------------------------------/
| End ETW 09/16/14 Added getAppName Function
/--------------------------------------------------------------------------------------------------------------------* /
function getAppSpecificInfo(capId)
{
	capAppSpecificInfo = null;
	var s_result = aa.appSpecificInfo.getByCapID(capId);
	if(s_result.getSuccess())
	{
		capAppSpecificInfo = s_result.getOutput();
		if (capAppSpecificInfo == null || capAppSpecificInfo.length == 0)
		{
			aa.print("WARNING: no appSpecificInfo on this CAP:" + capId);
			capAppSpecificInfo = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to appSpecificInfo: " + s_result.getErrorMessage());
		capAppSpecificInfo = null;	
	}
	// Return AppSpecificInfoModel[] 
	return capAppSpecificInfo;
}
function getContactASI(cContact, asiName) {
	try {
		peopleModel = cContact.getPeople();
		peopleTemplate = peopleModel.getTemplate();
		if (peopleTemplate == null) return null;
		var templateGroups = peopleTemplate.getTemplateForms(); //ArrayList
		var gArray = new Array(); 
		if (!(templateGroups == null || templateGroups.size() == 0)) {
			thisGroup = templateGroups.get(0);
			var subGroups = templateGroups.get(0).getSubgroups();
			for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++) {
				var subGroup = subGroups.get(subGroupIndex);
				var fArray = new Array();
				var fields = subGroup.getFields();
				for (var fieldIndex = 0; fieldIndex < fields.size(); fieldIndex++) {
					var field = fields.get(fieldIndex);
					fArray[field.getDisplayFieldName()] = field.getDefaultValue();
					if(field.getDisplayFieldName().toString().toUpperCase()==asiName.toString().toUpperCase()) {
						return field.getChecklistComment();
					}
				}
			}
		}
	}
	catch (err) { logDebug(err);}
	return null;
}

function getContactName_BCC(vConObj) {
	if (vConObj.people.getContactTypeFlag() == "organization") {
		return vConObj.people.getBusinessName();
	}
	else {
		if (vConObj.people.getFullName() != null && vConObj.people.getFullName() != "") {
			return vConObj.people.getFullName();
		}
		else if (vConObj.people.getFirstName() != null && vConObj.people.getLastName() != null) {
			return vConObj.people.getFirstName() + " " + vConObj.people.getLastName();
		}
	}
}
function getContactObj(itemCap,typeToLoad)
{
    // returning the first match on contact type
    var capContactArray = null;
    var cArray = new Array();

    if (itemCap.getClass() == "class com.accela.aa.aamain.cap.CapModel")   { // page flow script 
        var capContactGroup = itemCap.getContactsGroup();
        if (capContactGroup) {
			capContactArray = capContactGroup.toArray();
			}
        }
    else {
        var capContactResult = aa.people.getCapContactByCapID(itemCap);
        if (capContactResult.getSuccess()) {
            var capContactArray = capContactResult.getOutput();
            }
        }
    
    if (capContactArray) {
        for (var yy in capContactArray) {
            if (capContactArray[yy].getPeople().contactType.toUpperCase().equals(typeToLoad.toUpperCase())) {
                logDebug("getContactObj returned the first contact of type " + typeToLoad);
                return new contactObj(capContactArray[yy]);
            }
        }
    }
    
    logDebug("getContactObj could not find a contact of type " + typeToLoad);
    return false;
            
}
function getContactObjsByCap_BCC(itemCap) {
    // optional typeToLoad
    var typesToLoad = false;
    if (arguments.length == 2) {
		typesToLoad = arguments[1];
	}
    var capContactArray = null;
    var cArray = [];
    var yy = 0;

    var capContactResult = aa.people.getCapContactByCapID(itemCap);
    if (capContactResult.getSuccess()) {
        capContactArray = capContactResult.getOutput();
    }

    //aa.print("getContactObj returned " + capContactArray.length + " contactObj(s)");
    //aa.print("typesToLoad: " + typesToLoad);

    if (capContactArray) {
        for (yy in capContactArray) {
            //exclude inactive contacts
            if (capContactArray[yy].getPeople().getAuditStatus() == 'I') {
                continue;
            }
            if (!typesToLoad || capContactArray[yy].getPeople().contactType == typesToLoad) {
                cArray.push(new contactObj(capContactArray[yy]));
            }
        }
    }
    //logDebug("getContactObj returned " + cArray.length + " contactObj(s)");
    return cArray;
}
function getContactTypes_BCC() {
	var bizDomScriptResult = aa.bizDomain.getBizDomain('CONTACT TYPE');
	var vContactTypeArray = [];
	var i;
	
	if (bizDomScriptResult.getSuccess()) {
		bizDomScriptArray = bizDomScriptResult.getOutput().toArray();
		
		for (i in bizDomScriptArray) {
			if (bizDomScriptArray[i].getAuditStatus() != 'I') { 
				vContactTypeArray.push(bizDomScriptArray[i].getBizdomainValue());
			}
		}
	}
	
	return vContactTypeArray;
}
function getCurrentEnvironment() {
    var acaSite = lookup("ACA_CONFIGS", "ACA_SITE");
    var firstPart = acaSite.substr(0, acaSite.indexOf(".accela.com"));
    var dotArray = firstPart.split(".");

    return dotArray[dotArray.length-1];
}
function getDenialAge(c) {
	
	var r = aa.workflow.getHistory(c);
	if (r.getSuccess()) {
		var wh = r.getOutput();
		for (var i in wh) {

		fTask = wh[i];
			var t = fTask.getTaskDescription();
			var s = fTask.getDisposition();
			var d = fTask.getStatusDate();
			if ((t.equals("Initial Review") || t.equals("Supervisory Review")) && s.equals("Denied")) {
				logDebug("Found a denial " + d);
				logDebug(new Date(d.getTime()));
				var today = new Date();
				today.setHours(0); today.setMinutes(0); today.setSeconds(0); today.setMilliseconds(0);
				return (new Date(today)-new Date(d.getTime()))/(1000*60*60*24);
				}
			}
	}
}

function getPartialCapID(vCapId) {
	if (vCapId == null || aa.util.instanceOfString(vCapId))
	{
		return null;
	}
	//1. Get original partial CAPID  from related CAP table.
	var result = aa.cap.getProjectByChildCapID(vCapId, "EST", null);
	if(result.getSuccess())
	{
		projectScriptModels = result.getOutput();
		if (projectScriptModels == null || projectScriptModels.length == 0)
		{
			logDebug("ERROR: Failed to get partial CAP with CAPID(" + vCapId + ")");
			return null;
		}
		//2. Get original partial CAP ID from project Model
		projectScriptModel = projectScriptModels[0];
		return projectScriptModel.getProjectID();
	}  
	else 
	{
		logDebug("ERROR: Failed to get partial CAP by child CAP(" + vCapId + "): " + result.getErrorMessage());
		return null;
	}
}

/ *--------------------------------------------------------------------------------------------------------------------/
| Start ETW 12/3/14 getPeople3_0
/--------------------------------------------------------------------------------------------------------------------* /
function getPeople3_0(capId) {
    capPeopleArr = null;
    var s_result = aa.people.getCapContactByCapID(capId);
    if (s_result.getSuccess()) {
        capPeopleArr = s_result.getOutput();
        if (capPeopleArr != null || capPeopleArr.length > 0) {
            for (loopk in capPeopleArr) {
                var capContactScriptModel = capPeopleArr[loopk];
                var capContactModel = capContactScriptModel.getCapContactModel();
                var peopleModel = capContactScriptModel.getPeople();
                var contactAddressrs = aa.address.getContactAddressListByCapContact(capContactModel);
                if (contactAddressrs.getSuccess()) {
                    var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
                    peopleModel.setContactAddressList(contactAddressModelArr);
                }
            }
        }
        else {
            logDebug("WARNING: no People on this CAP:" + capId);
            capPeopleArr = null;
        }
    }
    else {
        logDebug("ERROR: Failed to People: " + s_result.getErrorMessage());
        capPeopleArr = null;
    }
    return capPeopleArr;
}
/ *--------------------------------------------------------------------------------------------------------------------/
| End ETW 12/3/14 getPeople3_0
/--------------------------------------------------------------------------------------------------------------------* /
function getProcessCode(vTaskName, vCapId) { // optional process name
	var useProcess = false;

	var processName = "";
	if (arguments.length == 5) {
		processName = arguments[4]; // process name
		useProcess = true;
	}

	var workflowResult = aa.workflow.getTaskItems(vCapId, vTaskName, processName, null, null, null);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}

	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(vTaskName.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
			return fTask.getProcessCode();
		}
	}
}

function getProcessID(vTaskName, vCapId) { // optional process name
	var useProcess = false;

	var processName = "";
	if (arguments.length == 5) {
		processName = arguments[4]; // process name
		useProcess = true;
	}

	var workflowResult = aa.workflow.getTaskItems(vCapId, vTaskName, processName, null, null, null);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}

	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(vTaskName.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
			return fTask.getProcessID();
		}
	}
}

function getRefAddContactList(peoId){
	var conAdd = aa.proxyInvoker.newInstance("com.accela.orm.model.address.ContactAddressModel").getOutput();
	conAdd.setEntityID(parseInt(peoId));
	conAdd.setEntityType("CONTACT");
	var addList =  aa.address.getContactAddressList(conAdd).getOutput();
	var tmpList = aa.util.newArrayList();
	var pri = true;
	for(x in addList){
		if(pri){
			pri=false;
			addList[x].getContactAddressModel().setPrimary("Y"); 
		}
		tmpList.add(addList[x].getContactAddressModel());
	}
		
	return tmpList;
}
function getRefASIACADisplayConfig(vASIGroup, vASISubgroup, vASIField) {
	var vASIList = aa.appSpecificInfo.getRefAppSpecInfoWithFieldList(vASIGroup,vASISubgroup,vASIField);
	var x = 0;
	var vASI;
	if (vASIList.getSuccess()) {
		vASIList = vASIList.getOutput().getFieldList().toArray();
		for (x in vASIList) {
			vASI = vASIList[x];
			if (vASI.getDispFieldLabel() == vASIField) {
				return vASI.getVchDispFlag();
			}
		}
	}
	return null;
}
function getRefASIReqFlag(vASIGroup, vASISubgroup, vASIField) {
	var vASIList = aa.appSpecificInfo.getRefAppSpecInfoWithFieldList(vASIGroup,vASISubgroup,vASIField);
	var x = 0;
	var vASI;
	if (vASIList.getSuccess()) {
		vASIList = vASIList.getOutput().getFieldList().toArray();
		for (x in vASIList) {
			vASI = vASIList[x];
			if (vASI.getDispFieldLabel() == vASIField) {
				return vASI.getRequiredFlag();
			}
		}
	} 
	return null;
}

function getRefContactForPublicUser(userSeqNum) {
	contractorPeopleBiz = aa.proxyInvoker.newInstance("com.accela.pa.people.ContractorPeopleBusiness").getOutput();
	userList = aa.util.newArrayList();
	userList.add(userSeqNum);
	peopleList = contractorPeopleBiz.getContractorPeopleListByUserSeqNBR(aa.getServiceProviderCode(), userList); 
	if (peopleList != null) {
		peopleArray = peopleList.toArray();
		if (peopleArray.length > 0)
			return peopleArray[0];
	}
	return null;
}

function getRequiredDocuments(isPageFlow) {

	logDebug("start getRequiredDocuments(" + [].slice.call(arguments) + ")");

	//TODO: put in checks to validate record types and reference conditions.

	var capToUse = capId;
	if (isPageFlow) {
		capToUse = cap;
	}
	var requirementArray = [];

	/ *------------------------------------------------------------------------------------------------------/
	| Load up Record Types : NEEDS REVIEW, map variables to record types
	/------------------------------------------------------------------------------------------------------* /
	var isMedical = appMatch("Licenses/Medical Cannabis/ * / *");
	var isAdultUse = appMatch("Licenses/Adult Use Cannabis/ * / *");
	var isCannabis = appMatch("Licenses/Cannabis/ * / *"); // combined

	var isApplication = appMatch("Licenses/ * / * /Application");
	var isAttestationAmendment = appMatch("Licenses/ * / * /Incomplete Attestation");
	var isRenewal = appMatch("Licenses/ * / * /Renewal");
	var isOwner = appMatch("Licenses/ * / * /Owner Submittal");
	var isOwnerAttestation = appMatch("Licenses/Cannabis/Application Amendment/Incomplete Attestation");

	var isDispensary = appMatch("Licenses/ * /Dispensary/*"); // No longer exists
	var isProducingDispensary = appMatch("Licenses/ * /Producing Dispensary/ *"); // No longer exists
	var isDistributor = appMatch("Licenses/ * /Distributor/*");  // Type A11, M11
	var isTesting = appMatch("Licenses/ * /Testing/*");  // Type 8
	var isTransporter = appMatch("Licenses/ * /Transporter/*"); // No longer exists
	var isRetailer = appMatch("Licenses/ * /Retailer/*"); // Type A10, M10
	var isRetailerNonStore = appMatch("Licenses/ * /Retailer Nonstorefront/*");  // Type A9, M9
	var isMicroBusiness = appMatch("Licenses/ * /Microbusiness/*");  // Type A12, M12
	var isDistribTransportOnly = appMatch("Licenses/ * /Distributor-Transport Only/*");  // Type A13, M13
	var isDeficiency = appMatch("Licenses/ * / * /Attestation Deficiency");


	/ *------------------------------------------------------------------------------------------------------/
	| Load up Workflow Requirements :
	/------------------------------------------------------------------------------------------------------* /
	
	var wfStopAll = [{
			task: "Supervisory Review",
			status: "Approved"
		}, {
			task: "Supervisory Review",
			status: "Provisionally Approved"
		}, {
			task: "Supervisory Review",
			status: "Temporarily Approved"
		}
	];
	var wfStopPermanentOnly = [{
			task: "Supervisory Review",
			status: "Approved"
		}, {
			task: "Supervisory Review",
			status: "Provisionally Approved"
		}
	];
	/ *------------------------------------------------------------------------------------------------------/
	| Load up Standard Conditions :
	/------------------------------------------------------------------------------------------------------* /
	var businessFormationDocuments = {
		condition: "Business Formation Documents",
		document: "Business Formation Documents",
		workflow: wfStopPermanentOnly
	}; // 5006(b)(15)
	var financialInformation = {
		condition: "Financial Information",
		document: "Financial Information",
		workflow: wfStopPermanentOnly
	}; // 5006(b)(18)
	var documentationOfLocalCompliance = {
		condition: "Documentation of Local Compliance",
		document: "Documentation of Local Compliance",
		workflow: wfStopAll
	}; // 5006(b)(23)
	var laborPeaceAgreement = {
		condition: "Labor Peace Agreement",
		document: "Labor Peace Agreement",
		workflow: wfStopPermanentOnly
	}; // 5006(b)(26)
	var documentForLaborPeace = {
		condition: "Document for Labor Peace Requirement",
		document: "Document for Labor Peace Requirement",
		workflow: wfStopPermanentOnly
		
	}; // user story 2213
	var waiverOfSovereignImmunity = {
		condition: "Waiver of Sovereign Immunity",
		document: "Waiver of Sovereign Immunity",
		workflow: wfStopPermanentOnly
	}; // 5006(b)(33)
	var evidenceOfLegalRightToOccupy = {
		condition: "Evidence of Legal Right to Occupy",
		document: "Evidence of Legal Right to Occupy",
		workflow: wfStopAll
	}; // 5006(b)(24)
	var proofOfSuretyBond = {
		condition: "Proof of Surety Bond",
		document: "Proof of Surety Bond",
		workflow: wfStopPermanentOnly
	}; // 5006(b)(28)
	var diagramOfPremises = {
		condition: "Diagram of Premises",
		document: "Diagram of Premises",
		workflow: wfStopAll
	}; // 5006(b)(28)
/* no longer used see story 2062
	var operatingProceduresDistrib = {
		condition: "Operating Procedures - Distribution",
		document: "Operating Procedures"
	}; // 5006(b)(30)
	var operatingProceduresTransport = {
		condition: "Operating Procedures - Transport",
		document: "Operating Procedures"
	}; // 5006(b)(31)
	var operatingProceduresDispense = {
		condition: "Operating Procedures - Dispensary",
		document: "Operating Procedures"
	}; // 5006(b)(32)
	var operatingProceduresMicro = {
		condition: "Operating Procedures - MicroBusiness",
		document: "Operating Procedures"
	}; // AUMA regs
	var operatingProceduresTesting = {
		condition: "Operating Procedures - Testing",
		document: "Operating Procedures"
	}; // 5292 (a)
* /
	var labEmployeeQualifications = {
		condition: "Laboratory Employee Qualifications",
		document: "Laboratory Employee Qualifications",
		workflow: wfStopPermanentOnly
	}; // 5238(b)
	var proofOfIsoAccreditationStatus = {
		condition: "Proof of ISO Accreditation Status",
		document: "Proof of ISO Accreditation Status",
		workflow: wfStopPermanentOnly
	}; // 5238(b)
	var submittedFingerPrintImages = {
		condition: "Submitted Application for Fingerprint Images",
		document: "Submitted Application for Fingerprint Images",
		workflow: wfStopPermanentOnly
	}; // 5238(b)
	var governmentIssuedIdentification = {
		condition: "Government-Issued Identification",
		document: "Government-Issued Identification",
		workflow: wfStopPermanentOnly
	}; // 5238(b)
	var descriptionOfConvictions = {
		condition: "Description of Convictions",
		document: "Description of Convictions",
		workflow: wfStopPermanentOnly
	}; // 5238(b)
	var proofOfMilitaryStatus = {
		condition: "Proof of Military Status",
		document: "Proof of Military Status",
		workflow: wfStopPermanentOnly
	}; // 5006(b)(4)
	var priorityProcessingRequest = {
		condition: "Priority Processing Request",
		document: "Priority Processing Request",
		workflow: wfStopPermanentOnly
	};
	var proofOfInsurance = {
		condition: "Proof of Commercial General Liability Insurance",
		document: "Proof of Commercial General Liability Insurance",
		workflow: wfStopPermanentOnly
	};
	var evidencePremiseLessThan600ft = {
		condition: "Evidence of Premise Less Than 600ft Compliance",
		document: "Evidence of Premise Less Than 600ft Compliance",
		workflow: wfStopPermanentOnly
	};

	var transportationProcess = {
		condition: "Transportation Process",
		document: "Transportation Process",
		workflow: wfStopPermanentOnly
	};
	var inventoryProcedures = {
		condition: "Inventory Procedures",
		document: "Inventory Procedures",
		workflow: wfStopPermanentOnly
	};
	var qualityControlProcedures = {
		condition: "Quality Control Procedures",
		document: "Quality Control Procedures",
		workflow: wfStopPermanentOnly
	};
	var securityProtocols = {
		condition: "Security Protocols",
		document: "Security Protocols",
		workflow: wfStopPermanentOnly
	};
	var standardOperatingProcedures = {
		condition: "Standard Operating Procedures",
		document: "Standard Operating Procedures",
		workflow: wfStopPermanentOnly
	};
	/*
	// removed user story 2229
	var chainOfCustodyProtocol = { condition: "Chain of Custody Protocol",document: "Chain of Custody Protocol"	};
	var labAnalysesStandard = {condition: "Laboratory Analyses Standard",document: "Laboratory Analyses Standard"	};
	var testingMethods = { condition: "Testing Methods",document: "Testing Methods"	};
	* /

	/*------------------------------------------------------------------------------------------------------/
	| Load up Conditionals from Record
	/------------------------------------------------------------------------------------------------------* /
	var isLargeEmployer = isASITrue(AInfo["20 or more employees?"]); // see user story 5135
	var isWaivingSovereignImmunity = isASITrue(AInfo["Are they Sovereign Entity"]); // see user story 5135, 1890
	var isPriorityRequest = isASITrue(AInfo["Are you requesting priority processing?"]); // see user story 340
	var isTemporaryRequest = isASITrue(AInfo["Are you requesting a temporary license?"]); // see user story 340
	var isLessThan600ft = isASITrue(AInfo["Attest no prohibited location Within specified requirement"]); //se user story 2203
	var needsLaborPeaceAgreement = isASITrue(AInfo["Attest they will abide to the Labor Peace Agreement"]); //see story 2213
	var hasDistributorTransportOnlyActivity = isASITrue(AInfo["Distributor-Transport Only"]); // see user story 2079
	var hasDistributorActivity = isASITrue(AInfo["Distributor"]); // see user story 2079
	var hasIsoLicense = isASITrue(AInfo["Accreditation/Provisional Testing Laboratory License"]); // see user story


	var isCriminal = false;
	var isSoleOwner = false;
	isMilitary = isASITrue(AInfo["Military Service"]);

	var ownerApplicant = getContactObj(capToUse, "Owner Applicant");
	if (ownerApplicant && ownerApplicant.asi) {
		isCriminal = isASITrue(ownerApplicant.asi["Criminal Convictions"]);
	}

	var businessOwner = getContactObj(capToUse, "Business Owner");
	if (businessOwner && businessOwner.asi) {
		isCriminal = isASITrue(businessOwner.asi["Criminal Convictions"]);

	}

	var business = getContactObj(capToUse, "Business");
	if (business && business.asi) {
		isSoleOwner = business.asi["5006(b)(14) Business Organization Structure"] == "Sole Proprietorship";
	}

	/*------------------------------------------------------------------------------------------------------/
	| Business Rules : NEEDS REVIEW, map variables to standard condition
	/------------------------------------------------------------------------------------------------------* /
	if (isOwner || isOwnerAttestation) {
		// removed requirement 5/24 after sprint story acceptance per Connie
		//requirementArray.push(submittedFingerPrintImages);
		requirementArray.push(governmentIssuedIdentification);

		if (isCriminal) {
			// Removed doc requirement per Connie 5/24 sprint acceptance meeting
			// requirementArray.push(descriptionOfConvictions);
		}
	}

	if (isOwner) {
		if (isMilitary) {
			requirementArray.push(proofOfMilitaryStatus);
		}
	}

	if ((isApplication || isAttestationAmendment) && !isOwnerAttestation) {
		// exclude items not needed for temp applications as submitted in ACA
		if (isPageFlow && isTemporaryRequest) {
			//requirementArray.push(documentationOfLocalCompliance);
			requirementArray.push(evidenceOfLegalRightToOccupy);
			requirementArray.push(diagramOfPremises);
		} else {
			//requirementArray.push(documentationOfLocalCompliance); only required for temp
			requirementArray.push(evidenceOfLegalRightToOccupy);
			requirementArray.push(diagramOfPremises);
			requirementArray.push(proofOfSuretyBond); //not needed for temp
			requirementArray.push(financialInformation); //not needed for temp
		}

		if (isPriorityRequest) {
			requirementArray.push(priorityProcessingRequest);
		}

		//if (isTemporaryRequest) {
		//	requirementArray.push(temporaryLicenseRequest);
		//}

		if (!isTemporaryRequest) {
			requirementArray.push(businessFormationDocuments);

			if (isLargeEmployer) {
				if (needsLaborPeaceAgreement) {
					requirementArray.push(laborPeaceAgreement);
				} else	{
					requirementArray.push(documentForLaborPeace);
				}
			}
		}

		if (isWaivingSovereignImmunity) {
			requirementArray.push(waiverOfSovereignImmunity);
		}

		if (isLessThan600ft) {
			requirementArray.push(evidencePremiseLessThan600ft);
		}

		if (hasIsoLicense) {
			requirementArray.push(proofOfIsoAccreditationStatus)
		}

		if (isDistributor || isRetailer || isRetailerNonStore || isMicroBusiness || isDistribTransportOnly) {
			// exclude items not needed for temp applications as submitted in ACA
			if (isPageFlow && isTemporaryRequest) {
				//nothing to do here
			} else {
				// user story 2062
				requirementArray.push(transportationProcess);
				requirementArray.push(inventoryProcedures);
				requirementArray.push(qualityControlProcedures);
				requirementArray.push(securityProtocols);			}
		}

		if (isTesting) {
			// exclude items not needed for temp applications as submitted in ACA
			if (isTemporaryRequest) {
				//nothing to do here
			} else {
				//requirementArray.push(operatingProceduresTesting);
				//removed in user story 1604
				//requirementArray.push(labEmployeeQualifications);
				// user story 2062

				requirementArray.push(standardOperatingProcedures);

				/*
				// removed in user story 2229
				requirementArray.push(labAnalysesStandard);
				requirementArray.push(chainOfCustodyProtocol);
				requirementArray.push(testingMethods);
        requirementArray.push(proofOfIsoAccreditationStatus);
				* /
				}
		}

		if (isDistributor || isDistribTransportOnly || (isMicroBusiness && (hasDistributorActivity || hasDistributorTransportOnlyActivity))) {
				// exclude items not needed for temp applications as submitted in ACA
			if (isPageFlow && isTemporaryRequest) {
				//nothing to do here
			} else {
				//use story 2079
				requirementArray.push(proofOfInsurance);
			}
	}

	}
	logDebug("Num of Req Docs:" + requirementArray.length + " docs.");
	logDebug("All req docs: " + requirementArray);

	return requirementArray;
}

function getRequiredDocumentsFromCOA() {

	logDebug("start getRequiredDocumentsFromCOA(" + [].slice.call(arguments) + ")");

	//TODO: put in checks to validate record types and reference conditions.

	var requirementArray = [];
	var parentCapId;
	parentCapIdString = "" + cap.getParentCapID();
	if (parentCapIdString) {
		pca = parentCapIdString.split("-");
		parentCapId = aa.cap.getCapID(pca[0], pca[1], pca[2]).getOutput();
	}

	if (parentCapId) {  // should always be true for amendment
	var c = aa.capCondition.getCapConditions(parentCapId).getOutput();
	for (var i in c) { 
		var coa = c[i];
		if ("Y".equals(coa.getConditionOfApproval())) {
			var cm = coa.getCapConditionModel();
			if("Incomplete".equals(cm.getConditionStatus())) {  // only prompt for COA marked Incomplete
				var req = {};
				req.condition = cm.getConditionDescription();
				// call this a bad doc.  Even if it's uploaded, we will ask again since the COA is incomplete.
				req.document = "Bad Doc " + cm.getConditionDescription();
				requirementArray.push(req);
				}
			}
		}
	}

	logDebug("Num of Req Docs:" + requirementArray.length + " docs.");
	logDebug("All req docs: " + requirementArray);

	return requirementArray;
}

function getSubProcessCode(vStepNumber, vParentProcessID) {
	var relationResult = aa.workflow.getProcessRelationByPK(capId, vStepNumber, vParentProcessID, systemUserObj);
	var relObj;
	var fTask;
	var fRel;

	var subTask;
	var substepnumber;
	var subprocessCode;
	var subwftask;
	var subwfnote = " ";
	var subTaskResult;
	var subTaskObj;
	var k = 0;
	
	if (relationResult.getSuccess()) {
		relObj = relationResult.getOutput();
		return relObj.getProcessCode();
	} else {
		logMessage("**ERROR: Failed to get workflow process relation object: " + relationResult.getErrorMessage());
		return false;
	}
}
function getSubProcessID(vStepNumber, vParentProcessID) {
	var relationResult = aa.workflow.getProcessRelationByPK(capId, vStepNumber, vParentProcessID, systemUserObj);
	var relObj;
	var fTask;
	var fRel;

	var subTask;
	var substepnumber;
	var subprocessCode;
	var subwftask;
	var subwfnote = " ";
	var subTaskResult;
	var subTaskObj;
	var k = 0;
	
	if (relationResult.getSuccess()) {
		relObj = relationResult.getOutput();
		return relObj.getProcessID();
	} else {
		logMessage("**ERROR: Failed to get workflow process relation object: " + relationResult.getErrorMessage());
		return false;
	}
}
function getTaskActionBy(wfstr) // optional process name.
{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2) {
		processName = arguments[1]; // subprocess
		useProcess = true;
	}

	var taskDesc = wfstr;
	if (wfstr == "*") {
		taskDesc = "";
	}
	var workflowResult = aa.workflow.getTaskItems(capId, taskDesc, processName, null, null, null);
	if (workflowResult.getSuccess())
		wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}

	for (i in wfObj) {
		var fTask = wfObj[i];
		if ((fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) || wfstr == "*") && (!useProcess || fTask.getProcessCode().equals(processName))) {
			var taskItem = fTask.getTaskItem();
			var vStaffUser = aa.cap.getStaffByUser(taskItem.getSysUser().getFirstName(),taskItem.getSysUser().getMiddleName(),taskItem.getSysUser().getLastName(),taskItem.getSysUser().toString()).getOutput(); 
			return vStaffUser.getUserID();
		}
	}
}
function getTaskAssignedStaff(wfstr) // optional process name.
{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2) {
		processName = arguments[1]; // subprocess
		useProcess = true;
	}

	var taskDesc = wfstr;
	if (wfstr == "*") {
		taskDesc = "";
	}
	var workflowResult = aa.workflow.getTaskItems(capId, taskDesc, processName, null, null, null);
	if (workflowResult.getSuccess())
		wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}

	for (i in wfObj) {
		var fTask = wfObj[i];
		if ((fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) || wfstr == "*") && (!useProcess || fTask.getProcessCode().equals(processName))) {
			var vStaffUser = aa.cap.getStaffByUser(fTask.getAssignedStaff().getFirstName(),fTask.getAssignedStaff().getMiddleName(),fTask.getAssignedStaff().getLastName(),fTask.getAssignedStaff().toString()).getOutput(); 
			if (vStaffUser != null) {			
				return vStaffUser.getUserID();
			}
		}
	}
	return false;
}

function getTaskSpecific(wfName,itemName) {  // optional: itemCap
                var i=0;
                var itemCap = capId;
                if (arguments.length == 4) itemCap = arguments[3]; // use cap ID specified in args

                //
               // Get the workflows
               //
               var workflowResult = aa.workflow.getTasks(itemCap);
               if (workflowResult.getSuccess())
                               var wfObj = workflowResult.getOutput();
               else
                               { logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

               //
               // Loop through workflow tasks
               //
               for (i in wfObj) {
                               var fTask = wfObj[i];
                               var stepnumber = fTask.getStepNumber();
                               var processID = fTask.getProcessID();
                               if (wfName.equals(fTask.getTaskDescription())) { // Found the right Workflow Task
                                               var TSIResult = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(itemCap,processID,stepnumber,itemName);
                                               if (TSIResult.getSuccess()) {
                                                               var TSI = TSIResult.getOutput();
                                                                if (TSI != null) {
                                                                                var TSIArray = new Array();
                                                                                var TSInfoModel = TSI.getTaskSpecificInfoModel();
                                                                                var itemValue = TSInfoModel.getChecklistComment();
                                                                                return itemValue;
                                                                }
                                                                else {
                                                                                logDebug("No task specific info field called "+itemName+" found for task "+wfName);
                                                                                return false;
                                                                }
                                               }
                                               else {
                                                               logDebug("**ERROR: Failed to get Task Specific Info objects: " + TSIResult.getErrorMessage());
                                                               return false;
                                               }
                               }  // found workflow task
                } // each task
        return false;
}

function getTaskStepNumber(vProcess, vTask, vCapId) {
	var workflowResult = aa.workflow.getTaskItems(vCapId, vTask, vProcess, null, null, null);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}

	var i = 0;
	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(vTask.toUpperCase()) && fTask.getProcessCode().equals(vProcess)) {
			return fTask.getStepNumber();
		}
	}
}
function handleError(err,context) {
	var rollBack = true;
	var showError = true;

	if (showError) showDebug = true;
	logDebug((rollBack ? "**ERROR** " : "ERROR: ") + err.message + " In " + context + " Line " + err.lineNumber);
    logDebug("Stack: " + err.stack);
	
	// Log to Slack Channel in ETechConsultingLLC.slack.com BCC_EMSE_Debug
	
	var headers=aa.util.newHashMap();

    headers.put("Content-Type","application/json");
	
    var body = {};
	body.text = ENVIRON + ": " + err.message + " In " + context + " Line " + err.lineNumber + " Stack: " + err.stack;
	body.attachments = [{"fallback": "Full Debug Output"}];
	body.attachments[0].text = debug;
	
    var apiURL = SLACKURL;  // from globals
	
	
    var result = aa.httpClient.post(apiURL, headers, JSON.stringify(body));
    if (!result.getSuccess()) {
        logDebug("Slack get anonymous token error: " + result.getErrorMessage());
	} else {	
		aa.print("Slack Results: " + result.getOutput());
        }
  	}
	
function hideAppSpecific4ACA(vASIField) {
	// uses capModel in this event
	var capASI = cap.getAppSpecificInfoGroups();
	if (!capASI) {
		logDebug("No ASI for the CapModel");
	} else {
		var i = cap.getAppSpecificInfoGroups().iterator();
		while (i.hasNext()) {
			var group = i.next();
			var fields = group.getFields();
			if (fields != null) {
				var iteFields = fields.iterator();
				while (iteFields.hasNext()) {
					var field = iteFields.next();
					if (field.getCheckboxDesc() == vASIField) {
						field.setAttributeValueReqFlag('N');
						field.setVchDispFlag('H');
						logDebug("Updated ASI: " + field.getCheckboxDesc() + " to be ACA not displayable.");
					}
				}
			}
		}
	}
}
function idLookupTable() {
	return [{
			A: 9718400012,
			F: 204513512,
			S: ""
		}, {
			A: 38294700029,
			F: 204910654,
			S: ""
		}, {
			A: 41022500021,
			F: "",
			S: 784
		}, {
			A: 46038200011,
			F: "",
			S: 350
		}, {
			A: 64358300021,
			F: "",
			S: 4212
		}, {
			A: 65475500037,
			F: "",
			S: 2617
		}, {
			A: 67996400031,
			F: 264715336,
			S: ""
		}, {
			A: 71537400018,
			F: "",
			S: 7640
		}, {
			A: 72575900039,
			F: 464307807,
			S: ""
		}, {
			A: 73687900020,
			F: "",
			S: 60
		}, {
			A: 87214600011,
			F: "",
			S: 143
		}, {
			A: 94922300016,
			F: 454641382,
			S: ""
		}, {
			A: 96660500020,
			F: 462304771,
			S: ""
		}, {
			A: 97851600012,
			F: "",
			S: 5464
		}, {
			A: 203395200010,
			F: 900278263,
			S: 2383
		}, {
			A: 203446000029,
			F: 800442608,
			S: ""
		}, {
			A: 203654300028,
			F: 421724002,
			S: ""
		}, {
			A: 204061500019,
			F: 202678618,
			S: ""
		}, {
			A: 204578800012,
			F: "",
			S: 9669
		}, {
			A: 205321800018,
			F: 203062347,
			S: ""
		}, {
			A: 206023300017,
			F: "",
			S: 6804
		}, {
			A: 207246300015,
			F: 205864966,
			S: ""
		}, {
			A: 207298100014,
			F: 562535399,
			S: 2184
		}, {
			A: 208240500027,
			F: 465020782,
			S: 3535
		}, {
			A: 208614500018,
			F: 743159763,
			S: ""
		}, {
			A: 208656600012,
			F: 204195131,
			S: ""
		}, {
			A: 209547900011,
			F: 473902782,
			S: 9714
		}, {
			A: 209547900029,
			F: 473902782,
			S: 9714
		}, {
			A: 209799900013,
			F: 202103946,
			S: ""
		}, {
			A: 210173000027,
			F: "",
			S: 883
		}, {
			A: 210363700033,
			F: 201472795,
			S: 9303
		}, {
			A: 210414400030,
			F: 830463100,
			S: ""
		}, {
			A: 210764500011,
			F: 50616045,
			S: ""
		}, {
			A: 210777500010,
			F: 510568658,
			S: ""
		}, {
			A: 211211500019,
			F: 205415910,
			S: ""
		}, {
			A: 211222200017,
			F: 204618927,
			S: ""
		}, {
			A: 211238100012,
			F: 830491300,
			S: 8893
		}, {
			A: 211259900019,
			F: 204290413,
			S: ""
		}, {
			A: 211560000015,
			F: 204653986,
			S: ""
		}, {
			A: 211589400012,
			F: 204913779,
			S: ""
		}, {
			A: 211654400017,
			F: "",
			S: 493
		}, {
			A: 211728400014,
			F: 473622090,
			S: ""
		}, {
			A: 211741300011,
			F: 205105496,
			S: ""
		}, {
			A: 211890100016,
			F: 463665185,
			S: 2491
		}, {
			A: 213295400017,
			F: 830469188,
			S: ""
		}, {
			A: 213399200010,
			F: "",
			S: 8790
		}, {
			A: 213442000011,
			F: "",
			S: 6668
		}, {
			A: 216278400011,
			F: "",
			S: 4547
		}, {
			A: 216306000015,
			F: 205116105,
			S: ""
		}, {
			A: 216510100011,
			F: 205270650,
			S: ""
		}, {
			A: 216800000010,
			F: 204650967,
			S: ""
		}, {
			A: 216814900013,
			F: 10938913,
			S: ""
		}, {
			A: 216936600011,
			F: 204650967,
			S: ""
		}, {
			A: 217298700017,
			F: 300373579,
			S: ""
		}, {
			A: 217308800015,
			F: 205261601,
			S: ""
		}, {
			A: 217363100014,
			F: 870778753,
			S: ""
		}, {
			A: 217376800015,
			F: 204290409,
			S: ""
		}, {
			A: 217419000018,
			F: 383739716,
			S: ""
		}, {
			A: 217473100010,
			F: 205315381,
			S: ""
		}, {
			A: 217563900015,
			F: 205999671,
			S: 280
		}, {
			A: 217697900011,
			F: 205454068,
			S: ""
		}, {
			A: 217745600017,
			F: 721620363,
			S: ""
		}, {
			A: 217815100017,
			F: 204341535,
			S: ""
		}, {
			A: 217817300013,
			F: 223928324,
			S: ""
		}, {
			A: 217842600013,
			F: 975922378,
			S: ""
		}, {
			A: 217934800019,
			F: 455552676,
			S: 4751
		}, {
			A: 217961500019,
			F: 208101642,
			S: ""
		}, {
			A: 217961500027,
			F: 208101642,
			S: ""
		}, {
			A: 218034400011,
			F: 651291731,
			S: ""
		}, {
			A: 218108800017,
			F: "",
			S: 3887
		}, {
			A: 218164300019,
			F: 830465847,
			S: ""
		}, {
			A: 218186300012,
			F: 463559466,
			S: ""
		}, {
			A: 218226400015,
			F: 20796874,
			S: ""
		}, {
			A: 218329800011,
			F: 208179023,
			S: 3844
		}, {
			A: 218355700017,
			F: 205561699,
			S: ""
		}, {
			A: 218456900017,
			F: 161772435,
			S: ""
		}, {
			A: 218468300015,
			F: 450543302,
			S: ""
		}, {
			A: 218486000100,
			F: 562622862,
			S: ""
		}, {
			A: 218593100010,
			F: 320180687,
			S: ""
		}, {
			A: 218599700019,
			F: 562613328,
			S: ""
		}, {
			A: 218636300018,
			F: 205627844,
			S: ""
		}, {
			A: 218868000011,
			F: 61795490,
			S: ""
		}, {
			A: 218902500010,
			F: 205611578,
			S: ""
		}, {
			A: 218912800011,
			F: 900703726,
			S: ""
		}, {
			A: 218917900014,
			F: 421715965,
			S: ""
		}, {
			A: 219033500019,
			F: 611463016,
			S: ""
		}, {
			A: 219049600013,
			F: 800326088,
			S: 8043
		}, {
			A: 219053200011,
			F: 205683134,
			S: ""
		}, {
			A: 219173000016,
			F: 800623812,
			S: ""
		}, {
			A: 219229900015,
			F: 320214293,
			S: ""
		}, {
			A: 219240000034,
			F: 261579446,
			S: ""
		}, {
			A: 219245300028,
			F: 205693244,
			S: ""
		}, {
			A: 219358000012,
			F: 205734731,
			S: ""
		}, {
			A: 219373000029,
			F: 203958510,
			S: 8577
		}, {
			A: 219462300028,
			F: "",
			S: 919
		}, {
			A: 219535800016,
			F: 205874390,
			S: ""
		}, {
			A: 219536200012,
			F: 208403624,
			S: ""
		}, {
			A: 219564900011,
			F: 651296271,
			S: ""
		}, {
			A: 219852000017,
			F: 205843817,
			S: ""
		}, {
			A: 219899100010,
			F: 30609873,
			S: ""
		}, {
			A: 220069500013,
			F: 205888781,
			S: ""
		}, {
			A: 220076900019,
			F: 205781528,
			S: ""
		}, {
			A: 220162600010,
			F: 510611549,
			S: ""
		}, {
			A: 220166500010,
			F: 205809558,
			S: ""
		}, {
			A: 220230700010,
			F: 205826749,
			S: ""
		}, {
			A: 220317200013,
			F: 711016934,
			S: ""
		}, {
			A: 220331400017,
			F: "",
			S: 9874
		}, {
			A: 220331400025,
			F: "",
			S: 9874
		}, {
			A: 220331400033,
			F: "",
			S: 9874
		}, {
			A: 220510100018,
			F: 205971234,
			S: ""
		}, {
			A: 220512300014,
			F: 205872089,
			S: ""
		}, {
			A: 220521300019,
			F: "",
			S: 9180
		}, {
			A: 220521300027,
			F: "",
			S: 9180
		}, {
			A: 220624900014,
			F: 510613120,
			S: ""
		}, {
			A: 220703500013,
			F: 273111647,
			S: ""
		}, {
			A: 220719800017,
			F: 205444049,
			S: ""
		}, {
			A: 220729100013,
			F: 900442665,
			S: ""
		}, {
			A: 220785800010,
			F: 205671906,
			S: ""
		}, {
			A: 220803100012,
			F: "",
			S: 2556
		}, {
			A: 220842800013,
			F: 205863167,
			S: ""
		}, {
			A: 220845700010,
			F: 208020651,
			S: ""
		}, {
			A: 220888400010,
			F: 711018381,
			S: ""
		}, {
			A: 220981400011,
			F: 208164626,
			S: 8952
		}, {
			A: 221015500014,
			F: 208060605,
			S: ""
		}, {
			A: 221024400014,
			F: 208044358,
			S: ""
		}, {
			A: 221066500019,
			F: 20797881,
			S: 420
		}, {
			A: 221077400016,
			F: 208072002,
			S: ""
		}, {
			A: 221128900019,
			F: 464060287,
			S: ""
		}, {
			A: 221155600019,
			F: 113799341,
			S: ""
		}, {
			A: 221179100017,
			F: 562633819,
			S: ""
		}, {
			A: 221231200025,
			F: 204279940,
			S: ""
		}, {
			A: 221246400012,
			F: 352300829,
			S: ""
		}, {
			A: 221248600019,
			F: 264532360,
			S: ""
		}, {
			A: 221571700014,
			F: 10881660,
			S: ""
		}, {
			A: 221579600019,
			F: 208183823,
			S: ""
		}, {
			A: 221711900019,
			F: 260319582,
			S: ""
		}, {
			A: 221807300012,
			F: "",
			S: 8708
		}, {
			A: 221810400010,
			F: 278371036,
			S: 9683
		}, {
			A: 221995400011,
			F: 208060147,
			S: ""
		}, {
			A: 222031300013,
			F: 270377326,
			S: ""
		}, {
			A: 222047800016,
			F: 510615095,
			S: ""
		}, {
			A: 222092900013,
			F: 10884581,
			S: ""
		}, {
			A: 222118600013,
			F: 208557588,
			S: ""
		}, {
			A: 222444300011,
			F: 204987550,
			S: ""
		}, {
			A: 222445100016,
			F: 223952641,
			S: ""
		}, {
			A: 222506500012,
			F: 20797880,
			S: 420
		}, {
			A: 222506900011,
			F: 270775379,
			S: 671
		}, {
			A: 222545600016,
			F: 463591964,
			S: 5337
		}, {
			A: 222660600011,
			F: "",
			S: 4790
		}, {
			A: 222667500012,
			F: 208984695,
			S: ""
		}, {
			A: 222683300015,
			F: 464140225,
			S: 4160
		}, {
			A: 222707300011,
			F: 208482601,
			S: ""
		}, {
			A: 222744600017,
			F: 208330447,
			S: ""
		}, {
			A: 222755000011,
			F: 510618134,
			S: ""
		}, {
			A: 222853700013,
			F: 454521037,
			S: ""
		}, {
			A: 222893400012,
			F: 651295686,
			S: ""
		}, {
			A: 222894100012,
			F: 680637260,
			S: ""
		}, {
			A: 222920100018,
			F: "",
			S: 7179
		}, {
			A: 223100600012,
			F: 263961748,
			S: 4688
		}, {
			A: 223172400018,
			F: 205968670,
			S: ""
		}, {
			A: 223185700011,
			F: 611707973,
			S: ""
		}, {
			A: 223246100011,
			F: 208602745,
			S: ""
		}, {
			A: 223317600011,
			F: 264640837,
			S: ""
		}, {
			A: 223323600014,
			F: 260146345,
			S: ""
		}, {
			A: 223400900018,
			F: 364637070,
			S: ""
		}, {
			A: 223400900026,
			F: 364637070,
			S: ""
		}, {
			A: 223417100015,
			F: 205348113,
			S: ""
		}, {
			A: 223499200012,
			F: 680658973,
			S: ""
		}, {
			A: 223530900010,
			F: 475171333,
			S: ""
		}, {
			A: 223608500013,
			F: 473379674,
			S: ""
		}, {
			A: 223638100010,
			F: 263036603,
			S: ""
		}, {
			A: 223791900017,
			F: 208767269,
			S: ""
		}, {
			A: 223883200011,
			F: 870799117,
			S: ""
		}, {
			A: 223929100017,
			F: 464616127,
			S: ""
		}, {
			A: 223950100019,
			F: 463516677,
			S: ""
		}, {
			A: 223962700011,
			F: 208086725,
			S: ""
		}, {
			A: 223963300017,
			F: 208089385,
			S: ""
		}, {
			A: 223978800016,
			F: 263040811,
			S: ""
		}, {
			A: 224022800014,
			F: 208848140,
			S: ""
		}, {
			A: 224239000016,
			F: 870799912,
			S: ""
		}, {
			A: 224316000016,
			F: 264424677,
			S: ""
		}, {
			A: 224395800014,
			F: 208868698,
			S: ""
		}, {
			A: 224447600019,
			F: 562657510,
			S: ""
		}, {
			A: 224564000014,
			F: 870801045,
			S: ""
		}, {
			A: 224571500014,
			F: 208999605,
			S: 1194
		}, {
			A: 224597100014,
			F: 800193535,
			S: ""
		}, {
			A: 224597100022,
			F: 800193535,
			S: ""
		}, {
			A: 224608600014,
			F: 208958219,
			S: ""
		}, {
			A: 224686700017,
			F: 208999427,
			S: ""
		}, {
			A: 224712100015,
			F: 204890599,
			S: ""
		}, {
			A: 224794400011,
			F: 800930314,
			S: ""
		}, {
			A: 224818800016,
			F: 464287266,
			S: ""
		}, {
			A: 224838800021,
			F: "",
			S: 2284
		}, {
			A: 224845100026,
			F: "",
			S: 9669
		}, {
			A: 224895300018,
			F: 562639180,
			S: ""
		}, {
			A: 225033600013,
			F: 260235073,
			S: ""
		}, {
			A: 225089200018,
			F: 260430865,
			S: ""
		}, {
			A: 225305400019,
			F: 260179385,
			S: ""
		}, {
			A: 225414100017,
			F: 260561509,
			S: ""
		}, {
			A: 225449200014,
			F: "",
			S: 6834
		}, {
			A: 225449200022,
			F: "",
			S: 6834
		}, {
			A: 225498400011,
			F: 208878173,
			S: ""
		}, {
			A: 225560000016,
			F: 113816335,
			S: ""
		}, {
			A: 225562900014,
			F: 262941021,
			S: ""
		}, {
			A: 225628800016,
			F: 260331788,
			S: ""
		}, {
			A: 225660400011,
			F: 830485561,
			S: ""
		}, {
			A: 225687500018,
			F: 473538932,
			S: ""
		}, {
			A: 225697200012,
			F: 260399221,
			S: ""
		}, {
			A: 225699500013,
			F: 260435766,
			S: ""
		}, {
			A: 225704500019,
			F: 260296272,
			S: ""
		}, {
			A: 225713700012,
			F: 830486070,
			S: ""
		}, {
			A: 225722300019,
			F: 464957475,
			S: ""
		}, {
			A: 225751900017,
			F: 260467172,
			S: ""
		}, {
			A: 225888500016,
			F: 510640913,
			S: ""
		}, {
			A: 226018900015,
			F: "",
			S: 2344
		}, {
			A: 226090700012,
			F: 260574123,
			S: ""
		}, {
			A: 226117500011,
			F: "",
			S: 4103
		}, {
			A: 226165100016,
			F: "",
			S: 976
		}, {
			A: 226221100024,
			F: 464318466,
			S: ""
		}, {
			A: 226242400010,
			F: 260577369,
			S: ""
		}, {
			A: 226257700010,
			F: 208773591,
			S: ""
		}, {
			A: 226279400010,
			F: 900733149,
			S: ""
		}, {
			A: 226311900011,
			F: 475427731,
			S: 577
		}, {
			A: 226391900025,
			F: 651203581,
			S: ""
		}, {
			A: 226440100013,
			F: "",
			S: 6088
		}, {
			A: 226587900015,
			F: 260654597,
			S: ""
		}, {
			A: 226703400017,
			F: 260641450,
			S: ""
		}, {
			A: 226711500012,
			F: "",
			S: 1257
		}, {
			A: 226760700019,
			F: "",
			S: 6467
		}, {
			A: 226961800011,
			F: 263275469,
			S: ""
		}, {
			A: 227044400019,
			F: 260876318,
			S: 159
		}, {
			A: 227085200016,
			F: 260353281,
			S: 1086
		}, {
			A: 227348200016,
			F: 464353997,
			S: ""
		}, {
			A: 227368500016,
			F: 272560936,
			S: ""
		}, {
			A: 227440300019,
			F: 260877577,
			S: ""
		}, {
			A: 227449600015,
			F: 260890953,
			S: ""
		}, {
			A: 227471200012,
			F: 260337267,
			S: ""
		}, {
			A: 227474900015,
			F: 205889521,
			S: ""
		}, {
			A: 227492000013,
			F: 272278243,
			S: 304
		}, {
			A: 227501900014,
			F: "",
			S: 6280
		}, {
			A: 227503200010,
			F: 260175246,
			S: ""
		}, {
			A: 227503400019,
			F: 263725762,
			S: ""
		}, {
			A: 227503800017,
			F: 263711913,
			S: ""
		}, {
			A: 227504100019,
			F: 260903139,
			S: ""
		}, {
			A: 227504200013,
			F: 260893004,
			S: ""
		}, {
			A: 227504400012,
			F: 260893048,
			S: ""
		}, {
			A: 227771800011,
			F: 455443441,
			S: ""
		}, {
			A: 227817000015,
			F: 208865848,
			S: ""
		}, {
			A: 228424500012,
			F: 261250567,
			S: ""
		}, {
			A: 228645900015,
			F: "",
			S: 8110
		}, {
			A: 228951500012,
			F: 30587912,
			S: ""
		}, {
			A: 230264500015,
			F: "",
			S: ""
		}, {
			A: 233380800025,
			F: 462432179,
			S: ""
		}, {
			A: 235075800018,
			F: 300696029,
			S: ""
		}, {
			A: 235295500015,
			F: "",
			S: 6834
		}, {
			A: 237838700012,
			F: 262940568,
			S: ""
		}, {
			A: 238024600021,
			F: 451216626,
			S: ""
		}, {
			A: 238024600064,
			F: 451216626,
			S: ""
		}, {
			A: 238024600099,
			F: 451216626,
			S: ""
		}, {
			A: 238024600102,
			F: 451216626,
			S: ""
		}, {
			A: 238024600137,
			F: 451216626,
			S: ""
		}, {
			A: 238024600145,
			F: 451216626,
			S: ""
		}, {
			A: 238024600153,
			F: 451216626,
			S: ""
		}, {
			A: 238024600161,
			F: 451216626,
			S: ""
		}, {
			A: 239007300011,
			F: 263679492,
			S: ""
		}, {
			A: 239132900011,
			F: 271030329,
			S: ""
		}, {
			A: 239368400010,
			F: "",
			S: ""
		}, {
			A: 240538900011,
			F: 264108269,
			S: ""
		}, {
			A: 240683400018,
			F: 800340154,
			S: ""
		}, {
			A: 240818900016,
			F: 200290043,
			S: ""
		}, {
			A: 240839500018,
			F: "",
			S: 4049
		}, {
			A: 241324500011,
			F: 264237788,
			S: ""
		}, {
			A: 241787500011,
			F: 300537676,
			S: ""
		}, {
			A: 242290500013,
			F: 264523336,
			S: ""
		}, {
			A: 243758900011,
			F: 800380225,
			S: ""
		}, {
			A: 244049800017,
			F: 270149260,
			S: ""
		}, {
			A: 244114400013,
			F: 270480437,
			S: ""
		}, {
			A: 244396400011,
			F: 953483069,
			S: ""
		}, {
			A: 244697100012,
			F: 800426042,
			S: ""
		}, {
			A: 244814700018,
			F: 264455009,
			S: ""
		}, {
			A: 245687600013,
			F: 270645936,
			S: ""
		}, {
			A: 245965400021,
			F: "",
			S: 7492
		}, {
			A: 246651400014,
			F: 800478331,
			S: ""
		}, {
			A: 249474600015,
			F: 271290621,
			S: ""
		}, {
			A: 250746300022,
			F: "",
			S: 2671
		}, {
			A: 250912700018,
			F: 900507570,
			S: ""
		}, {
			A: 253763300035,
			F: 273409038,
			S: ""
		}, {
			A: 255375400012,
			F: 274162690,
			S: ""
		}, {
			A: 255375400021,
			F: 274162690,
			S: ""
		}, {
			A: 255375400039,
			F: 274162690,
			S: ""
		}, {
			A: 255481200014,
			F: "",
			S: ""
		}, {
			A: 255672300019,
			F: 450655847,
			S: ""
		}, {
			A: 257266900016,
			F: 452234756,
			S: ""
		}, {
			A: 257266900024,
			F: 452234756,
			S: ""
		}, {
			A: 257266900041,
			F: 452234756,
			S: ""
		}, {
			A: 257647000011,
			F: "",
			S: 7143
		}, {
			A: 257723800014,
			F: 453215700,
			S: ""
		}, {
			A: 257748700014,
			F: 453090747,
			S: ""
		}, {
			A: 257832500012,
			F: 810577583,
			S: ""
		}, {
			A: 257858200017,
			F: 202547283,
			S: ""
		}, {
			A: 257869700011,
			F: 452430618,
			S: ""
		}, {
			A: 257936200011,
			F: 453437672,
			S: ""
		}, {
			A: 258075300015,
			F: 800415687,
			S: ""
		}, {
			A: 258150200013,
			F: 208352893,
			S: ""
		}, {
			A: 258183400018,
			F: 453593327,
			S: ""
		}, {
			A: 258288200014,
			F: 453624157,
			S: ""
		}, {
			A: 258446000010,
			F: 352534906,
			S: ""
		}, {
			A: 258458800020,
			F: 453683685,
			S: ""
		}, {
			A: 258484000015,
			F: 453700035,
			S: ""
		}, {
			A: 258484300019,
			F: 364713521,
			S: ""
		}, {
			A: 258484500018,
			F: 453708208,
			S: ""
		}, {
			A: 258485400017,
			F: 462566734,
			S: ""
		}, {
			A: 258487000016,
			F: "",
			S: ""
		}, {
			A: 258545600011,
			F: 452385064,
			S: ""
		}, {
			A: 258569500017,
			F: "",
			S: 6989
		}, {
			A: 258724200017,
			F: 453632516,
			S: ""
		}, {
			A: 258834400020,
			F: 453851247,
			S: ""
		}, {
			A: 259003500016,
			F: 453699645,
			S: ""
		}, {
			A: 259093300011,
			F: 273252271,
			S: ""
		}, {
			A: 259093300037,
			F: 273252271,
			S: ""
		}, {
			A: 259093300045,
			F: 273252271,
			S: ""
		}, {
			A: 259118400015,
			F: "",
			S: 2949
		}, {
			A: 259248200018,
			F: "",
			S: ""
		}, {
			A: 259248800015,
			F: 452214089,
			S: ""
		}, {
			A: 259248800023,
			F: 452214089,
			S: ""
		}, {
			A: 259248800031,
			F: 452214089,
			S: ""
		}, {
			A: 259277000010,
			F: 454083964,
			S: ""
		}, {
			A: 259411600011,
			F: 454174942,
			S: ""
		}, {
			A: 259759300011,
			F: 454029165,
			S: ""
		}, {
			A: 259899200016,
			F: 364703077,
			S: ""
		}, {
			A: 260118400013,
			F: 371663771,
			S: ""
		}, {
			A: 260299300015,
			F: "",
			S: ""
		}, {
			A: 260313500014,
			F: 454625248,
			S: ""
		}, {
			A: 260340400013,
			F: 272243715,
			S: ""
		}, {
			A: 260428700017,
			F: 271505628,
			S: ""
		}, {
			A: 260478700018,
			F: 454748131,
			S: ""
		}, {
			A: 260568400013,
			F: 271649596,
			S: ""
		}, {
			A: 260581200015,
			F: 454284313,
			S: ""
		}, {
			A: 260677900018,
			F: 454711394,
			S: ""
		}, {
			A: 260739200018,
			F: 454838901,
			S: ""
		}, {
			A: 260800600016,
			F: 454869740,
			S: ""
		}, {
			A: 260858200018,
			F: 800798299,
			S: ""
		}, {
			A: 261062400011,
			F: 300587174,
			S: ""
		}, {
			A: 261268600017,
			F: "",
			S: 4267
		}, {
			A: 261272000016,
			F: 453481519,
			S: ""
		}, {
			A: 261416000016,
			F: 454753171,
			S: ""
		}, {
			A: 261454600019,
			F: "",
			S: 7326
		}, {
			A: 261504200017,
			F: 943489422,
			S: ""
		}, {
			A: 261522600014,
			F: "",
			S: 2801
		}, {
			A: 261525400016,
			F: "",
			S: 5332
		}, {
			A: 261569800011,
			F: 454625845,
			S: ""
		}, {
			A: 261647500011,
			F: 455384424,
			S: ""
		}, {
			A: 261801700011,
			F: 455334556,
			S: ""
		}, {
			A: 261829700016,
			F: "",
			S: ""
		}, {
			A: 261935100010,
			F: 455413962,
			S: ""
		}, {
			A: 262078100014,
			F: 455454756,
			S: ""
		}, {
			A: 262134200019,
			F: 455465113,
			S: ""
		}, {
			A: 262144100012,
			F: 455485798,
			S: ""
		}, {
			A: 262177200012,
			F: 425240670,
			S: ""
		}, {
			A: 262190900015,
			F: 451032779,
			S: ""
		}, {
			A: 262420900010,
			F: 800803105,
			S: ""
		}, {
			A: 262573900019,
			F: 460554228,
			S: ""
		}, {
			A: 262725200018,
			F: 271791132,
			S: ""
		}, {
			A: 262725200026,
			F: 271791132,
			S: ""
		}, {
			A: 262843000015,
			F: "",
			S: 5620
		}, {
			A: 263109200019,
			F: 460726901,
			S: ""
		}, {
			A: 263213300017,
			F: "",
			S: 7326
		}, {
			A: 263396300011,
			F: 454067177,
			S: ""
		}, {
			A: 263825500015,
			F: 383887734,
			S: ""
		}, {
			A: 264112200018,
			F: 461167389,
			S: ""
		}, {
			A: 264163300017,
			F: 453366431,
			S: ""
		}, {
			A: 264308700019,
			F: 461228342,
			S: ""
		}, {
			A: 264406200016,
			F: 455132846,
			S: ""
		}, {
			A: 264608700011,
			F: 220129874,
			S: ""
		}, {
			A: 264664600011,
			F: 461405001,
			S: ""
		}, {
			A: 264685900014,
			F: "",
			S: 996
		}, {
			A: 264839400010,
			F: 800855236,
			S: ""
		}, {
			A: 264936900019,
			F: 611698668,
			S: ""
		}, {
			A: 264963800026,
			F: 300757083,
			S: ""
		}, {
			A: 264997300014,
			F: 461239250,
			S: ""
		}, {
			A: 265118900018,
			F: 461582548,
			S: ""
		}, {
			A: 265234600013,
			F: 460608002,
			S: ""
		}, {
			A: 265237600014,
			F: 461647284,
			S: ""
		}, {
			A: 265287500011,
			F: 461667878,
			S: ""
		}, {
			A: 265288200011,
			F: 461656832,
			S: ""
		}, {
			A: 265423800023,
			F: "",
			S: 1662
		}, {
			A: 265489600017,
			F: 461637820,
			S: ""
		}, {
			A: 265503800016,
			F: "",
			S: 6804
		}, {
			A: 265527800017,
			F: 461762877,
			S: ""
		}, {
			A: 265573500010,
			F: "",
			S: 3365
		}, {
			A: 265574900011,
			F: "",
			S: 3
		}, {
			A: 265575800011,
			F: "",
			S: 5588
		}, {
			A: 265592100014,
			F: 461830383,
			S: ""
		}, {
			A: 265670100018,
			F: 451844323,
			S: ""
		}, {
			A: 265748000015,
			F: 461884248,
			S: ""
		}, {
			A: 265805100013,
			F: 461717368,
			S: ""
		}, {
			A: 265808700011,
			F: 461689262,
			S: ""
		}, {
			A: 265969100014,
			F: "",
			S: 2359
		}, {
			A: 266011400019,
			F: 462003740,
			S: ""
		}, {
			A: 266012400012,
			F: "",
			S: 9020
		}, {
			A: 266070000016,
			F: 462022710,
			S: ""
		}, {
			A: 266136500015,
			F: 462014042,
			S: ""
		}, {
			A: 266232100010,
			F: 461687368,
			S: ""
		}, {
			A: 266348900013,
			F: "",
			S: 8922
		}, {
			A: 266584900016,
			F: 462153499,
			S: ""
		}, {
			A: 266621100017,
			F: 462082383,
			S: ""
		}, {
			A: 266702600014,
			F: 383896218,
			S: ""
		}, {
			A: 266831900016,
			F: 371639165,
			S: ""
		}, {
			A: 266892000018,
			F: 453119629,
			S: ""
		}, {
			A: 266946000019,
			F: 462264757,
			S: ""
		}, {
			A: 267060400012,
			F: "",
			S: 7162
		}, {
			A: 267082300011,
			F: 800454162,
			S: ""
		}, {
			A: 267101100011,
			F: 462167998,
			S: ""
		}, {
			A: 267115000019,
			F: 462362422,
			S: ""
		}, {
			A: 267192000013,
			F: 453138621,
			S: ""
		}, {
			A: 267316600022,
			F: 461699952,
			S: ""
		}, {
			A: 267513500013,
			F: 462236772,
			S: ""
		}, {
			A: 267530600013,
			F: "",
			S: ""
		}, {
			A: 267530800012,
			F: "",
			S: ""
		}, {
			A: 267587600010,
			F: 462454604,
			S: ""
		}, {
			A: 267670800012,
			F: "",
			S: ""
		}, {
			A: 267671000010,
			F: "",
			S: ""
		}, {
			A: 267746300014,
			F: 462575106,
			S: ""
		}, {
			A: 267747100019,
			F: 462560534,
			S: ""
		}, {
			A: 267859400015,
			F: 462632582,
			S: ""
		}, {
			A: 267879600011,
			F: 462616047,
			S: ""
		}, {
			A: 267948200011,
			F: "",
			S: 4393
		}, {
			A: 268018000019,
			F: 462693378,
			S: ""
		}, {
			A: 268026000010,
			F: 462453875,
			S: ""
		}, {
			A: 268076300014,
			F: 462746541,
			S: ""
		}, {
			A: 268081000011,
			F: 462719561,
			S: ""
		}, {
			A: 268179700053,
			F: 570738077,
			S: ""
		}, {
			A: 268181700010,
			F: 471692575,
			S: ""
		}, {
			A: 268232400016,
			F: 462800614,
			S: ""
		}, {
			A: 268238200019,
			F: 462686631,
			S: ""
		}, {
			A: 268242600013,
			F: "",
			S: ""
		}, {
			A: 268243000010,
			F: "",
			S: ""
		}, {
			A: 268243200019,
			F: "",
			S: ""
		}, {
			A: 268246000011,
			F: "",
			S: ""
		}, {
			A: 268248100012,
			F: "",
			S: ""
		}, {
			A: 268266800013,
			F: 462656415,
			S: ""
		}, {
			A: 268343000017,
			F: 462844654,
			S: ""
		}, {
			A: 268681000014,
			F: 270279451,
			S: ""
		}, {
			A: 268775400016,
			F: 462993349,
			S: ""
		}, {
			A: 268941500016,
			F: 272388423,
			S: ""
		}, {
			A: 268975000012,
			F: 455512006,
			S: ""
		}, {
			A: 269033000013,
			F: 462750223,
			S: ""
		}, {
			A: 269093900013,
			F: 463126589,
			S: ""
		}, {
			A: 269489000015,
			F: 450441610,
			S: ""
		}, {
			A: 269511800012,
			F: 455122110,
			S: ""
		}, {
			A: 269627200012,
			F: 273630543,
			S: ""
		}, {
			A: 269793500016,
			F: 463451745,
			S: ""
		}, {
			A: 269854500014,
			F: "",
			S: 1219
		}, {
			A: 269857200011,
			F: "",
			S: 5002
		}, {
			A: 269874000018,
			F: 463491928,
			S: ""
		}, {
			A: 269874200017,
			F: 800946688,
			S: ""
		}, {
			A: 270039100026,
			F: "",
			S: 1578
		}, {
			A: 270050500010,
			F: 463575902,
			S: ""
		}, {
			A: 270068100019,
			F: 451088810,
			S: ""
		}, {
			A: 270214100018,
			F: 463653793,
			S: ""
		}, {
			A: 270404600017,
			F: 463746235,
			S: ""
		}, {
			A: 270430800016,
			F: 463748419,
			S: ""
		}, {
			A: 270440700010,
			F: 463693339,
			S: ""
		}, {
			A: 270583400017,
			F: 463805968,
			S: ""
		}, {
			A: 270626300011,
			F: 463820496,
			S: ""
		}, {
			A: 270818100016,
			F: 455002458,
			S: ""
		}, {
			A: 270982200013,
			F: 463962990,
			S: ""
		}, {
			A: 271656400017,
			F: 464216060,
			S: ""
		}, {
			A: 271671500010,
			F: "",
			S: 7607
		}, {
			A: 271684000016,
			F: 464226734,
			S: ""
		}, {
			A: 271724600011,
			F: 464237591,
			S: ""
		}, {
			A: 271983600011,
			F: 464373430,
			S: ""
		}, {
			A: 271991800011,
			F: 464335259,
			S: ""
		}, {
			A: 272057200014,
			F: "",
			S: 1499
		}, {
			A: 272059100017,
			F: 464373644,
			S: ""
		}, {
			A: 272102300017,
			F: 468841681,
			S: ""
		}, {
			A: 272267600015,
			F: 468644301,
			S: ""
		}, {
			A: 272278600017,
			F: "",
			S: ""
		}, {
			A: 272325900016,
			F: 464519832,
			S: ""
		}, {
			A: 272368800015,
			F: 464503145,
			S: ""
		}, {
			A: 272378800013,
			F: 464555227,
			S: ""
		}, {
			A: 272385400012,
			F: 464558649,
			S: ""
		}, {
			A: 272397200019,
			F: "",
			S: 9452
		}, {
			A: 272644000010,
			F: 464662478,
			S: ""
		}, {
			A: 272644200019,
			F: 464636879,
			S: ""
		}, {
			A: 272647200010,
			F: "",
			S: 1472
		}, {
			A: 272697400010,
			F: 462218260,
			S: ""
		}, {
			A: 272700900011,
			F: "",
			S: 8129
		}, {
			A: 272762200015,
			F: 464587603,
			S: ""
		}, {
			A: 272997800010,
			F: 464775782,
			S: ""
		}, {
			A: 273035600015,
			F: 465305802,
			S: ""
		}, {
			A: 273101300010,
			F: 464849340,
			S: ""
		}, {
			A: 273127600011,
			F: "",
			S: ""
		}, {
			A: 273220500019,
			F: 464884875,
			S: ""
		}, {
			A: 273239200016,
			F: 464881287,
			S: ""
		}, {
			A: 273524800019,
			F: 464985363,
			S: ""
		}, {
			A: 273544700011,
			F: 464968407,
			S: ""
		}, {
			A: 273612100019,
			F: 464706988,
			S: ""
		}, {
			A: 273679900010,
			F: 464901044,
			S: ""
		}, {
			A: 273692200019,
			F: "",
			S: 2089
		}, {
			A: 273712700013,
			F: 465062169,
			S: ""
		}, {
			A: 273792200016,
			F: 320434233,
			S: ""
		}, {
			A: 273934700011,
			F: "",
			S: 774
		}, {
			A: 273962700019,
			F: 465135086,
			S: 2932
		}, {
			A: 274168100011,
			F: 465163104,
			S: ""
		}, {
			A: 274266400015,
			F: "",
			S: 7014
		}, {
			A: 274300300017,
			F: 465199253,
			S: ""
		}, {
			A: 274425900016,
			F: 465286159,
			S: ""
		}, {
			A: 274460200019,
			F: 465303244,
			S: ""
		}, {
			A: 274515000014,
			F: 465263534,
			S: ""
		}, {
			A: 274533000013,
			F: 800691333,
			S: ""
		}, {
			A: 274534400015,
			F: "",
			S: 682
		}, {
			A: 274534500010,
			F: "",
			S: 6817
		}, {
			A: 274546600010,
			F: 730167077,
			S: ""
		}, {
			A: 274616700017,
			F: "",
			S: 1385
		}, {
			A: 274800300013,
			F: "",
			S: 1273
		}, {
			A: 274803800017,
			F: 465367706,
			S: ""
		}, {
			A: 274914700011,
			F: 465469447,
			S: ""
		}, {
			A: 275242100017,
			F: 465590317,
			S: ""
		}, {
			A: 275396400013,
			F: "",
			S: 7823
		}, {
			A: 275411900010,
			F: 470978022,
			S: ""
		}, {
			A: 275569700018,
			F: "",
			S: 6723
		}, {
			A: 275685800011,
			F: "",
			S: 922
		}, {
			A: 275805100019,
			F: "",
			S: 9984
		}, {
			A: 275810000014,
			F: 471120004,
			S: ""
		}, {
			A: 275826000014,
			F: 471144387,
			S: ""
		}, {
			A: 275871500010,
			F: "",
			S: 7540
		}, {
			A: 275901300011,
			F: "",
			S: 4659
		}, {
			A: 275947000011,
			F: 470970148,
			S: ""
		}, {
			A: 276011100011,
			F: 471032116,
			S: ""
		}, {
			A: 276074700018,
			F: 383934607,
			S: ""
		}, {
			A: 276100800018,
			F: 471288276,
			S: ""
		}, {
			A: 276263600016,
			F: 465662150,
			S: ""
		}, {
			A: 276535600011,
			F: "",
			S: ""
		}, {
			A: 276558600018,
			F: 471456917,
			S: ""
		}, {
			A: 276623300019,
			F: 471387364,
			S: ""
		}, {
			A: 276642000018,
			F: "",
			S: 7300
		}, {
			A: 276701100013,
			F: 465194022,
			S: ""
		}, {
			A: 276762800018,
			F: "",
			S: 9895
		}, {
			A: 276765600010,
			F: 320169150,
			S: ""
		}, {
			A: 276773000013,
			F: "",
			S: ""
		}, {
			A: 277023100012,
			F: 465750950,
			S: ""
		}, {
			A: 277030700017,
			F: 821579655,
			S: ""
		}, {
			A: 277044600015,
			F: 471651674,
			S: ""
		}, {
			A: 277165200014,
			F: "",
			S: 5465
		}, {
			A: 277241700013,
			F: 471730946,
			S: ""
		}, {
			A: 277262800018,
			F: "",
			S: 9229
		}, {
			A: 277268300017,
			F: 464888580,
			S: ""
		}, {
			A: 277492300014,
			F: 471661996,
			S: ""
		}, {
			A: 277513400014,
			F: 471839260,
			S: ""
		}, {
			A: 277520300017,
			F: 471727287,
			S: ""
		}, {
			A: 277548200018,
			F: 471858502,
			S: ""
		}, {
			A: 277623500014,
			F: 471953318,
			S: ""
		}, {
			A: 277734000011,
			F: 471519044,
			S: ""
		}, {
			A: 277774200012,
			F: 613779452,
			S: ""
		}, {
			A: 277783900019,
			F: 471158220,
			S: ""
		}, {
			A: 277853600018,
			F: 471501413,
			S: ""
		}, {
			A: 277863300012,
			F: 471792487,
			S: ""
		}, {
			A: 277889700019,
			F: "",
			S: 6302
		}, {
			A: 277899400013,
			F: 471986468,
			S: ""
		}, {
			A: 277904200010,
			F: "",
			S: 3524
		}, {
			A: 277909200018,
			F: "",
			S: 1654
		}, {
			A: 277962100017,
			F: 472032122,
			S: ""
		}, {
			A: 278011700011,
			F: "",
			S: 1661
		}, {
			A: 278027800015,
			F: "",
			S: 5257
		}, {
			A: 278034300010,
			F: 472048580,
			S: ""
		}, {
			A: 278043900011,
			F: 472046673,
			S: ""
		}, {
			A: 278044100019,
			F: 472047646,
			S: ""
		}, {
			A: 278062500016,
			F: 472029142,
			S: ""
		}, {
			A: 278086500017,
			F: 472085810,
			S: ""
		}, {
			A: 278086900015,
			F: 472085720,
			S: ""
		}, {
			A: 278093000011,
			F: 901035693,
			S: ""
		}, {
			A: 278115500013,
			F: 472078040,
			S: ""
		}, {
			A: 278169200015,
			F: 464743061,
			S: ""
		}, {
			A: 278240500017,
			F: 471545734,
			S: ""
		}, {
			A: 278256100019,
			F: "",
			S: 5041
		}, {
			A: 278295600011,
			F: 472151242,
			S: ""
		}, {
			A: 278353100015,
			F: 472189673,
			S: ""
		}, {
			A: 278353400019,
			F: 472138174,
			S: ""
		}, {
			A: 278437800012,
			F: 472218439,
			S: ""
		}, {
			A: 278450700019,
			F: 471975501,
			S: ""
		}, {
			A: 278484700018,
			F: "",
			S: 5515
		}, {
			A: 278538400015,
			F: 472127659,
			S: ""
		}, {
			A: 278539100015,
			F: 471441229,
			S: ""
		}, {
			A: 278546000018,
			F: "",
			S: ""
		}, {
			A: 278565200010,
			F: 450655847,
			S: ""
		}, {
			A: 278704400011,
			F: 472350723,
			S: ""
		}, {
			A: 278705900017,
			F: 472221697,
			S: ""
		}, {
			A: 278778100019,
			F: "",
			S: 2382
		}, {
			A: 278864800015,
			F: "",
			S: 4124
		}, {
			A: 278877800014,
			F: "",
			S: 4162
		}, {
			A: 278992500016,
			F: 472469947,
			S: ""
		}, {
			A: 279021700015,
			F: 464991353,
			S: ""
		}, {
			A: 279062400018,
			F: 472430243,
			S: ""
		}, {
			A: 279101000014,
			F: 472514147,
			S: ""
		}, {
			A: 279141200016,
			F: 472426309,
			S: ""
		}, {
			A: 279163600018,
			F: 472202288,
			S: ""
		}, {
			A: 279177700015,
			F: 472543234,
			S: ""
		}, {
			A: 279185900015,
			F: 464617838,
			S: ""
		}, {
			A: 279227000010,
			F: 472378900,
			S: ""
		}, {
			A: 279351900011,
			F: 472424455,
			S: ""
		}, {
			A: 279416700014,
			F: 472620809,
			S: ""
		}, {
			A: 279416800019,
			F: 472621341,
			S: ""
		}, {
			A: 279418100014,
			F: 472652190,
			S: ""
		}, {
			A: 279504600011,
			F: "",
			S: ""
		}, {
			A: 279506800018,
			F: 472479473,
			S: ""
		}, {
			A: 279523800013,
			F: "",
			S: ""
		}, {
			A: 279524300014,
			F: 812638946,
			S: ""
		}, {
			A: 279551000014,
			F: 821617066,
			S: ""
		}, {
			A: 279603000018,
			F: 472481252,
			S: ""
		}, {
			A: 279652900016,
			F: 472431713,
			S: ""
		}, {
			A: 279664700012,
			F: 472673827,
			S: ""
		}, {
			A: 279667200011,
			F: 472717628,
			S: ""
		}, {
			A: 279677700011,
			F: "",
			S: ""
		}, {
			A: 279678100018,
			F: 812565236,
			S: ""
		}, {
			A: 279678400011,
			F: "",
			S: ""
		}, {
			A: 279678800010,
			F: "",
			S: ""
		}, {
			A: 279679100011,
			F: "",
			S: ""
		}, {
			A: 279683600011,
			F: "",
			S: ""
		}, {
			A: 279684000017,
			F: "",
			S: ""
		}, {
			A: 279684300011,
			F: "",
			S: ""
		}, {
			A: 279685300014,
			F: "",
			S: ""
		}, {
			A: 279685700012,
			F: "",
			S: ""
		}, {
			A: 279686400012,
			F: "",
			S: ""
		}, {
			A: 279686600011,
			F: "",
			S: ""
		}, {
			A: 279686800011,
			F: "",
			S: ""
		}, {
			A: 279687100012,
			F: 812446429,
			S: ""
		}, {
			A: 279687400016,
			F: "",
			S: ""
		}, {
			A: 279688000011,
			F: 880402940,
			S: ""
		}, {
			A: 279688100016,
			F: 473982673,
			S: ""
		}, {
			A: 279701300011,
			F: 472586176,
			S: ""
		}, {
			A: 279738300011,
			F: 472746678,
			S: ""
		}, {
			A: 279754300013,
			F: "",
			S: ""
		}, {
			A: 279859400013,
			F: 472780430,
			S: ""
		}, {
			A: 279869500016,
			F: 472806665,
			S: ""
		}, {
			A: 279888400014,
			F: 472807281,
			S: ""
		}, {
			A: 279901200020,
			F: 472809111,
			S: ""
		}, {
			A: 279932900011,
			F: 472843219,
			S: ""
		}, {
			A: 279983300019,
			F: 471167718,
			S: ""
		}, {
			A: 280028500010,
			F: "",
			S: 6965
		}, {
			A: 280065600016,
			F: 472875741,
			S: ""
		}, {
			A: 280180400012,
			F: 460104566,
			S: ""
		}, {
			A: 280231000014,
			F: 472790660,
			S: ""
		}, {
			A: 280250900018,
			F: 472822084,
			S: ""
		}, {
			A: 280267000011,
			F: 472971630,
			S: ""
		}, {
			A: 280267200010,
			F: 472927228,
			S: ""
		}, {
			A: 280357500012,
			F: 464190197,
			S: ""
		}, {
			A: 280432000012,
			F: 472861238,
			S: ""
		}, {
			A: 280436800013,
			F: 473021231,
			S: ""
		}, {
			A: 280443700016,
			F: 472979633,
			S: ""
		}, {
			A: 280474800019,
			F: 473049963,
			S: ""
		}, {
			A: 280490800011,
			F: 472296500,
			S: ""
		}, {
			A: 280492300015,
			F: "",
			S: ""
		}, {
			A: 280512500016,
			F: 473067343,
			S: ""
		}, {
			A: 280512900014,
			F: "",
			S: 6472
		}, {
			A: 280542200017,
			F: 472878464,
			S: ""
		}, {
			A: 280548500012,
			F: 473053289,
			S: ""
		}, {
			A: 280631700015,
			F: 472999531,
			S: ""
		}, {
			A: 280676900015,
			F: 473134034,
			S: ""
		}, {
			A: 280713600019,
			F: 473129390,
			S: ""
		}, {
			A: 280756200014,
			F: "",
			S: ""
		}, {
			A: 280799900010,
			F: 473377267,
			S: ""
		}, {
			A: 280815600013,
			F: 473005667,
			S: ""
		}, {
			A: 280849800011,
			F: 364802071,
			S: ""
		}, {
			A: 280969800015,
			F: 472976571,
			S: ""
		}, {
			A: 281085500014,
			F: 473251302,
			S: ""
		}, {
			A: 281140500011,
			F: 473247832,
			S: ""
		}, {
			A: 281220900010,
			F: 473211214,
			S: ""
		}, {
			A: 281233800014,
			F: "",
			S: 1446
		}, {
			A: 281280500029,
			F: "",
			S: 2711
		}, {
			A: 281516600011,
			F: 473371569,
			S: ""
		}, {
			A: 281739500019,
			F: 472660109,
			S: ""
		}, {
			A: 281769800017,
			F: 473475850,
			S: ""
		}, {
			A: 281779400017,
			F: 473481436,
			S: ""
		}, {
			A: 281841800019,
			F: 473246063,
			S: ""
		}, {
			A: 281873600011,
			F: 473223801,
			S: ""
		}, {
			A: 281918900011,
			F: 473326617,
			S: ""
		}, {
			A: 281984700015,
			F: 300863492,
			S: ""
		}, {
			A: 282094800019,
			F: "",
			S: ""
		}, {
			A: 282151000016,
			F: 473664214,
			S: ""
		}, {
			A: 282244900017,
			F: 208221157,
			S: ""
		}, {
			A: 282313100010,
			F: "",
			S: 6047
		}, {
			A: 282376500018,
			F: 473393229,
			S: ""
		}, {
			A: 282437400011,
			F: 473506745,
			S: ""
		}, {
			A: 282439300014,
			F: 473811752,
			S: ""
		}, {
			A: 282504400013,
			F: 272653799,
			S: ""
		}, {
			A: 282533400014,
			F: 490916554,
			S: ""
		}, {
			A: 282669000010,
			F: "",
			S: 8152
		}, {
			A: 282733500013,
			F: 473962563,
			S: ""
		}, {
			A: 282736700013,
			F: "",
			S: 3997
		}, {
			A: 282745500019,
			F: 473968375,
			S: ""
		}, {
			A: 282746100014,
			F: 473968753,
			S: ""
		}, {
			A: 282796500013,
			F: "",
			S: 7249
		}, {
			A: 282814200014,
			F: 474152015,
			S: ""
		}, {
			A: 282843200015,
			F: 473500748,
			S: ""
		}, {
			A: 282926900019,
			F: 473421130,
			S: ""
		}, {
			A: 283031500011,
			F: 474065382,
			S: ""
		}, {
			A: 283127000010,
			F: 474120446,
			S: ""
		}, {
			A: 283224800012,
			F: "",
			S: 1385
		}, {
			A: 283238100013,
			F: 473786014,
			S: ""
		}, {
			A: 283255500017,
			F: "",
			S: 3879
		}, {
			A: 283260900015,
			F: 474151811,
			S: ""
		}, {
			A: 283333800014,
			F: 474188785,
			S: ""
		}, {
			A: 283377200014,
			F: 474181706,
			S: ""
		}, {
			A: 283390200015,
			F: 471155986,
			S: ""
		}, {
			A: 283395500017,
			F: 474123195,
			S: ""
		}, {
			A: 283414200011,
			F: 472696504,
			S: ""
		}, {
			A: 283519700010,
			F: 474260138,
			S: ""
		}, {
			A: 283519900019,
			F: "",
			S: ""
		}, {
			A: 283531400013,
			F: 474237733,
			S: ""
		}, {
			A: 283572500014,
			F: "",
			S: 2766
		}, {
			A: 283639300015,
			F: "",
			S: ""
		}, {
			A: 283642400012,
			F: "",
			S: ""
		}, {
			A: 283642900015,
			F: "",
			S: ""
		}, {
			A: 283655000013,
			F: "",
			S: ""
		}, {
			A: 283656300011,
			F: "",
			S: ""
		}, {
			A: 283659700010,
			F: "",
			S: ""
		}, {
			A: 283680800016,
			F: "",
			S: ""
		}, {
			A: 283687000015,
			F: "",
			S: ""
		}, {
			A: 283687400013,
			F: "",
			S: ""
		}, {
			A: 283699200010,
			F: "",
			S: 3307
		}, {
			A: 283744300012,
			F: 474347810,
			S: ""
		}, {
			A: 283753500016,
			F: "",
			S: ""
		}, {
			A: 283759000015,
			F: 814007132,
			S: ""
		}, {
			A: 283759500018,
			F: 474368213,
			S: ""
		}, {
			A: 283762600015,
			F: "",
			S: ""
		}, {
			A: 283764600012,
			F: "",
			S: ""
		}, {
			A: 283764900016,
			F: "",
			S: ""
		}, {
			A: 283767000016,
			F: "",
			S: ""
		}, {
			A: 283776900011,
			F: "",
			S: ""
		}, {
			A: 283777300018,
			F: "",
			S: ""
		}, {
			A: 283777500017,
			F: "",
			S: ""
		}, {
			A: 283781800017,
			F: "",
			S: ""
		}, {
			A: 283781900011,
			F: 462533266,
			S: ""
		}, {
			A: 283782200013,
			F: "",
			S: ""
		}, {
			A: 283782400012,
			F: "",
			S: ""
		}, {
			A: 283784100016,
			F: "",
			S: ""
		}, {
			A: 283831200016,
			F: "",
			S: ""
		}, {
			A: 283832300014,
			F: "",
			S: ""
		}, {
			A: 283832900011,
			F: "",
			S: ""
		}, {
			A: 283838700014,
			F: "",
			S: ""
		}, {
			A: 283840300015,
			F: "",
			S: ""
		}, {
			A: 283860200017,
			F: "",
			S: ""
		}, {
			A: 283862200014,
			F: 814007192,
			S: ""
		}, {
			A: 283862400013,
			F: "",
			S: ""
		}, {
			A: 283862500018,
			F: "",
			S: ""
		}, {
			A: 283862700017,
			F: 812031955,
			S: ""
		}, {
			A: 283863100013,
			F: 821227749,
			S: ""
		}, {
			A: 283863200018,
			F: "",
			S: ""
		}, {
			A: 283865100011,
			F: "",
			S: ""
		}, {
			A: 283870600013,
			F: 813566475,
			S: ""
		}, {
			A: 283871000010,
			F: "",
			S: ""
		}, {
			A: 283871200019,
			F: "",
			S: ""
		}, {
			A: 283871300013,
			F: "",
			S: ""
		}, {
			A: 283872000013,
			F: "",
			S: ""
		}, {
			A: 283872800010,
			F: "",
			S: ""
		}, {
			A: 283873000017,
			F: "",
			S: ""
		}, {
			A: 283875500017,
			F: 474360424,
			S: ""
		}, {
			A: 283878700017,
			F: 474104499,
			S: ""
		}, {
			A: 283904300014,
			F: "",
			S: ""
		}, {
			A: 283904500013,
			F: "",
			S: ""
		}, {
			A: 283904800017,
			F: 474407180,
			S: ""
		}, {
			A: 283905800011,
			F: 812537492,
			S: ""
		}, {
			A: 283906100012,
			F: "",
			S: ""
		}, {
			A: 283906200017,
			F: "",
			S: ""
		}, {
			A: 283906600015,
			F: 811651602,
			S: ""
		}, {
			A: 283906900019,
			F: "",
			S: ""
		}, {
			A: 283907500014,
			F: "",
			S: ""
		}, {
			A: 283907700013,
			F: "",
			S: ""
		}, {
			A: 283911600015,
			F: "",
			S: ""
		}, {
			A: 283916800012,
			F: "",
			S: ""
		}, {
			A: 283916900017,
			F: 823530358,
			S: ""
		}, {
			A: 283917000010,
			F: "",
			S: ""
		}, {
			A: 283917600017,
			F: "",
			S: ""
		}, {
			A: 283980000011,
			F: 474462373,
			S: ""
		}, {
			A: 283985800016,
			F: 474469425,
			S: ""
		}, {
			A: 284160800010,
			F: "",
			S: ""
		}, {
			A: 284170900012,
			F: 474539411,
			S: ""
		}, {
			A: 284183400019,
			F: "",
			S: 3107
		}, {
			A: 284342500011,
			F: 473848771,
			S: ""
		}, {
			A: 284343000012,
			F: 474922986,
			S: ""
		}, {
			A: 284357700017,
			F: "",
			S: ""
		}, {
			A: 284374600018,
			F: "",
			S: 2536
		}, {
			A: 284379300012,
			F: "",
			S: 6587
		}, {
			A: 284451500013,
			F: 474612017,
			S: ""
		}, {
			A: 284519500017,
			F: 474366992,
			S: ""
		}, {
			A: 284533100013,
			F: 474047740,
			S: ""
		}, {
			A: 284533300012,
			F: 473716896,
			S: ""
		}, {
			A: 284621100015,
			F: 474702724,
			S: ""
		}, {
			A: 284625400013,
			F: 474569368,
			S: ""
		}, {
			A: 284625400030,
			F: 474569368,
			S: ""
		}, {
			A: 284664000014,
			F: 474668106,
			S: ""
		}, {
			A: 284822600016,
			F: 474756666,
			S: ""
		}, {
			A: 284979300016,
			F: 472496491,
			S: ""
		}, {
			A: 285024600011,
			F: 383955949,
			S: ""
		}, {
			A: 285025700010,
			F: 474081580,
			S: ""
		}, {
			A: 285042200012,
			F: 352519143,
			S: ""
		}, {
			A: 285070400019,
			F: "",
			S: ""
		}, {
			A: 285079300017,
			F: 474896225,
			S: ""
		}, {
			A: 285196700018,
			F: "",
			S: 962
		}, {
			A: 285242000018,
			F: 300871636,
			S: ""
		}, {
			A: 285262900015,
			F: 462805755,
			S: ""
		}, {
			A: 285308000014,
			F: 474838127,
			S: ""
		}, {
			A: 285336300015,
			F: 474995902,
			S: ""
		}, {
			A: 285401200015,
			F: 474996551,
			S: ""
		}, {
			A: 285414300019,
			F: "",
			S: 471
		}, {
			A: 285448900015,
			F: "",
			S: 8179
		}, {
			A: 285462700011,
			F: "",
			S: 335
		}, {
			A: 285510700010,
			F: 475048622,
			S: ""
		}, {
			A: 285574500014,
			F: "",
			S: ""
		}, {
			A: 285574700013,
			F: "",
			S: ""
		}, {
			A: 285574900012,
			F: "",
			S: ""
		}, {
			A: 285575100010,
			F: "",
			S: ""
		}, {
			A: 285579400018,
			F: "",
			S: ""
		}, {
			A: 285581500011,
			F: "",
			S: ""
		}, {
			A: 285582800019,
			F: 474849290,
			S: ""
		}, {
			A: 285606300012,
			F: "",
			S: ""
		}, {
			A: 285607800019,
			F: "",
			S: ""
		}, {
			A: 285608000016,
			F: "",
			S: ""
		}, {
			A: 285615200012,
			F: "",
			S: ""
		}, {
			A: 285616900018,
			F: "",
			S: ""
		}, {
			A: 285618000014,
			F: "",
			S: ""
		}, {
			A: 285626300019,
			F: "",
			S: ""
		}, {
			A: 285626900016,
			F: "",
			S: ""
		}, {
			A: 285627100013,
			F: "",
			S: ""
		}, {
			A: 285627600016,
			F: "",
			S: ""
		}, {
			A: 285628000012,
			F: "",
			S: ""
		}, {
			A: 285632400017,
			F: "",
			S: ""
		}, {
			A: 285634700018,
			F: "",
			S: ""
		}, {
			A: 285634900017,
			F: "",
			S: ""
		}, {
			A: 285635100014,
			F: "",
			S: ""
		}, {
			A: 285635500012,
			F: "",
			S: ""
		}, {
			A: 285635600017,
			F: "",
			S: ""
		}, {
			A: 285636200012,
			F: "",
			S: ""
		}, {
			A: 285636900014,
			F: "",
			S: ""
		}, {
			A: 285650000018,
			F: "",
			S: ""
		}, {
			A: 285651400010,
			F: "",
			S: ""
		}, {
			A: 285652900016,
			F: "",
			S: ""
		}, {
			A: 285654700014,
			F: 473394856,
			S: ""
		}, {
			A: 285677800016,
			F: "",
			S: ""
		}, {
			A: 285702300015,
			F: "",
			S: ""
		}, {
			A: 285702500014,
			F: "",
			S: ""
		}, {
			A: 285702800018,
			F: "",
			S: ""
		}, {
			A: 285703400013,
			F: "",
			S: ""
		}, {
			A: 285704300012,
			F: "",
			S: ""
		}, {
			A: 285706000016,
			F: "",
			S: ""
		}, {
			A: 285707000010,
			F: "",
			S: ""
		}, {
			A: 285765400010,
			F: 475104803,
			S: ""
		}, {
			A: 285825000016,
			F: "",
			S: 1941
		}, {
			A: 285873700011,
			F: 475207051,
			S: ""
		}, {
			A: 285873800016,
			F: 475200949,
			S: ""
		}, {
			A: 285878900019,
			F: 474996114,
			S: ""
		}, {
			A: 285900300012,
			F: "",
			S: ""
		}, {
			A: 285916500011,
			F: 475073951,
			S: ""
		}, {
			A: 285930500016,
			F: "",
			S: ""
		}, {
			A: 285930600011,
			F: "",
			S: ""
		}, {
			A: 285931200016,
			F: 475250588,
			S: ""
		}, {
			A: 285938100017,
			F: "",
			S: ""
		}, {
			A: 285942200018,
			F: "",
			S: ""
		}, {
			A: 285969300014,
			F: "",
			S: ""
		}, {
			A: 285971400018,
			F: 475258720,
			S: ""
		}, {
			A: 285976100012,
			F: 814079522,
			S: ""
		}, {
			A: 285986100011,
			F: 813024538,
			S: ""
		}, {
			A: 285988500016,
			F: 475178821,
			S: ""
		}, {
			A: 285999700017,
			F: "",
			S: ""
		}, {
			A: 286006800018,
			F: "",
			S: ""
		}, {
			A: 286033400013,
			F: "",
			S: ""
		}, {
			A: 286033900016,
			F: "",
			S: ""
		}, {
			A: 286034200018,
			F: "",
			S: ""
		}, {
			A: 286036600013,
			F: "",
			S: ""
		}, {
			A: 286045800017,
			F: 475046820,
			S: ""
		}, {
			A: 286049300019,
			F: 475123396,
			S: ""
		}, {
			A: 286050900011,
			F: 474637230,
			S: ""
		}, {
			A: 286051200013,
			F: 474629511,
			S: ""
		}, {
			A: 286053300015,
			F: "",
			S: 3917
		}, {
			A: 286069600019,
			F: "",
			S: ""
		}, {
			A: 286070200016,
			F: "",
			S: ""
		}, {
			A: 286071100015,
			F: "",
			S: ""
		}, {
			A: 286076600016,
			F: "",
			S: ""
		}, {
			A: 286076900010,
			F: "",
			S: ""
		}, {
			A: 286077600010,
			F: "",
			S: ""
		}, {
			A: 286134800012,
			F: 474543014,
			S: ""
		}, {
			A: 286176200015,
			F: 475155389,
			S: ""
		}, {
			A: 286224300019,
			F: 475349119,
			S: ""
		}, {
			A: 286232800012,
			F: "",
			S: 3846
		}, {
			A: 286320400016,
			F: "",
			S: 7937
		}, {
			A: 286325000016,
			F: "",
			S: 3193
		}, {
			A: 286355100015,
			F: 475302089,
			S: ""
		}, {
			A: 286365300012,
			F: 475409775,
			S: ""
		}, {
			A: 286414700013,
			F: 475434137,
			S: ""
		}, {
			A: 286606900016,
			F: "",
			S: ""
		}, {
			A: 286608400011,
			F: 475501200,
			S: ""
		}, {
			A: 286722500017,
			F: 475552186,
			S: ""
		}, {
			A: 286775900017,
			F: 475582648,
			S: ""
		}, {
			A: 286846400011,
			F: "",
			S: 3637
		}, {
			A: 286883500017,
			F: 475630948,
			S: ""
		}, {
			A: 286931000013,
			F: 612664264,
			S: ""
		}, {
			A: 286932400015,
			F: 475096631,
			S: ""
		}, {
			A: 286995000017,
			F: 475539850,
			S: ""
		}, {
			A: 287031000014,
			F: 810701296,
			S: ""
		}, {
			A: 287092000017,
			F: "",
			S: ""
		}, {
			A: 287159300011,
			F: 475658326,
			S: ""
		}, {
			A: 287163300017,
			F: 275084855,
			S: ""
		}, {
			A: 289725600011,
			F: 811860164,
			S: ""
		}
	]
}

function invoiceFeeAllNew(itemCap) {
	//invoices all assessed fees with a status of NEW
	var vFeeSeqList = [];
	var vPaymentPeriodList = [];
	var vFeeList;	
	var vGetFeeResult = new Array();
	var vFeeNum;
	var vFeeSeq;
	var vFperiod
	vGetFeeResult = aa.fee.getFeeItems(itemCap);
	if (vGetFeeResult.getSuccess()) {
		vFeeList = vGetFeeResult.getOutput();
		for (vFeeNum in vFeeList)
			if (vFeeList[vFeeNum].getFeeitemStatus().equals("NEW")) {
				vFeeSeq = vFeeList[vFeeNum].getFeeSeqNbr();
				vFperiod = vFeeList[vFeeNum].getPaymentPeriod();
				vFeeSeqList.push(vFeeSeq);
				vPaymentPeriodList.push(vFperiod);
			}
		vInvoiceResult = aa.finance.createInvoice(itemCap, vFeeSeqList, vPaymentPeriodList);
		if (vInvoiceResult.getSuccess())
			logDebug("Invoicing assessed fee items is successful.");
		else
			logDebug("**ERROR: Invoicing the fee items assessed to app # " + itemCap.getCustomID() + " was not successful.  Reason: " + vInvoiceResult.getErrorMessage());
	}
}
function isAmendment() {
	var result = aa.cap.getProjectByChildCapID(capId, "Amendment", null);
	if (result.getSuccess()) {
		projectScriptModels = result.getOutput();
		if (projectScriptModels != null && projectScriptModels.length > 0) {
			return true;
		} else {
			return false;
		}
	}
	return false;
}
function isASITrue(val) {
	var sVal = String(val).toUpperCase();
    return (sVal.substr(0,1).equals("Y") || sVal.equals("CHECKED"));
}
function isMatchAddress(addressScriptModel1, addressScriptModel2)
{
	if (addressScriptModel1 == null || addressScriptModel2 == null)
	{
		return false;
	}
	var streetName1 = addressScriptModel1.getStreetName();
	var streetName2 = addressScriptModel2.getStreetName();
	if ((streetName1 == null && streetName2 != null) 
		|| (streetName1 != null && streetName2 == null))
	{
		return false;
	}
	if (streetName1 != null && !streetName1.equals(streetName2))
	{
		return false;
	}
	return true;
}
/*--------------------------------------------------------------------------------------------------------------------/
| Start ETW 12/3/14 isMatchPeople3_0
/--------------------------------------------------------------------------------------------------------------------* /
function isMatchPeople3_0(capContactScriptModel, capContactScriptModel2) {
    if (capContactScriptModel == null || capContactScriptModel2 == null) {
        return false;
    }

    var contactType1 = capContactScriptModel.getCapContactModel().getPeople().getContactType();
    var contactType2 = capContactScriptModel2.getCapContactModel().getPeople().getContactType();
    var firstName1 = capContactScriptModel.getCapContactModel().getPeople().getFirstName();
    var firstName2 = capContactScriptModel2.getCapContactModel().getPeople().getFirstName();
    var lastName1 = capContactScriptModel.getCapContactModel().getPeople().getLastName();
    var lastName2 = capContactScriptModel2.getCapContactModel().getPeople().getLastName();
    var fullName1 = capContactScriptModel.getCapContactModel().getPeople().getFullName();
    var fullName2 = capContactScriptModel2.getCapContactModel().getPeople().getFullName();

    if ((contactType1 == null && contactType2 != null) || (contactType1 != null && contactType2 == null)) {
        return false;
    }

    if (contactType1 != null && !contactType1.equals(contactType2)) {
        return false;
    }

    if ((firstName1 == null && firstName2 != null) || (firstName1 != null && firstName2 == null)) {
        return false;
    }

    if (firstName1 != null && !firstName1.equals(firstName2)) {
        return false;
    }

    if ((lastName1 == null && lastName2 != null) || (lastName1 != null && lastName2 == null)) {
        return false;
    }

    if (lastName1 != null && !lastName1.equals(lastName2)) {
        return false;
    }

    if ((fullName1 == null && fullName2 != null) || (fullName1 != null && fullName2 == null)) {
        return false;
    }

    if (fullName1 != null && !fullName1.equals(fullName2)) {
        return false;
    }

    return true;
}
/*--------------------------------------------------------------------------------------------------------------------/
| End ETW 12/3/14 isMatchPeople3_0
/--------------------------------------------------------------------------------------------------------------------* /
function loadASITable4ACA(tname, cap) {
	var gm = cap.getAppSpecificTableGroupModel()
	var ta = gm.getTablesMap();
	var tai = ta.values().iterator();
	while (tai.hasNext()) {
	  var tsm = tai.next();
	  var tn = tsm.getTableName();

      	  if (!tn.equals(tname)) continue;
	  if (tsm.rowIndex.isEmpty()) {
			logDebug("Couldn't load ASI Table " + tname + " it is empty");
			return false;
		}

   	  var tempObject = new Array();
	  var tempArray = new Array();

  	  var tsmfldi = tsm.getTableField().iterator();
	  var tsmcoli = tsm.getColumns().iterator();
	  var numrows = 1;

	  while (tsmfldi.hasNext())  // cycle through fields
		{
		if (!tsmcoli.hasNext())  // cycle through columns
			{
			var tsmcoli = tsm.getColumns().iterator();
			tempArray.push(tempObject);  // end of record
			var tempObject = new Array();  // clear the temp obj
			numrows++;
			}
		var tcol = tsmcoli.next();
		var tval = tsmfldi.next();
		var readOnly = 'N';
		var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
		tempObject[tcol.getColumnName()] = fieldInfo;

		}
		tempArray.push(tempObject);  // end of record
	  }
	  return tempArray;
	}

function recordHasNoAppliedConditionInType(pConditionType) {
	var appliedStatuses = ["Incomplete","Applied"];
	var condResult = aa.capCondition.getCapConditions(capId);

	//Convert to Uppercase for compare
	pConditionType = pConditionType.toUpperCase();

	if (condResult.getSuccess())
		var capConds = condResult.getOutput();
	else {
		logMessage("**ERROR: getting record conditions: " + condResult.getErrorMessage());
		logDebug("**ERROR: getting record conditions: " + condResult.getErrorMessage());
		return false;
	}

	for (cc in capConds) {
		var thisCond = capConds[cc];

		var conditionStatusType = "" + thisCond.getConditionStatus(); //"Applied" or "Not Applied"
		var ConditionType = thisCond.getConditionType().toUpperCase(); //Condition Group to compare the parameter to

		logDebug(ConditionType)
		logDebug(conditionStatusType);
		
		if (pConditionType == ConditionType && exists(conditionStatusType,appliedStatuses)) {
			logDebug("A Condition with Type " + pConditionType + " was found in the Status type of " + conditionStatusType + ". Return False.");
			return false;
		}
	}

	//Default, return true if no Applied conditions found for group
	logDebug("A Condition with Type " + pConditionType + " was NOT found in the Status type of " + conditionStatusType + ". Return True.");
	return true;
}
function replaceASITable4ACAPageFlow(destinationTableGroupModel, tableName, tableValueArray) // optional capId
{
	//  tableName is the name of the ASI table
	//  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
	//

	var itemCap = capId
		if (arguments.length > 3)
			itemCap = arguments[3]; // use cap ID specified in args

		var ta = destinationTableGroupModel.getTablesMap().values();
	var tai = ta.iterator();

	var found = false;
	while (tai.hasNext()) {
		var tsm = tai.next(); // com.accela.aa.aamain.appspectable.AppSpecificTableModel
		if (tsm.getTableName().equals(tableName)) {
			found = true;
			break;
		}
	}

	if (!found) {
		logDebug("cannot update asit for ACA, no matching table name");
		return false;
	}

	var i = -1; // row index counter
	if (tsm.getTableFields() != null) {
		i = 0 - tsm.getTableFields().size()
	}

	for (thisrow in tableValueArray) {
		var fld = aa.util.newArrayList(); // had to do this since it was coming up null.
		var fld_readonly = aa.util.newArrayList(); // had to do this since it was coming up null.
		var col = tsm.getColumns()
			var coli = col.iterator();
		while (coli.hasNext()) {
			var colname = coli.next();

			if (!tableValueArray[thisrow][colname.getColumnName()]) {
				logDebug("addToASITable: null or undefined value supplied for column " + colname.getColumnName() + ", setting to empty string");
				tableValueArray[thisrow][colname.getColumnName()] = "";
			}

			if (typeof(tableValueArray[thisrow][colname.getColumnName()].fieldValue) != "undefined") // we are passed an asiTablVal Obj
			{
				var args = new Array(tableValueArray[thisrow][colname.getColumnName()].fieldValue ? tableValueArray[thisrow][colname.getColumnName()].fieldValue : "", colname);
				var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
				fldToAdd.setRowIndex(i);
				fldToAdd.setFieldLabel(colname.getColumnName());
				fldToAdd.setFieldGroup(tableName.replace(/ /g, "\+"));
				fldToAdd.setReadOnly(tableValueArray[thisrow][colname.getColumnName()].readOnly.equals("Y"));
				fld.add(fldToAdd);
				fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);

			} else // we are passed a string
			{
				var args = new Array(tableValueArray[thisrow][colname.getColumnName()] ? tableValueArray[thisrow][colname.getColumnName()] : "", colname);
				var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
				fldToAdd.setRowIndex(i);
				fldToAdd.setFieldLabel(colname.getColumnName());
				fldToAdd.setFieldGroup(tableName.replace(/ /g, "\+"));
				fldToAdd.setReadOnly(false);
				fld.add(fldToAdd);
				fld_readonly.add("N");

			}
		}

		i--;

		if (tsm.getTableFields() == null) {
			tsm.setTableFields(fld);
		} else {
			if (thisrow == 0)
				tsm.setTableFields(fld);
			else
				tsm.getTableFields().addAll(fld);
		}

		if (tsm.getReadonlyField() == null) {
			tsm.setReadonlyField(fld_readonly); // set readonly field
		} else {
			if (thisrow == 0)
				tsm.setReadonlyField(fld_readonly);
			else
				tsm.getReadonlyField().addAll(fld_readonly);
		}
	} // end for loop

	tssm = tsm;
	return destinationTableGroupModel;
}

function resetAppSpecific4ACA(vASIField) {
	// uses capModel in this event
	var capASI = cap.getAppSpecificInfoGroups();
	if (!capASI) {
		logDebug("No ASI for the CapModel");
	} else {
		var i = cap.getAppSpecificInfoGroups().iterator();
		while (i.hasNext()) {
			var group = i.next();
			var fields = group.getFields();
			if (fields != null) {
				var iteFields = fields.iterator();
				while (iteFields.hasNext()) {
					var field = iteFields.next();
					if (field.getCheckboxDesc() == vASIField) {
						//get reference ASI configuration
						var vDisp = getRefASIACADisplayConfig(field.getGroupCode(), field.getCheckboxType(), field.getCheckboxDesc());
						if (vDisp != null) {
							field.setVchDispFlag(vDisp);
						}
						var vReq = getRefASIReqFlag(field.getGroupCode(), field.getCheckboxType(), field.getCheckboxDesc());
						if (vReq != null) {
							field.setAttributeValueReqFlag(vReq);
						}
						logDebug("Reset ASI: " + field.getCheckboxDesc() + " to reference configuration for ACA display and required.");
					}
				}
			}
		}
	}
}
/**
 * results workflow task and sets the status and performs next step based on configured status
 * @param wfstr
 * @param wfstat
 * @param wfcomment
 * @param wfnote
 * @returns {Boolean}
 * /
function resultWorkflowTask(wfstr, wfstat, wfcomment, wfnote) // optional process name
{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 5) {
		processName = arguments[4]; // subprocess
		useProcess = true;
	}

	var workflowResult = aa.workflow.getTaskItems(capId, wfstr, processName, null, null, null);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}

	if (!wfstat)
		wfstat = "NA";

	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
			var statObj = aa.workflow.getTaskStatus(fTask, wfstat);
			var dispo = "U";
			if (statObj.getSuccess()) {
				var status = statObj.getOutput();
				dispo = status.getResultAction();
			} else {
				logDebug("Could not get status action resulting to no change")
			}

			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.handleDisposition(capId, stepnumber, processID, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, dispo);
			else
				aa.workflow.handleDisposition(capId, stepnumber, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, dispo);

			logMessage("Resulting Workflow Task: " + wfstr + " with status " + wfstat);
			logDebug("Resulting Workflow Task: " + wfstr + " with status " + wfstat);
		}
	}
}
/*--------------------------------------------------------------------------------------------------------------------/
| Start ETW 06/13/14 Custom functions for runWTUA
/--------------------------------------------------------------------------------------------------------------------* /
function runWTUAForWFTaskWFStatus(vTaskName, vProcessID, vStepNum, vStatus, vCapId) {
	/*---------------------------------------------------------------------------------------------------------/
	| Function Intent:
	|              This function is designed to run the WorkflowTaskUpdateAfter (WTUA) script actions.
	|              for the CapId provided.
	| Call Example:
	|              runWTUAForWFTaskWFStatus('PRMT_TRADE','Application Acceptance','Accepted',capId)
	|
	| 11/13/2013 - Ewylam
	|              Version 1 Created
	|
	| Required parameters in order:
	|              vTaskName = Name of task to run the event for. string
	|			   vProcessID = Workflow process that contains the task. string
	|			   vStepNum = Step number of the task to run the event for. number
	|              vStatus = Status to rqun the event for. string
	|              vCapId = CapId object
	|
	| Optional paramaters:
	|              None
	/----------------------------------------------------------------------------------------------------------* /

	//Set Variables
	//Save the existing system variables so that they can be reset after the function
	var pvScriptName = vScriptName;
	var pvEventName = vEventName;
	var pprefix = ((typeof prefix === 'undefined') ? null : prefix);
	var pcapId = capId;
	var pcap = cap;
	var pcapIDString = capIDString;
	var pappTypeResult = appTypeResult;
	var pappTypeString = appTypeString;
	var pappTypeArray = appTypeArray;
	var pcapName = capName;
	var pcapStatus = capStatus;
	var pfileDateObj = fileDateObj;
	var pfileDate = fileDate;
	var pfileDateYYYYMMDD = fileDateYYYYMMDD;
	var pparcelArea = parcelArea;
	var pestValue = estValue;
	var pbalanceDue = balanceDue;
	var phouseCount = houseCount;
	var pfeesInvoicedTotal = feesInvoicedTotal;
	var pcapDetail = capDetail;
	var pAInfo = AInfo;
	var ppartialCap;
	if (typeof(partialCap) !== "undefined") {
		ppartialCap = partialCap;
	} else {
		ppartialCap = null;
	}
	var pparentCapId;
	if (typeof(parentCapId) !== "undefined") {
		pparentCapId = parentCapId;
	} else {
		pparentCapId = null;
	}
	var pCreatedByACA;
	if (typeof(CreatedByACA) !== "undefined") {
		pCreatedByACA = CreatedByACA;
	} else {
		CreatedByACA = 'N';
	}

	//WTUA Specific variables.
	var pwfTask = ((typeof wfTask === 'undefined') ? null : wfTask);
	var pwfTaskObj = ((typeof wfTaskObj === 'undefined') ? null : wfTaskObj);
	var pwfStatus = ((typeof wfStatus === 'undefined') ? null : wfStatus);
	var pwfDate = ((typeof wfDate === 'undefined') ? null : wfDate);
	var pwfDateMMDDYYYY = ((typeof wfDateMMDDYYYY === 'undefined') ? null : wfDateMMDDYYYY);
	var pwfProcessID = ((typeof wfProcessID === 'undefined') ? null : wfProcessID);
	var pwfStep = ((typeof wfStep === 'undefined') ? null : wfStep);
	var pwfComment = ((typeof wfComment === 'undefined') ? null : wfComment);
	var pwfNote = ((typeof wfNote === 'undefined') ? null : wfNote);
	var pwfDue = ((typeof wfDue === 'undefined') ? null : wfDue);
	var pwfHours = ((typeof wfHours === 'undefined') ? null : wfHours);
	var pwfProcess = ((typeof wfProcess === 'undefined') ? null : wfProcess);
	var pwfObj = ((typeof wfObj === 'undefined') ? null : wfObj);
	var pwfStaffUserID = ((typeof wfStaffUserID === 'undefined') ? null : wfStaffUserID);
	var ptimeAccountingArray = ((typeof timeAccountingArray === 'undefined') ? null : timeAccountingArray);
	var pwfTimeBillable = ((typeof wfTimeBillable === 'undefined') ? null : wfTimeBillable);
	var pwfTimeOT = ((typeof wfTimeOT === 'undefined') ? null : wfTimeOT);
	var ptimeLogModel = ((typeof timeLogModel === 'undefined') ? null : timeLogModel);
	var ptimeLogSeq = ((typeof timeLogSeq === 'undefined') ? null : timeLogSeq);
	var pdateLogged = ((typeof dateLogged === 'undefined') ? null : dateLogged);
	var pstartTime = ((typeof startTime === 'undefined') ? null : startTime);
	var pendTime = ((typeof endTime === 'undefined') ? null : endTime);
	var ptimeElapsedHours = ((typeof timeElapsedHours === 'undefined') ? null : timeElapsedHours);
	var ptimeElapsedMin = ((typeof timeElapsedMin === 'undefined') ? null : timeElapsedMin);

	//Run simulate the WTUA event for the child record
	logDebug("***Begin WTUA Sim");
	
	vScriptName = "function: runWTUAForWFTaskWFStatus";
	vEventName = "WorkflowTaskUpdateAfter";

	prefix = 'WTUA';

	//Clear global variables so that they can be set with the supplied
	capId = null;
	cap = null;
	capIDString = "";
	appTypeResult = null;
	appTypeString = "";
	appTypeArray = new Array();
	capName = null;
	capStatus = null;
	fileDateObj = null;
	fileDate = null;
	fileDateYYYYMMDD = null;
	parcelArea = 0;
	estValue = 0;
	balanceDue = 0;
	houseCount = 0;
	feesInvoicedTotal = 0;
	capDetail = "";
	AInfo = new Array();
	partialCap = false;
	parentCapId = null;
	CreatedByACA = 'N';

	//Clear event specific variables;
	//wfTask = null;
	wfTaskObj = null;
	wfStatus = null;
	wfDate = null;
	wfDateMMDDYYYY = null;
	wfProcessID = null;
	wfStep = null;
	wfComment = null;
	wfNote = null;
	wfDue = null;
	wfHours = null;
	wfProcess = null;
	wfObj = null;
	wfStaffUserID = null;
	timeAccountingArray = null;
	wfTimeBillable = null;
	wfTimeOT = null;
	timeLogModel = null;
	timeLogSeq = null;
	dateLogged = null;
	startTime = null;
	endTime = null;
	timeElapsedHours = null;
	timeElapsedMin = null;

	//Set capId to the vCapId variable provided
	capId = vCapId;
	//Update global variables based on child capId
	if (capId !== null) {
		parentCapId = pcapId;
		servProvCode = capId.getServiceProviderCode();
		capIDString = capId.getCustomID();
		cap = aa.cap.getCap(capId).getOutput();
		appTypeResult = cap.getCapType();
		appTypeString = appTypeResult.toString();
		appTypeArray = appTypeString.split("/");
		if (appTypeArray[0].substr(0, 1) != "_") {
			var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput();
			if (currentUserGroupObj)
				currentUserGroup = currentUserGroupObj.getGroupName();
		}
		capName = cap.getSpecialText();
		capStatus = cap.getCapStatus();
		partialCap = !cap.isCompleteCap();
		fileDateObj = cap.getFileDate();
		fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
		fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(), fileDateObj.getDayOfMonth(), fileDateObj.getYear(), "YYYY-MM-DD");
		var valobj = aa.finance.getContractorSuppliedValuation(capId, null).getOutput();
		if (valobj.length) {
			estValue = valobj[0].getEstimatedValue();
			calcValue = valobj[0].getCalculatedValue();
			feeFactor = valobj[0].getbValuatn().getFeeFactorFlag();
		}

		var capDetailObjResult = aa.cap.getCapDetail(capId);
		if (capDetailObjResult.getSuccess()) {
			capDetail = capDetailObjResult.getOutput();
			houseCount = capDetail.getHouseCount();
			feesInvoicedTotal = capDetail.getTotalFee();
			balanceDue = capDetail.getBalance();
		}
		loadAppSpecific(AInfo);
		loadTaskSpecific(AInfo);
		loadParcelAttributes(AInfo);
		loadASITables();

		CreatedByACA = 'N';

		logDebug("<B>EMSE Script Results for " + capIDString + "</B>");
		logDebug("capId = " + capId.getClass());
		logDebug("cap = " + cap.getClass());
		logDebug("currentUserID = " + currentUserID);
		logDebug("currentUserGroup = " + currentUserGroup);
		logDebug("systemUserObj = " + systemUserObj.getClass());
		logDebug("appTypeString = " + appTypeString);
		logDebug("capName = " + capName);
		logDebug("capStatus = " + capStatus);
		logDebug("fileDate = " + fileDate);
		logDebug("fileDateYYYYMMDD = " + fileDateYYYYMMDD);
		logDebug("sysDate = " + sysDate.getClass());
		logDebug("parcelArea = " + parcelArea);
		logDebug("estValue = " + estValue);
		logDebug("calcValue = " + calcValue);
		logDebug("feeFactor = " + feeFactor);

		logDebug("houseCount = " + houseCount);
		logDebug("feesInvoicedTotal = " + feesInvoicedTotal);
		logDebug("balanceDue = " + balanceDue);
	}

	//set WTUA specific variables
	wfTask = vTaskName; // Workflow Task Triggered event
	wfStatus = vStatus; // Status of workflow that triggered event
	wfDate = sysDate.getYear() + '-' + sysDate.getMonth() + '-' + sysDate.getDayOfMonth(); // date of status of workflow that triggered event
	wfDateMMDDYYYY = wfDate.substr(5, 2) + "/" + wfDate.substr(8, 2) + "/" + wfDate.substr(0, 4); // date of status of workflow that triggered event in format MM/DD/YYYY
	// Go get other task details
	wfObj = aa.workflow.getTasks(capId).getOutput();
	for (i in wfObj) {
		fTask = wfObj[i];
		if (fTask.getTaskDescription() == wfTask && fTask.getProcessID() == vProcessID && fTask.getStepNumber() == vStepNum) {
			wfStep = fTask.getStepNumber();
			wfProcess = fTask.getProcessCode();
			wfProcessID = fTask.getProcessID();
			wfComment = fTask.getDispositionComment();
			wfNote = fTask.getDispositionNote();
			wfDue = fTask.getDueDate();
			wfHours = fTask.getHoursSpent();
			wfTaskObj = fTask
		}
	}
	logDebug("wfTask = " + wfTask);
	logDebug("wfTaskObj = " + wfTaskObj.getClass());
	logDebug("wfStatus = " + wfStatus);
	logDebug("wfDate = " + wfDate);
	logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
	logDebug("wfStep = " + wfStep);
	logDebug("wfComment = " + wfComment);
	logDebug("wfProcess = " + wfProcess);
	logDebug("wfProcessID = " + wfProcessID);
	logDebug("wfNote = " + wfNote);

	/* Added for version 1.7 * /
	wfStaffUserID = aa.env.getValue("StaffUserID");
	timeAccountingArray = new Array()
		if (aa.env.getValue("TimeAccountingArray") != "") {
			timeAccountingArray = aa.env.getValue("TimeAccountingArray");
		}
		wfTimeBillable = aa.env.getValue("Billable");
	wfTimeOT = aa.env.getValue("Overtime");

	logDebug("wfStaffUserID = " + wfStaffUserID);
	logDebug("wfTimeBillable = " + wfTimeBillable);
	logDebug("wfTimeOT = " + wfTimeOT);
	logDebug("wfHours = " + wfHours);

	if (timeAccountingArray != null || timeAccountingArray != '') {
		for (var i = 0; i < timeAccountingArray.length; i++) {
			timeLogModel = timeAccountingArray[i];
			timeLogSeq = timeLogModel.getTimeLogSeq();
			dateLogged = timeLogModel.getDateLogged();
			startTime = timeLogModel.getStartTime();
			endTime = timeLogModel.getEndTime();
			timeElapsedHours = timeLogModel.getTimeElapsed().getHours();
			timeElapsedMin = timeLogModel.getTimeElapsed().getMinutes();

			logDebug("TAtimeLogSeq = " + timeLogSeq);
			logDebug("TAdateLogged = " + dateLogged);
			logDebug("TAstartTime = " + startTime);
			logDebug("TAendTime = " + endTime);
			logDebug("TAtimeElapsedHours = " + timeElapsedHours);
			logDebug("TAtimeElapsedMin = " + timeElapsedMin);
		}
	}
	//

	//Run WTUA scripts for the variables provided
	doScriptActions();

	//Reset global variables to the original records
	vScriptName = pvScriptName;
	vEventName = pvEventName;
	prefix = pprefix;
	capId = pcapId;
	cap = pcap;
	capIDString = pcapIDString;
	appTypeResult = pappTypeResult;
	appTypeString = pappTypeString;
	appTypeArray = pappTypeArray;
	capName = pcapName;
	capStatus = pcapStatus;
	fileDateObj = pfileDateObj;
	fileDate = pfileDate;
	fileDateYYYYMMDD = pfileDateYYYYMMDD;
	parcelArea = pparcelArea;
	estValue = pestValue;
	feesInvoicedTotal = pfeesInvoicedTotal;
	balanceDue = pbalanceDue;
	houseCount = phouseCount;
	feesInvoicedTotal = pfeesInvoicedTotal;
	capDetail = pcapDetail;
	AInfo = pAInfo;
	partialCap = ppartialCap;
	parentCapId = pparentCapId;
	CreatedByACA = pCreatedByACA;

	//Reset WTUA Specific variables.
	wfTask = pwfTask;
	wfTaskObj = pwfTaskObj;
	wfStatus = pwfStatus;
	wfDate = pwfDate;
	wfDateMMDDYYYY = pwfDateMMDDYYYY;
	wfProcessID = pwfProcessID;
	wfStep = pwfStep;
	wfComment = pwfComment;
	wfNote = pwfNote;
	wfDue = pwfDue;
	wfHours = pwfHours;
	wfProcess = pwfProcess;
	wfObj = pwfObj;
	wfStaffUserID = pwfStaffUserID;
	timeAccountingArray = ptimeAccountingArray;
	wfTimeBillable = pwfTimeBillable;
	wfTimeOT = pwfTimeOT;
	timeLogModel = ptimeLogModel;
	timeLogSeq = ptimeLogSeq;
	dateLogged = pdateLogged;
	startTime = pstartTime;
	endTime = pendTime;
	timeElapsedHours = ptimeElapsedHours;
	timeElapsedMin = ptimeElapsedMin;

	logDebug("***End WTUA Sim");

}
/*--------------------------------------------------------------------------------------------------------------------/
| End ETW 06/13/14 Custom functions for runWTUA
/--------------------------------------------------------------------------------------------------------------------* /

function sendNotification(emailFrom,emailTo,emailCC,templateName,params,reportFile) {
	// custom for BMCR
	logDebug("start sendNotification(" + [].slice.call(arguments) + ")");
	
	if (!SENDEMAILS) { logDebug("SENDEMAILS global is false, exiting without sending email") ; return false}
	
	var itemCap = capId;
	if (arguments.length == 7) itemCap = arguments[6]; // use cap ID specified in args

	var id1 = itemCap.ID1;
 	var id2 = itemCap.ID2;
 	var id3 = itemCap.ID3;

	var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);


	var result = null;
	result = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, emailCC, templateName, params, capIDScriptModel, reportFile);
	if(result.getSuccess())
	{
		logDebug("Sent email successfully!");
		return true;
	}
	else
	{
		logDebug("Failed to send mail. - " + result.getErrorType());
		return false;
	}
}

function setInitialWorkflowTaskStatus() {
	//use optional parameter #1 "Y" to re-execute WTUA event
	var executeWTUA = false;

	if (arguments.length == 1) {
		executeWTUA = true;
	}

	var vWF = aa.workflow.getTasks(capId);

	if (vWF.getSuccess()) {
		vWF = vWF.getOutput();
	} else {
		logDebug("Failed to get workflow tasks");
	}

	var vEnvTask = null;
	if (typeof(wfTask) !== "undefined") {
		vEnvTask = wfTask;
	}

	var vEnvStatus = null;
	if (typeof(wfStatus) !== "undefined") {
		vEnvStatus = wfStatus;
	}

	for (x in vWF) {
		var vTask = vWF[x];
		var vTaskItem = vTask.getTaskItem();
		var vTaskName = vTask.taskDescription;
		var vProcessID = vTask.getProcessID();
		var vProcessCode = vTask.getProcessCode();
		var vStepNum = vTask.getStepNumber();

		//logDebug("Here in setInitialWorkflowTaskStatus. Task Informaiton:");
		//logDebug("TaskActive: " + isTaskActive(vTaskName));
		//logDebug("TaskName: " + vTaskName);
		//logDebug("TaskDisposition: " + vTask.getDisposition());
		//logDebug("TaskDispositionDate: " + vTask.getDispositionDate());
		//logDebug("vEnvTask: " + vEnvTask);
		//logDebug("vEnvStatus: " + vEnvStatus);

		//When the task is active and it has as status (Disposition) but no status date (Disposition Date),
		//and is also not the environments task or status (when triggered by WTUA), then save the status with a date
		//by using the updateTask function.
		if (isTaskActive(vTaskName) == true && vTask.getDisposition() != null && vTask.getDisposition() != "" && vTask.getDispositionDate() == null
			 && (vEnvTask == null || vEnvTask != vTaskName) && (vEnvStatus == null || vEnvStatus != vTask.getDisposition())) {

			//logDebug("Here in setInitialWorkflowTaskStatus. Updating task with initial status");
			//logDebug("TaskActive: " + isTaskActive(vTaskName));
			//logDebug("TaskName: " + vTaskName);
			//logDebug("TaskDisposition: " + vTask.getDisposition());
			//logDebug("TaskDispositionDate: " + vTask.getDispositionDate());

			updateTask(vTaskName, vTask.getDisposition(), "Initial status updated via script", "Initial status updated via script", vProcessCode);

			//Execute Worfklow task scripts
			if (executeWTUA) {
				//logDebug("Calling WTUA in ASync for wfTask: " + vTask.taskDescription + " and wfStatus: " + vTask.getDisposition() + " for capId: " + capId);
				runWTUAForWFTaskWFStatus(vTaskName, vProcessID, vStepNum, vTask.getDisposition(), capId);
			}
		}
		//new code
		//When the task is active and it has as status (Disposition) but no status date (Disposition Date),
		//and IS the environments task or status (when triggered by WTUA), then save the status with a date
		if (isTaskActive(vTaskName) == true
			 && vTask.getDisposition() != null
			 && vTask.getDisposition() != ""
			 && vTask.getDispositionDate() == null
			 && vEnvTask == vTaskName
			 && vEnvStatus == vTask.getDisposition()) {
			//set the disposition date
			vTaskItem.setDispositionDate(new Date());
			var updateResult = aa.workflow.adjustTaskWithNoAudit(vTaskItem);
			if (updateResult.getSuccess()) {
				logDebug("Updated Workflow Task : " + vTaskName + " Disposition Date to " + aa.date.getCurrentDate());
			} else {
				logDebug("Error updating wfTask : " + updateResult.getErrorMessage());
			}
		}
		//end new code
	}
}

function slackDebug(msg) {
	
	var headers=aa.util.newHashMap();

    headers.put("Content-Type","application/json");
	
    var body = {};
	body.text = msg;
	//body.attachments = [{"fallback": "Full Debug Output"}];
	//body.attachments[0].text = debug;
	
    var apiURL = "https://hooks.slack.com/services/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";
	
	
    var result = aa.httpClient.post(apiURL, headers, JSON.stringify(body));
    if (!result.getSuccess()) {
        logDebug("Slack get anonymous token error: " + result.getErrorMessage());
	} else {	
		aa.print("Slack Results: " + result.getOutput());
        }
  	}
	
function updateFeeByDate(feeCap, fdate, fcode, fsched, fperiod, fqty, finvoice, pDuplicate, pFeeSeq) {
	// Updates an assessed fee with a new Qty.  If not found, adds it; else if invoiced fee found, adds another with adjusted qty.
	// optional param pDuplicate -if "N", won't add another if invoiced fee exists (SR5085)
	// Script will return fee sequence number if new fee is added otherwise it will return null (SR5112)
	// Optional param pSeqNumber, Will attempt to update the specified Fee Sequence Number or Add new (SR5112)
	// 12/22/2008 - DQ - Correct Invoice loop to accumulate instead of reset each iteration

	// If optional argument is blank, use default logic (i.e. allow duplicate fee if invoiced fee is found)
	if (pDuplicate == null || pDuplicate.length == 0)
		pDuplicate = "Y";
	else
		pDuplicate = pDuplicate.toUpperCase();

	var invFeeFound = false;
	var adjustedQty = fqty;
	var feeSeq = null;
	feeUpdated = false;

	if (pFeeSeq == null)
		getFeeResult = aa.finance.getFeeItemByFeeCode(capId, fcode, fperiod);
	else
		getFeeResult = aa.finance.getFeeItemByPK(capId, pFeeSeq);

	if (getFeeResult.getSuccess()) {
		if (pFeeSeq == null)
			var feeList = getFeeResult.getOutput();
		else {
			var feeList = new Array();
			feeList[0] = getFeeResult.getOutput();
		}
		for (feeNum in feeList) {
			if (feeList[feeNum].getFeeitemStatus().equals("INVOICED")) {
				if (pDuplicate == "Y") {
					logDebug("Invoiced fee " + fcode + " found, subtracting invoiced amount from update qty.");
					adjustedQty = adjustedQty - feeList[feeNum].getFeeUnit();
					invFeeFound = true;
					feeSeq = feeList[feeNum].getFeeSeqNbr();
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
					logDebug("Updated Qty on Existing Fee Item" + "(" + feeSeq + "): " + fcode + " to Qty: " + fqty);
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
	if (!feeUpdated && adjustedQty != 0 && (!invFeeFound || invFeeFound && pDuplicate == "Y")) {
		feeSeq = addFeeByDate(feeCap, fdate, fcode, fsched, fperiod, adjustedQty, finvoice);
	}
	updateFeeItemInvoiceFlag(feeSeq, finvoice);
	return feeSeq;
}

function voidAllFees(capId) {
	var getFeeResult = aa.fee.getFeeItems(capId,null,"INVOICED");
	if (getFeeResult.getSuccess())
		{
		var feeList = getFeeResult.getOutput();
		for (feeNum in feeList)
			{
			if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();

				var editResult = aa.finance.voidFeeItem(capId, feeSeq);
				if (editResult.getSuccess())
				{
				   logDebug("Voided existing Fee Item: " + feeList[feeNum].getFeeCod());
				}
				else
				{ logDebug( "**ERROR: Voiding fee item (" + feeList[feeNum].getFeeCod() + "): " + editResult.getErrorMessage()); 
				  break;
 			    }
				//Invoice the void creating a "Credit"
				var cfeeSeqArray = new Array();
				   var paymentPeriodArray = new Array();
      			   cfeeSeqArray.push(feeSeq);
				   paymentPeriodArray.push(feeSeq.period);
			  	   var invoiceResult_L = aa.finance.createInvoice(capId, cfeeSeqArray, paymentPeriodArray);
 				   if (!invoiceResult_L.getSuccess())
				   {
					logDebug("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " +  invoiceResult_L.getErrorMessage());
					return false;
				    }
 
					break;  // done with this payment
				}	
			
			if (feeList[feeNum].getFeeitemStatus().equals("VOIDED"))
				{
					var feeSeq = feeList[feeNum].getFeeSeqNbr();
					//Invoice the void creating a "Credit"
					var cfeeSeqArray = new Array();
					var paymentPeriodArray = new Array();
					cfeeSeqArray.push(feeSeq);
					paymentPeriodArray.push(feeSeq.period);
					var invoiceResult_L = aa.finance.createInvoice(capId, cfeeSeqArray, paymentPeriodArray);
					if (!invoiceResult_L.getSuccess())
					{
						logDebug("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " +  invoiceResult_L.getErrorMessage());
						return false;
				    }
 
					break; 
				}	

				
			if (feeList[feeNum].getFeeitemStatus().equals("CREDITED"))
				{
				logDebug("Credited fee "+feeList[feeNum].getFeeCod()+" found, not voided");
				}
			}
		}
	else
		{ logDebug( "**ERROR: getting fee items (" + feeList[feeNum].getFeeCod() + "): " + getFeeResult.getErrorMessage())}
	}
*/
