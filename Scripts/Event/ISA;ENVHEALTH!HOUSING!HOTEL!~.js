try
{
/*
  if(appMatch("EnvHealth/Housing/Hotel/Application"))
  {
    updateGuidesheetASIField((inspId, "Consumer Housing", "ROOM NUMBERS", "EH_HOTEL_APP", "HOTEL INFORMATION", "Number of Rooms", AInfo["Number of Rooms"]);
  }
  else if (appMatch("EnvHealth/Housing/Hotel/Permit"))
  {
    updateGuidesheetASIField((inspId, "Consumer Housing", "ROOM NUMBERS", "EH_HOTEL_PMT", "HOTEL INFORMATION", "Number of Rooms", AInfo["Number of Rooms"]);
  }
*/
  for (res in schedObjArray)
  {
    curResult = schedObjArray[res];
    updateGuidesheetASIField(curResult.inspId, "Consumer Housing", "Room Numbers", "INSP_ROOM", "ROOM NUMBERS", "Number of Rooms", AInfo["Number of Rooms"]);
  }
}
catch(err)
{
  logDebug("A JavaScript Error occurred: ISA:EnvHealth/Housing/Hotel/*: " + err.message);
  logDebug(err.stack);
}
