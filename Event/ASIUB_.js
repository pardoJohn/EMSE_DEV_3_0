// Enter your script here...//-------------------------------------------Parameters-----------------------------------------------------------------------//

//You must provide report name.
var reportName = "Inspection Report All Agency";

//You must provide cap id.
//var capID = "14CAP-00000-005MP";

//You must provide module name.
var moduleName = "EnvHealth";

//-----------------------------------------------------------------------------------------------------------------------------//
var report = aa.reportManager.getReportInfoModelByName("Inspection Report All Agency" );
logDebug(report);
report = report.getOutput();
logDebug(report);
report.setCapId(capId);
report.setModule(moduleName );
var i = aa.reportManager.getReportResult(report );
logDebug(i);
