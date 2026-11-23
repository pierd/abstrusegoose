$(document).ready(function(){
	var browserType = getBrowserType();
	if(browserType ==  "Chrome" || browserType == "Opera"){
		// Mirror: PointerLockControlsChrome.js was never archived; use the standard controls.
		loadScript("login_scripts/controls/PointerLockControls.js");
	}else{
		loadScript("login_scripts/controls/PointerLockControls.js");
	}
	loadScript("login_scripts/main_01.js");
	loadScript("login_scripts/login.js")
});	// end ready