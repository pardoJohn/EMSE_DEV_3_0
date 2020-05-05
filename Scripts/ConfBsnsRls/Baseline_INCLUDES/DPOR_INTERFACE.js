/*
 * Purpose: invoke DPOR api and return result
 * */

/**
 * Invokes he DPOR service and returns the XML object
 * @param {string} licNbr
 * @param {string} token
 * @param {URL} serviceURL
 * @return {SOAPResponseObject}
 */
function invokeDPOR(licNbr,token,serviceURL){
	var respObj = new soapRespObj();
	
	//Set Namespaces and SOAP Envelope
	var soapenv = new Namespace("http://schemas.xmlsoap.org/soap/envelope/");
	var urn = new Namespace("urn:VadporLicLkpService");
	var licSearch = <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:VadporLicLkpService"><soapenv:Header/><soapenv:Body><urn:searchLicense><clientIp>10.111.18.13</clientIp><licNbr/><name/><addr/><board/><clntCde/><token/></urn:searchLicense></soapenv:Body></soapenv:Envelope>;
	
	licSearch.soapenv::Body.urn::searchLicense.licNbr = licNbr;
	licSearch.soapenv::Body.urn::searchLicense.token = token;
	
	//make the Web Service Call returns a success or throws http500 if no license found
	var httpReq = aa.util.httpPostToSoapWebService(serviceURL, licSearch.toString(), "", "", "");
	if(httpReq.getSuccess()){
		var tmpResp = httpReq.getOutput();
		tmpResp = tmpResp.replace('<?xml version="1.0" encoding="UTF-8"?>',"");
		tmpResp = tmpResp.replace("&","&");
		
		eval("var httpResp = " + tmpResp.toString() + ";"); //Eval it as XML
		
		if(httpResp.soapenv::Body.soapenv::Fault.toString() != ""){
			//Web Service SOAP Error
			respObj.isErr = true;
			respObj.errorMessage = httpResp.soapenv::Body.soapenv::Fault.detail.fault.errorMessage.toString();
		}
		else if (httpResp.soapenv::Body.urn::searchLicenseResponse.searchLicenseReturn.toString() == ""){
			respObj.isErr = true;
			respObj.errorMessage = "License Not Found";
		}
		else{
			//Web Service OK populated DPOR Object			
			var tmpObj = httpResp.soapenv::Body.urn::searchLicenseResponse.searchLicenseReturn.item;
			var licObj = new dporObj(tmpObj);
			respObj.respObj = licObj;
		}
	}
	else{
		respObj.isErr = true;
		respObj.errorMessage = "License Not Found";
	}
	
	return respObj;
};

/**
 * Creates SOAPResponsObject that is returned by DPOR Interface
 */
function soapRespObj(){
	this.isErr = false; //true if soap Error
	this.respObj = null; //response object
	this.errorMessage = ""; //should be popualted if true;
};

/**
 * Reads the SOAP response from DPOR
 * @param {XMLDocument} lpObj
 * @return {dporObject}
 */
function dporObj(lpObj){
	
	this.licNbr = lpObj.licNbr.toString();
	this.fName = lpObj.addr.firstNme.toString();
	this.mName = lpObj.addr.middleNme.toString();
	this.lName = lpObj.addr.lastNme.toString();
	this.entTypCde=lpObj.entTypCde.toString();
	this.boardNme=lpObj.boardNme.toString();
	this.busName = lpObj.addr.keyNme.toString();
	this.DBATradeName=lpObj.addr.dba.toString();
	var amp = new RegExp("&", "g");
	this.busName = this.busName.replace(amp,"&");
	this.address1 = (lpObj.addr.strAddrNbr.toString() + " " + lpObj.addr.addrLine1.toString()).trim();
	this.address2 = lpObj.addr.addrLine2.toString();
	this.city = lpObj.addr.addrCty.toString();
	this.state = lpObj.addr.stCde.toString();
	this.zip = lpObj.addr.addrZip.toString().replace("-","");
	if(this.zip.length > 5){
		this.zip = this.zip.substring(0,5);
	}
	this.issueDate = getFormatedDate(lpObj.origDte.toString());
	this.expireDate = getFormatedDate(lpObj.exprDte.toString());
	this.licStatus = lpObj.licStaDesc.toString();
	this.rankDesc=lpObj.rankDesc.toString();
	this.rank =  lpObj.rankCde.toString();
	this.codes = new Array();
	//Build comments for display purposes
	this.comments = "";
	for (x in lpObj.mdfs.item){
		this.comments += "\n" + lpObj.mdfs.item[x].modDesc.toString() + " (" + lpObj.mdfs.item[x].modCde.toString() + ")";;
		this.codes.push(lpObj.mdfs.item[x].modCde.toString());
	}

	
	return this;
};

function getFormatedDate(date) {
	if(date==null && date=="")
		return "";
	var today = new Date(date);
	var dd = today.getDate();
	var mm = today.getMonth() + 1;
	var yy = today.getFullYear();
	var formatedDate = mm + '/' + dd + '/' + yy;
	return formatedDate;
}
