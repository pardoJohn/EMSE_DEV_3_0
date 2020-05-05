/*
Title : Contact Field Settings (Expression) 
Purpose : This expression script uses configurable JSON to dynamically set required, hidden, and 
read-only on all fields in the Contact Form. Only fields that are currently visible on the form are set.

Author: Jason Plaisted
 
Functional Area : Contacts

Portlets: 
 
JSON Example :
{
    "Applicant": {
      "ssn": {
        "required": true,
        "hidden": false,
        "readOnly": false
      },
      "fein": {
        "required": false,
        "hidden": false,
        "readOnly": true
      },
      "birthDate": {
        "required": true,
        "hidden": false,
        "readOnly": false
      },
      "driverLicenseNbr": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "driverLicenseState": {
        "required": false,
        "hidden": false,
        "readOnly": true
      },
      "businessName": {
        "required": false,
        "hidden": false,
        "readOnly": true
      },
      "dbaTradeName": {
        "required": false,
        "hidden": false,
        "readOnly": true
      },
      "firstName": {
        "required": true,
        "hidden": false,
        "readOnly": false
      },
      "lastName": {
        "required": true,
        "hidden": false,
        "readOnly": false
      },
      "middleName": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "fullName": {
        "required": false,
        "hidden": false,
        "readOnly": true
      },
      "phone1": {
        "required": true,
        "hidden": false,
        "readOnly": false
      },
      "phone2": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "phone3": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "fax": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "email": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "addressLine1": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "addressLine2": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "addressLine3": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "city": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "state": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "zip": {
        "required": false,
        "hidden": false,
        "readOnly": false
      }
    },
      "DEFAULT": {
      "ssn": {
        "required": true,
        "hidden": false,
        "readOnly": false
      },
      "fein": {
        "required": false,
        "hidden": false,
        "readOnly": true
      },
      "birthDate": {
        "required": true,
        "hidden": false,
        "readOnly": false
      },
      "driverLicenseNbr": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "driverLicenseState": {
        "required": false,
        "hidden": false,
        "readOnly": true
      },
      "businessName": {
        "required": false,
        "hidden": false,
        "readOnly": true
      },
      "dbaTradeName": {
        "required": false,
        "hidden": false,
        "readOnly": true
      },
      "firstName": {
        "required": true,
        "hidden": false,
        "readOnly": false
      },
      "lastName": {
        "required": true,
        "hidden": false,
        "readOnly": false
      },
      "middleName": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "fullName": {
        "required": false,
        "hidden": false,
        "readOnly": true
      },
      "phone1": {
        "required": true,
        "hidden": false,
        "readOnly": false
      },
      "phone2": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "phone3": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "fax": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "email": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "addressLine1": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "addressLine2": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "addressLine3": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "city": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "state": {
        "required": false,
        "hidden": false,
        "readOnly": false
      },
      "zip": {
        "required": false,
        "hidden": false,
        "readOnly": false
      }
    }
  }

  Use for the following portlets
  CONTACT::FORM
  CONTACT1::FORM
  CONTACT2::FORM
  APPLICANT::FORM
  
  CONTACT::contactsModel*
  APPLICANT::applicant*
  CONTACT2::contactsModel1*
  APPLICANT::applicant*

*/
var portletName = "";

var vFormMessage = "";
var br = "<br>";
var aa = expression.getScriptRoot();
var thisForm = expression.getValue("APPLICANT::FORM")
var servProvCode=expression.getValue("$$servProvCode$$").value;
var appTypeResult=expression.getValue("CAP::capType");
var appTypeString=appTypeResult.value;
var appTypeArray=appTypeString.split("/");

// Contact Portlet Fields

var contactType=expression.getValue("APPLICANT::applicant*contactType");
var birthDate=expression.getValue("APPLICANT::applicant*birthDate");
var ssn = expression.getValue("APPLICANT::applicant*maskedSsn");
var fein = expression.getValue("APPLICANT::applicant*fein");
var driverLicenseNum = expression.getValue("APPLICANT::applicant*driverLicenseNbr");
var driverLicenseState = expression.getValue("APPLICANT::applicant*driverLicenseState");
var businessName=expression.getValue("APPLICANT::applicant*businessName");
var dbaTradeName=expression.getValue("APPLICANT::applicant*tradeName");

var firstName=expression.getValue("APPLICANT::applicant*firstName");
var middleName=expression.getValue("APPLICANT::applicant*middleName");
var lastName=expression.getValue("APPLICANT::applicant*lastName");
var fullName=expression.getValue("APPLICANT::applicant*fullName");

var phone1=expression.getValue("APPLICANT::applicant*phone1");
var phone2 = expression.getValue("APPLICANT::applicant*phone2");
var phone3=expression.getValue("APPLICANT::applicant*phone3");
var fax=expression.getValue("APPLICANT::applicant*fax");
var email=expression.getValue("APPLICANT::applicant*email");

var addressLine1=expression.getValue("APPLICANT::applicant*addressLine1");
var addressLine2=expression.getValue("APPLICANT::applicant*addressLine2");
var addressLine3=expression.getValue("APPLICANT::applicant*addressLine3");
var city=expression.getValue("APPLICANT::applicant*city");
var state=expression.getValue("APPLICANT::applicant*state");
var zip=expression.getValue("APPLICANT::applicant*zip");

function getScriptText(vScriptName, servProvCode, useProductScripts) {
	if (!servProvCode) servProvCode = aa.getServiceProviderCode();
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		if (useProductScripts) {
			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
		} else {
			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
		}
		return emseScript.getScriptText() + "";
	} catch (err) {
		return "";
	}
}

//
function matches(eVal, argList) {
	for (var i = 1; i < arguments.length; i++) {
		if (arguments[i] == eVal) {
			return true;
		}
	}
	return false;
}

eval(getScriptText("INCLUDES_EXPRESSIONS")); 

var debug=""; debug=getMessageStyle();

// Solution Configruation
var solution = "";
if(appTypeArray.length > 0){
	solution = appTypeArray[0] + "_";
}
var jsonFileSuffix = "CONTACT_FIELD_SETTINGS";
var jsonName = "CONF_" + solution + jsonFileSuffix;

var cfgJsonStr = getScriptText(jsonName);
	if (matches(cfgJsonStr,null,"")) {
		logDebug("Error: Unable to load JSON Configuration " + jsonName,"error");
  }
  else{
    var cfgJsonObj
    try{
      cfgJsonObj = JSON.parse(cfgJsonStr);


      if(cfgJsonObj && contactType && contactType.value != ""){
      var contactTypeRules = cfgJsonObj[contactType.value];
      
      if (typeof(contactTypeRules) != "object"){
        contactTypeRules = cfgJsonObj["DEFAULT"];
      }
      
        if (typeof(contactTypeRules) == "object"){
          // getViewElementId() tells us if the field is on the form
          if(ssn.getViewElementId() != null){
            ssn.required = contactTypeRules["ssn"].required
            ssn.hidden = contactTypeRules["ssn"].hidden
            ssn.readOnly = contactTypeRules["ssn"].readOnly
            expression.setReturn(ssn);
          }
      
          if(fein.getViewElementId() != null){
            fein.required = contactTypeRules["fein"].required
            fein.hidden = contactTypeRules["fein"].hidden
            fein.readOnly = contactTypeRules["fein"].readOnly
            expression.setReturn(fein);
          }
          if(birthDate.getViewElementId() != null){
            birthDate.required = contactTypeRules["birthDate"].required
            birthDate.hidden = contactTypeRules["birthDate"].hidden
            birthDate.readOnly = contactTypeRules["birthDate"].readOnly
            expression.setReturn(birthDate);
          }
          if(driverLicenseNum.getViewElementId() != null){
            driverLicenseNum.required = contactTypeRules["driverLicenseNum"].required
            driverLicenseNum.hidden = contactTypeRules["driverLicenseNum"].hidden
            driverLicenseNum.readOnly = contactTypeRules["driverLicenseNum"].readOnly
            expression.setReturn(driverLicenseNum);
          }
          if(driverLicenseState.getViewElementId() != null){
            driverLicenseState.required = contactTypeRules["driverLicenseState"].required
            driverLicenseState.hidden = contactTypeRules["driverLicenseState"].hidden
            driverLicenseState.readOnly = contactTypeRules["driverLicenseState"].readOnly
            expression.setReturn(driverLicenseState);
          }
      
          if(businessName.getViewElementId() != null){
            businessName.required = contactTypeRules["businessName"].required
            businessName.hidden = contactTypeRules["businessName"].hidden
            businessName.readOnly = contactTypeRules["businessName"].readOnly
            expression.setReturn(businessName);
          }
          if(dbaTradeName.getViewElementId() != null){
            dbaTradeName.required = contactTypeRules["dbaTradeName"].required
            dbaTradeName.hidden = contactTypeRules["dbaTradeName"].hidden
            dbaTradeName.readOnly = contactTypeRules["dbaTradeName"].readOnly
            expression.setReturn(dbaTradeName);
          }
          if(firstName.getViewElementId() != null){
            firstName.required = contactTypeRules["firstName"].required
            firstName.hidden = contactTypeRules["firstName"].hidden
            firstName.readOnly = contactTypeRules["firstName"].readOnly
            expression.setReturn(firstName);
          }
          if(lastName.getViewElementId() != null){
            lastName.required = contactTypeRules["lastName"].required
            lastName.hidden = contactTypeRules["lastName"].hidden
            lastName.readOnly = contactTypeRules["lastName"].readOnly
            expression.setReturn(lastName);
          }
          if(middleName.getViewElementId() != null){
            middleName.required = contactTypeRules["middleName"].required
            middleName.hidden = contactTypeRules["middleName"].hidden
            middleName.readOnly = contactTypeRules["middleName"].readOnly
            expression.setReturn(middleName);
          }
          if(fullName.getViewElementId() != null){
            fullName.required = contactTypeRules["fullName"].required
            fullName.hidden = contactTypeRules["fullName"].hidden
            fullName.readOnly = contactTypeRules["fullName"].readOnly
            expression.setReturn(fullName);
          }
      
          if(phone1.getViewElementId() != null){
            phone1.required = contactTypeRules["phone1"].required
            phone1.hidden = contactTypeRules["phone1"].hidden
            phone1.readOnly = contactTypeRules["phone1"].readOnly
            expression.setReturn(phone1);
          }
          if(phone2.getViewElementId() != null){
            phone2.required = contactTypeRules["phone2"].required
            phone2.hidden = contactTypeRules["phone2"].hidden
            phone2.readOnly = contactTypeRules["phone2"].readOnly
            expression.setReturn(phone2);
          }
          if(phone3.getViewElementId() != null){
            phone3.required = contactTypeRules["phone3"].required
            phone3.hidden = contactTypeRules["phone3"].hidden
            phone3.readOnly = contactTypeRules["phone3"].readOnly
            expression.setReturn(phone3);
          }
          if(fax.getViewElementId() != null){
            fax.required = contactTypeRules["fax"].required
            fax.hidden = contactTypeRules["fax"].hidden
            fax.readOnly = contactTypeRules["fax"].readOnly
            expression.setReturn(fax);
          }
          if(email.getViewElementId() != null){
            email.required = contactTypeRules["email"].required
            email.hidden = contactTypeRules["email"].hidden
            email.readOnly = contactTypeRules["email"].readOnly
            expression.setReturn(email);
          }
          if(addressLine1.getViewElementId() != null){
            addressLine1.required = contactTypeRules["addressLine1"].required
            addressLine1.hidden = contactTypeRules["addressLine1"].hidden
            addressLine1.readOnly = contactTypeRules["addressLine1"].readOnly
            expression.setReturn(addressLine1);
          }
          if(addressLine2.getViewElementId() != null){
            addressLine2.required = contactTypeRules["addressLine2"].required
            addressLine2.hidden = contactTypeRules["addressLine2"].hidden
            addressLine2.readOnly = contactTypeRules["addressLine2"].readOnly
            expression.setReturn(addressLine2);
          }
          if(addressLine3.getViewElementId() != null){
            addressLine3.required = contactTypeRules["addressLine3"].required
            addressLine3.hidden = contactTypeRules["addressLine3"].hidden
            addressLine3.readOnly = contactTypeRules["addressLine3"].readOnly
            expression.setReturn(addressLine3);
          }		
          if(city.getViewElementId() != null){
            city.required = contactTypeRules["city"].required
            city.hidden = contactTypeRules["city"].hidden
            city.readOnly = contactTypeRules["city"].readOnly
            expression.setReturn(city);
          }
          if(state.getViewElementId() != null){
            state.required = contactTypeRules["state"].required
            state.hidden = contactTypeRules["state"].hidden
            state.readOnly = contactTypeRules["state"].readOnly
            expression.setReturn(state);
          }
          if(zip.getViewElementId() != null){
            zip.required = contactTypeRules["zip"].required
            zip.hidden = contactTypeRules["zip"].hidden
            zip.readOnly = contactTypeRules["zip"].readOnly
            expression.setReturn(zip);
          }
      
        }
        
        
      }
    }
    catch(err){
      logDebug("ERROR: Unable to parse " + cfgJsonStr + " Error Message:" + err.message);
    }

  }


  if (debug.indexOf("ERROR") > 0){
    vFormMessage += debug;
  }
thisForm.message=vFormMessage;
expression.setReturn(thisForm);

function objectExplore(objExplore){
var objectInfo;
//objectInfo += "Object: " + objExplore.getClass() + br; 

objectInfo += "Methods:" + br
for (x in objExplore) {
	if (typeof(objExplore[x]) == "function") 
		objectInfo += "   " + x + br;
}

objectInfo += br;
objectInfo += "Properties:" + br;
for (x in objExplore) {
	if (typeof(objExplore[x]) != "function") 
		objectInfo += "   " + x + " = " + objExplore[x] + br;
}
return objectInfo;
}