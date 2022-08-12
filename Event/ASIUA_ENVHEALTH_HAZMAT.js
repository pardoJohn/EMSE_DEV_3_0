// ASIUA:ENVHEALTH/HAZMAT/*/*
//if(matches(currentUserID,"CERSTEST","ADMIN")){
 //   showDebug = true;
   // updateAddressFromParent();
    //updateContactsFromParent();
//}

var today = dateAdd(null, 0);
if (matches(currentUserID, "CERSTEST", "ADMIN") &&
    dateAdd(AInfo["DateDownloaded"], 0) == today) {
    //aa.print("VALID DATE CASE");
    var result = aa.cap.getCapDetail(capId);
    if (!result.getSuccess())
        throw "No cap detail script object : " + cdScriptObjResult.getErrorMessage();
    var capDetail = result.getOutput();
    if (!capDetail)
        throw "No cap detail script object";
    var capDetailModel = capDetail.getCapDetailModel();
    var CERS_SYNC_KEY = today;
    var url = capDetailModel.getUrl();
    if (!url || url == "" || (dateAdd(url, 0) != CERS_SYNC_KEY)) {
        //asyncParams = aa.util.newHashMap();
        //asyncParams.put("capIdString", capId.getCustomID());
        //asyncParams.put("ScriptCode", controlString);
        //asyncParams.put("vEventName", vEventName);
        //aa.runAsyncScript("SYNC_CERS_ASYNC", asyncParams);
        updateAddressFromParent();
        updateContactsFromParent();
        capDetailModel.setUrl(CERS_SYNC_KEY);
        var editResult = aa.cap.editCapDetail(capDetailModel);
        if (editResult.getSuccess()) {
            logDebug("**INFO: Accela Record #" + capId + " was updated successfully.");
        } else
            throw "An error occurred while updating Accela Record #" + capId + ". Error message: " + editResult.getErrorMessage();
    }
}