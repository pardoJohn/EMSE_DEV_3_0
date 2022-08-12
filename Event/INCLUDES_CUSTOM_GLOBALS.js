eval(getScriptText("INCLUDES_SEP_CUSTOM"));
showDebug = true;
showDebug = 3;
/*
*/
if(matches(currentUserID,"LWACHT","ADMIN")){
   showDebug = 3;
   showMessage = true;
}else{
   showDebug = false;
   showMessage = true;
}

sepMsg="VFP";
SENDEMAILS=true;