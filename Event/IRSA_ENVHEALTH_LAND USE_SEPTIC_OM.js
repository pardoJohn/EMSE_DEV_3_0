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
			if (arrinsp.length > 1)   // From second inspection onward so must have at least one previous inspection.
			{
				// Sort on scheduled date so we can take the last latest two inspections
				arrinsp.sort(function (a, b) { return a.idate - b.idate; });

				var inspPrior = arrinsp[arrinsp.length - 2]["InspID"];
				var curDate = arrinsp[arrinsp.length - 1]["idate"];
				var priorDate = arrinsp[arrinsp.length - 2]["idate"];
				
				var curDischarge = parseFloat(getGuidesheetASIValue(inspId, "TECH O and M Inspection", "Control Panels", "INSP OM C P","CONTROL PANEL INFORMATION", "Discharge Pump Cycles (Ct)"));
				var priorDischarge = parseFloat(getGuidesheetASIValue(inspId, "TECH O and M Inspection", "Control Panels", "INSP OM C P","CONTROL PANEL INFORMATION", "Previous Discharge Pump Cycles:"));
				
				var priorDose = parseFloat(getGuidesheetASIValue(inspPrior, "TECH O and M Inspection", "Control Panels", "INSP OM C P", "CONTROL PANEL INFORMATION", "Dose Volume (gals):"));
				var inspDiff = Math.round((new Date(curDate)- new Date(priorDate))/(1000*60*60*24));
				var avgValue = (((isNaN(curDischarge) ? 0 : curDischarge) - (isNaN(priorDischarge) ? 0 : priorDischarge)) * (isNaN(priorDose) ? 0 : priorDose)) / inspDiff;
				if (!isNaN(avgValue))
				  updateGuidesheetASIField(inspId, "TECH O and M Inspection", "Control Panels", "INSP OM C P","CONTROL PANEL INFORMATION", "Ave Sewage Flow (gal/day)", avgValue.toFixed(1));	
			}
		}
	}
	else
	{
		logDebug("Error getting inspections data");
	}
}
catch(err)
{
  logDebug("A JavaScript Error occurred: ISA:EnvHealth/Land Use/Septic/OM: " + err.message);
  logDebug(err.stack)  
}
