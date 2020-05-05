//@ts-check
var aa = expression.getScriptRoot();
var servProvCode = expression.getValue("$$servProvCode$$").value;
var br = "<br>";
var showDebug = true;

function getScriptText(vScriptName) {
  vScriptName = vScriptName.toUpperCase();
  var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
  var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
  return emseScript.getScriptText() + "";
}

eval(getScriptText("INCLUDES_EXPRESSIONS"));
var debug = "";
debug = getMessageStyle();

// main loop
try {
  main();

} catch (e) {
  logDebug("ERROR: " + e);
  var thisForm = expression.getValue("ASI::FORM");
  thisForm.message = debug;
  expression.setReturn(thisForm);
}


function main() {

  var rules = {
    "form": "ASI::FORM",
    "rules": [{
      "criteria": [{
          "fieldName1": "fieldValue1"
        },
        {
          "fieldName2": "fieldValue2"
        }
      ],
      "actions": [{
        "fieldName": "ASI::RELEASE INFORMATION::Capacity",
        "required": true,
        "hide": false,
        "readOnly": true,
        "fieldValue":"myValue",
        "fieldMessage": "myValidationMessage",
        "blockSubmit": true,
        "formMessage": "myFormMessage",
        "formMessageLevel": "ERROR"
      }]
    }]
  }

  // Solution Configruation
  var solution = "BUILDING";
  var jsonFileSuffix = "DYNAMIC_CUSTOM_FORM";
  var jsonName = "CONF_" + solution + "_" + jsonFileSuffix;

  //var rules = getScriptText(jsonName);
  if (!rules) {
    logDebug("Expression configuration cannot be found: " + jsonName, "error");
    logDebug(JSON.stringify(rules));

  }

  if (!rules.form) {
    logDebug("ERROR: Missing expression configuration for 'form' in: " + jsonName, "error");
    logDebug(JSON.stringify(rules.form));

  }

  if (!rules.rules) {
    logDebug("ERROR: Missing expression configuration for 'rules' in: " + jsonName, "error");
    logDebug(JSON.stringify(rules.rules));

  }

  var jForm = rules.form;
  var jRules = rules.rules;
  var thisForm = expression.getValue(jForm);
  var message = getMessageStyle();
  var blockSubmit = false;

  // loop through the rules
  for (r in jRules) {
    var thisRule = jRules[r];
    var criteria = thisRule.criteria;
    var actions = thisRule.actions;

    for (a in actions) {

      var action = actions[a];
      var fieldName = action.fieldName || "";
      var required = action.required || false;
      var hidden = action.hide || false;
      var readOnly = action.readOnly || false;
      var fieldValue = action.fieldValue || null;
      var fieldMessage = action.fieldMessage || null;
      var fieldMessageLevel = action.fieldMessageLevel || "INFO";
      var confBlockSubmit = action.blockSubmit || false;
      var formMessage = action.formMessage || null;
      var formMessageLevel = action.formMessageLevel || "INFO";

      logDebug(JSON.stringify(thisRule));

      logDebug("fieldName [" + typeof(fieldName) + "]: " + fieldName);


      var fieldName = "ASI::RELEASE INFORMATION::Capacity";
      var fieldObject = expression.getValue(fieldName);

      if (fieldObject.getViewElementId != null) {

        fieldObject.required = required;
        fieldObject.hidden = hidden;
        fieldObject.readOnly = readOnly;

        if(fieldMessage!=null){
          logDebug("fieldMessageLevel: " + fieldMessageLevel)
          var formatFieldMessage = notice(fieldMessage,fieldMessageLevel);
          fieldObject.setMessage(formatFieldMessage);
        }
        
        if(fieldValue!=null){
          fieldObject.setValue(fieldValue);
        }
        expression.setReturn(fieldObject);

        if(formMessage!=null){
          message += notice(formMessage, formMessageLevel);
        }
        
        if (confBlockSubmit == true && blockSubmit == false) {
          blockSubmit = true;
        }

      }

    }

  }

  thisForm.blockSubmit = blockSubmit;
  if (showDebug) {
    message += debug;
  }

  thisForm.message = message;
  expression.setReturn(thisForm);

}

function objectExplore(objExplore) {
  var objectInfo;
  //objectInfo += "Object: " + objExplore.getClass() + br; 

  objectInfo += br;
  objectInfo += "Properties:" + br;
  for (y in objExplore) {
    if (typeof (objExplore[y]) != "function")
      objectInfo += "   " + y + " = " + objExplore[y] + br;
  }

  objectInfo += "Methods:" + br
  for (x in objExplore) {
    if (typeof (objExplore[x]) == "function")
      objectInfo += "   " + x + br;
  }


  return objectInfo;
}