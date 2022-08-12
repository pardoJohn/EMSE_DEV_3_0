try {
    aa.env.setValue("CurrentUserID", "ADMIN");
    var capIdString = aa.env.getValue("capIdString");
    var capId = aa.cap.getCapID(capIdString).getOutput();
    cap = aa.cap.getCap(capId).getOutput();
    appTypeResult = cap.getCapType();
    appTypeString = appTypeResult.toString();
    appTypeArray = appTypeString.split("/");
    aa.env.setValue("CapId", capId);
    var _debug = false;
    var SCRIPT_VERSION = "3.0";
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));
    //eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, true));
    eval(getScriptText("INCLUDES_CUSTOM", null, true));
    var currentUserID = aa.env.getValue("CurrentUserID");
    var vScriptName = aa.env.getValue("ScriptCode");
    var vEventName = aa.env.getValue("EventName");
    eval(getScriptText("INCLUDES_CUSTOM_GLOBALS", null, false));
    var showMessage = false;		// Set to true to see results in popup window
    var showDebug = false;			// Set to true to see debug messages in popup window
    var disableTokens = false;		// turn off tokenizing of std choices (enables use of "{} and []")
    var useAppSpecificGroupName = false;	// Use Group name when populating App Specific Info Values
    var useTaskSpecificGroupName = false;	// Use Group name when populating Task Specific Info Values
    var enableVariableBranching = true;	// Allows use of variable names in branching.  Branches are not followed in Doc Only
    var maxEntries = 99;			// Maximum number of std choice entries.  Entries must be Left Zero Padded
    /*------------------------------------------------------------------------------------------------------/
    | END User Configurable Parameters
    /------------------------------------------------------------------------------------------------------*/
    var GLOBAL_VERSION = 3.0;
    var cancel = false;
    var startDate = new Date();
    var startTime = startDate.getTime();
    var message = "";									// Message String
    if (typeof debug === 'undefined') {
        var debug = "";										// Debug String, do not re-define if calling multiple
    }
    var br = "<BR>";									// Break Tag
    var feeSeqList = new Array();						// invoicing fee list
    var paymentPeriodList = new Array();				// invoicing pay periods
    var currentUserID = aa.env.getValue("CurrentUserID"); // Current User
    var systemUserObj = null;  							// Current User Object
    var currentUserGroup = null;						// Current User Group
    var publicUserID = null;
    var publicUser = false;
    if (currentUserID.indexOf("PUBLICUSER") == 0) {
        publicUserID = currentUserID;
        currentUserID = "ADMIN";
        publicUser = true;
    }
    if (currentUserID != null) {
        systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
    }
    var sysDate = aa.date.getCurrentDate();
    var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), sysDate.getYear(), "");
    var servProvCode = aa.getServiceProviderCode();
    if (matches(currentUserID, "CERSTEST", "ADMIN")) {
        updateAddressFromParent();
        updateContactsFromParent();
    }
} catch (e) {
    //put debug here
    email("dmontoya@septechconsulting.com", "noreply@cohb.org", "Message", e.message);
}
finally {
    if (_debug) {
        email("dmontoya@septechconsulting.com", "noreply@cohb.org", "Debug", _debug);
    }
}
function getScriptText(vScriptName, servProvCode, useProductScripts) {
    if (!servProvCode)
        servProvCode = aa.getServiceProviderCode();
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    try {
        if (useProductScripts) {
            var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
        } else {
            var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
        }
        return emseScript.getScriptText() + "";
    } catch (err) {
        return "";
    }
}
function email(pToEmail, pFromEmail, pSubject, pText) {
    //Sends email to specified address
    //06SSP-00221
    //
    aa.sendMail(pFromEmail, pToEmail, "", pSubject, pText);
    logDebug("Email sent to " + pToEmail);
    return true;
}