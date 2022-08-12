// CD- 30-AUG-2021 Additional Info required & received status
try
{
	var inCapScriptModel = aa.cap.getCap(capId).getOutput();
	if(inCapScriptModel)
	{
		var tempCapModel = inCapScriptModel.getCapModel();
		if(tempCapModel.getCapClass() == "COMPLETE")
		{
			taskRes = aa.workflow.getWorkflowHistory(capId, aa.util.newQueryFormat());

			if (taskRes.getSuccess())
			{
				task = taskRes.getOutput();
				for (i in task)
				{
					logDebug(task[i].getTaskDescription());
					logDebug(task[i].getDisposition());
					if (task[i].getDisposition() == "Additional Info Required")
					{
						resultWorkflowTask(task[i].getTaskDescription(), "Additional Info Received", "Updated via Script", "");
						break;
					}
				}
			}
		}
	}
}
catch(err)
{
	logDebug("A JavaScript Error occurred: DUA:EnvHealth/~/~/~: " + err.message);
	logDebug(err.stack);
}