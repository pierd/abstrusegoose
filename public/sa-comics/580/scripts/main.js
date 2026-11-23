$(document).ready(function(){
	var browserType = getBrowserType();
	if(browserType ==  "Chrome" || browserType == "Opera"){
		// Mirror: PointerLockControlsChrome.js was never archived; use the standard controls.
		loadScript("scripts/controls/PointerLockControls.js");
		loadScript("scripts/main_01.js");
	}else{
		loadScript("scripts/controls/PointerLockControls.js");
		loadScript("scripts/main_01.js");
	}
});	// end ready
