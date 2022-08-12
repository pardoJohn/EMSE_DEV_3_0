try{
  if (!matches(AInfo["Facility DBA"], "undefined", "", null)){
     editAppName(AInfo["Facility DBA"]);
  }
}
catch(err)
{
  logDebug("A JavaScript Error occurred: CTRCA:EnvHealth/*/*/Application: " + err.message);
  logDebug(err.stack)  
}