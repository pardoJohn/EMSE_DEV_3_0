try
{
	var inspObj = aa.inspection.getInspections(capId);

	if (inspObj.getSuccess()) 
	{
		var inspList = inspObj.getOutput();
		var arrinsp = [];
		if (inspList)
		{	
			for (xx in inspList)
			{
				if (!matches(inspList[xx].getScheduledDate(), "", null))
				  arrinsp.push({"InspID" : inspList[xx].getIdNumber(), "idate" : inspList[xx].getScheduledDate().getEpochMilliseconds()});
			}

			if (arrinsp.length > 1)  // Only if there are more than 1 inspections. If this is the first inspection, no need to do anything.
			{
				// Sort on scheduled date so we can take the last latest two inspections
				arrinsp.sort(function (a, b) { return a.idate - b.idate; });

				var inspPrior = arrinsp[arrinsp.length - 2]["InspID"];
				var priorDischarge = parseFloat(getGuidesheetASIValue(inspPrior, "TECH O and M Inspection", "Control Panels", "INSP OM C P","CONTROL PANEL INFORMATION", "Discharge Pump Cycles (Ct)"));

				if (!isNaN(priorDischarge))
				  updateGuidesheetASIField(inspId, "TECH O and M Inspection", "Control Panels", "INSP OM C P","CONTROL PANEL INFORMATION", "Previous Discharge Pump Cycles:", priorDischarge);	
			}
		}
	}
	else
	{
	  logDebug("Error getting Prior Inspection Data.");
	}
}
catch(err)
{
  logDebug("A JavaScript Error occurred: ISA:EnvHealth/Land Use/Septic/OM: " + err.message);
  logDebug(err.stack)  
}