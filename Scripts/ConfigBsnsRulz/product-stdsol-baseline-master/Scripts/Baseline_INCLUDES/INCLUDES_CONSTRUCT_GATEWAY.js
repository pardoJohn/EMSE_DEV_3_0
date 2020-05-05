//@ts-check
/*

    Script to provide a gateway to using the standard base
    script libraries.

    {
        "Metadata":{
            "Caller": "<caller>", 
            "Description": "<description>", 
            "Status": "<status>"
        },
        "Actions":[
            {
                "Method": "<methodName>",
                "Params": [
                    {
                        "Name": "<value>",
                        "Name": "<value>",
                        "Name": "<value>"
                    }
                ]
            }
        ]}
*/

// MAIN FUNCTION //

var retObj = {};

try {
    // Retrieve the script payload from the environment variable and run the
    // main function to process the payload.
    var envRequest = aa.env.getValue("request");
    retObj = main(envRequest);
}
catch (err) {
    retObj.Metadata.Status = err.Message;
    aa.env.setValue("response",retObj);
    _log("error","Construct_Gateway: Main error = " + err.Message);
}

function main(request, retObj) {
    _log("info","main: input = " + request);

    var resultsObj;

    // Decode the base64 encoded JSON object.
    var requestDecoded = decode64(request);
    var requestJSON = JSON.parse(requestDecoded);

    // Check JSON for errors
    var error = checkJSON(requestJSON);
    if (error != "") {
        _log("error","Error(s) in request JSON structure. Error = " + error);
    }

    // Assign objects from the incoming JSON object.
    var metadata = requestJSON.metadata;
    var entityType = requestJSON.Object;
    var entityParams = requestJSON.Params;
    var actions = requestJSON.Actions;

    var actionsResult = [];

    //create entity object
    var entity = createEntity(entityType, entityParams);

    var actionsCount = actions.Count(); 
    for (var i = 0; i < actionsCount; i++) {
        var actionResult = {};

        // For each action in the Actions array, execute the action and return
        // the result.
        var result = executeAction(entity, actions[i]);
        _log("info","main: Method = " + actionsResult[i].Method + ". Result = " + result);
        
        actionResult.Method = actionsResult[i].Method;
        actionResult.Result = result;

        actionsResult[i] = actionResult;
    }

    return resultsObj;
}

function checkJSON(inputJSON) {
    var retVal = "";


    return retVal;
}

function decode64(encoded64) {
    var retVal = "";

    return retVal;
}

function createEntity(entityType, entityParams) {

}

function executeAction(entity, action) {
    var retVal = "";


    return retVal;
}

function _log(errorLevel,str) {
    errorLevel = errorLevel.toUpperCase();
    logDebug(str);

    return;
}