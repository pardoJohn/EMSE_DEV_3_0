//renew license
try{
	sepRenewLicensePayment();
}catch(err){
	logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: Renew license: " + err.message);
	logDebug(err.stack)
}