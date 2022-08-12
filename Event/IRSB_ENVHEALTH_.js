///////////////////////////////////////////////////////
if (inspResultComment.length() > 999)
{
	cancel=true;
	showMessage=true;
	logMessage("Inspection Comment cannot exceed 999 characters in order to comply with CERS standard.");
}
else 
{
	var insp = aa.inspection.getInspections(capId).getOutput();
	for (i in insp)
	{
		if (insp[i].getIdNumber() == inspId)
		{
			gs = insp[i].getInspection().getGuideSheets();
			//aa.print(insp[i].getInspection().getGuideSheets())
			if (gs)
			{
				gsArray = gs.toArray();
				for (j in gsArray)
				{
					gsItem = gsArray[j].getItems().toArray();
					for (k in gsItem)
					{
						gsiComment = gsItem[k].getGuideItemComment();
						gsiText = gsItem[k].getGuideItemText();
						if (gsiComment!=null && gsiComment.length() > 999)
						{
							cancel=true;
							showMessage=true;
							logMessage("Checklist Item Comment cannot exceed 999 characters in order to comply with CERS standard ("+gsiComment.length()+"): "+gsiText);
						}
						//aa.print(gsItem[k].getGuideItemComment());
					}
				}
				
			}
		}
	}
}





///////////////////////////////////////////////////////
function logMessage(msg) {
aa.print(msg)
}