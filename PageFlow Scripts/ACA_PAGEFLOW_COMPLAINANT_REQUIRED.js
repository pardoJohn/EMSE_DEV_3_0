/*------------------------------------------------------------------------------------------------------/
| Program : ACA Page Flow Template.js
| Event   : ACA Page Flow Before
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
/------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = false; // Set to true to see results in popup window
var showDebug = false; // Set to true to see debug messages in popup window
var useAppSpecificGroupName = false; // Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false; // Use Group name when populating Task Specific Info Values
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var message = ""; // Message String
var debug = ""; // Debug String
var br = "<BR>"; // Break Tag

var useSA = false;
var SA = null;
var SAScript = null;
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); 
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 
	useSA = true; 	
	SA = bzr.getOutput().getDescription();
	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 
	if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }
	}
	
if (SA) {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA));
	eval(getScriptText(SAScript,SA));
	}
else {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
	}
	
eval(getScriptText("INCLUDES_CUSTOM"));



function getScriptText(vScriptName){
	var servProvCode = aa.getServiceProviderCode();
	if (arguments.length > 1) servProvCode = arguments[1]; // use different serv prov code
	vScriptName = vScriptName.toUpperCase();	
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN");
		return emseScript.getScriptText() + "";	
		} catch(err) {
		return "";
	}
}


// page flow custom code begin
try
{
	var cap = aa.env.getValue("CapModel");
	var capId = cap.getCapID();
    var parentId = cap.getParentCapID();
    var complainantExists = false;
	message = "Complainant Contact Type details are required to submit a Food complaint. "  + br + " - First Name" + br + " - Last Name" + br + " - Primary Phone";
	var asiValues = [];
	loadAppSpecific4ACA(asiValues);
	var food = asiValues["Food"];

	if (food == "CHECKED")
	{
		// Check for mandatory fields for Complainant
		var capContList = cap.getContactsGroup();
		
		for (var c=0; c< capContList.size(); c++) {
				var capContModel = capContList.get(c);
				
				if (capContModel.getContactType().equals("Complainant")) {
					complainantExists = true;
					break;
				}
		}
		
		if (!complainantExists)
		{
			
				aa.env.setValue("ErrorMessage", message);
				aa.env.setValue("ErrorCode", "1");
		}

	}
}
catch(ex)
{
	aa.env.setValue("ErrorCode", "1");
	aa.env.setValue("ErrorMessage", "An error occurred in ACA_After:EnvHealth/Enforcement/Complaint/NA : " + ex);
}

// page flow custom code end

// if (debug.indexOf("**ERROR") > 0)
	// {
	// aa.env.setValue("ErrorCode", "1");
	// aa.env.setValue("ErrorMessage", debug);
	// }
// else
	// {
	// if (cancel)
		// {
		// aa.env.setValue("ErrorCode", "-2");
		// if (showMessage) aa.env.setValue("ErrorMessage", message);
		// if (showDebug) 	aa.env.setValue("ErrorMessage", debug);
		// }
	// else
		// {
		// aa.env.setValue("ErrorCode", "0");
		// if (showMessage) aa.env.setValue("ErrorMessage", message);
		// if (showDebug) 	aa.env.setValue("ErrorMessage", debug);
		// }
	// }

function loadAppSpecific4ACA(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//
	// uses capModel in this event


	var itemCap = capId;
	if (arguments.length >= 2)
		{
		itemCap = arguments[1]; // use cap ID specified in args

    		var fAppSpecInfoObj = aa.appSpecificInfo.getByCapID(itemCap).getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	else
		{
		var capASI = cap.getAppSpecificInfoGroups();
		if (!capASI) {
			logDebug("No ASI for the CapModel");
			}
		else {
			var i= cap.getAppSpecificInfoGroups().iterator();

			while (i.hasNext())
				{
				 var group = i.next();
				 var fields = group.getFields();
				 if (fields != null)
					{
					var iteFields = fields.iterator();
					while (iteFields.hasNext())
						{
						 var field = iteFields.next();

						if (useAppSpecificGroupName)
							thisArr[field.getCheckboxType() + "." + field.getCheckboxDesc()] = field.getChecklistComment();
						else
							thisArr[field.getCheckboxDesc()] = field.getChecklistComment();
					 }
					}
				 }
			}
		}
	} 

