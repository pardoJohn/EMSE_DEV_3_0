/*

	Script test template

*/
var myCapId = "PRJ-2017-00050";
var wfTask="Refine";
var wfStatus="Rebuild Group Sets";
var inspId = 8894502;

var myUserId = "ADMIN";
var showMessage=true;
var showDebug=true;
var debug="";
var useProductScripts=true;
var useCustomScriptFile = true;  // if true, use Events->Custom Script, else use Events->Scripts->INCLUDES_CUSTOM
var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){	aa.env.setValue("PermitId1",tmpID.getID1());	aa.env.setValue("PermitId2",tmpID.getID2());	aa.env.setValue("PermitId3",tmpID.getID3()); } aa.env.setValue("CurrentUserID",myUserId); var SCRIPT_VERSION = 3.0;
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useCustomScriptFile));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useCustomScriptFile));
eval(getScriptText("INCLUDES_CUSTOM",null,useCustomScriptFile));

function getScriptText(vScriptName, servProvCode, useProductScripts) {
	if (!servProvCode)  servProvCode = aa.getServiceProviderCode();
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		if (useProductScripts) {
			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
		}
		else {
				var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
		}
		return emseScript.getScriptText() + "";	} catch (err) {		return "";	}
}

/**
 * WTUA for Project Record
 * */


eval(getScriptText("INCLUDES_RECORD"));

try {

	var capModel = cap;
	var capClass = capModel.getCapClass();
	logDebug("capClass: " + capClass);
	var newCapClass = "INCOMPLETE CAP";
	capModel.setCapClass(newCapClass) 
	exploreObject(capModel);
	
}
catch(e) {
    logDebug("Error creating gis object: " + e);
}

/***********************************************
Show the debug window
***********************************************/
aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", debug);




function exploreObject (objExplore) {

	logDebug("Methods:")
	for (x in objExplore) {
		if (typeof(objExplore[x]) == "function") {
			logDebug("<font color=blue><u><b>" + x + "</b></u></font> ");
			logDebug("   " + objExplore[x] + "<br>");
		}
	}

	logDebug("");
	logDebug("Properties:")
	for (x in objExplore) {
		if (typeof(objExplore[x]) != "function") logDebug("  <b> " + x + ": </b> " + objExplore[x]);
	}

}
