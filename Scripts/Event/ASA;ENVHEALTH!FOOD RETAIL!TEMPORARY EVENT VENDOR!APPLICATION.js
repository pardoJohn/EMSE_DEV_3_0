try
{
	var currentStartDate =  new Date(AInfo["Event Start Date"]);
	var tempEventCountForYear = 0;
	var qualifiedArray = "";
	
	var recordsbyTaxIDObj = aa.cap.getCapIDsByAppSpecificInfoField("Tax ID", AInfo["Tax ID"]);
	var recordsbyTaxID;
	
	if(recordsbyTaxIDObj.getSuccess())
	{
		recordsbyTaxID = recordsbyTaxIDObj.getOutput();
	}
	else
	{
		logDebug("Error getting applications for Tax ID: " + AInfo["Tax ID"]);
	}

	if(recordsbyTaxID)
	{ 
		for(i in recordsbyTaxID)
		{
			if (recordsbyTaxID[i].getCapID() != capId)
			{
				var relASIStartDt = new Date(getAppSpecific("Event Start Date", recordsbyTaxID[i].getCapID()));
				var relASINonProfit = getAppSpecific("Non Profit", recordsbyTaxID[i].getCapID());
				if(relASINonProfit == "Yes")
				{
					var year = relASIStartDt.getYear();
					var currentCapYear = currentStartDate.getYear();
					if(year == currentCapYear)
					{
						tempEventCountForYear++;
						if(tempEventCountForYear == 1)
						{
							qualifiedArray = recordsbyTaxID[i].getCustomID();
						}
						else
						{
							qualifiedArray += "," + recordsbyTaxID[i].getCustomID();
						}
					}
				}
			}
		}
		if(tempEventCountForYear > 4)
		{
			addStdCondition("NonProfits", "Number of Temporary Events Limit");
			var r = aa.capCondition.getCapConditions(capId);
			if (r.getSuccess()) 
			{
				conditions = r.getOutput();
				for (i = 0; i < conditions.length; i++) 
				{
					var thisCond = conditions[i];
					if (thisCond.getConditionDescription() == "Number of Temporary Events Limit EnvHealth- NonProfits") 
					{
						thisCond.setDisplayConditionNotice("Y");
						thisCond.setIncludeInShortDescription("Y");
						thisCond.setConditionComment("The other record IDs are : " + qualifiedArray);
						aa.capCondition.editCapCondition(thisCond);
                                                 comment("Condition added successfully.");
					}
				}
			}
		}
	}
}
catch(err)
{
	logDebug("An error occurred in ASA:EnvHealth/Food Retail/Temporary Event Vendor/Application : " + err.message);
	logDebug(err.stack);	
}
