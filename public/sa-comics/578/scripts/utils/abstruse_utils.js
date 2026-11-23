// As of 240118, this works for Opera, Firefox, Chrome, Edge, IE, and Safari.
// Returns string: "Opera", "Firefox", "Chrome", "Edge", "IE", "Safari"

function getBrowserType(){
	// Opera 8.0+
	var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

	// Firefox 1.0+
	var isFirefox = typeof InstallTrigger !== 'undefined';

	// Safari 3.0+ "[object HTMLElementConstructor]" 
	var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

	// Internet Explorer 6-11
	var isIE = /*@cc_on!@*/false || !!document.documentMode;

	// Edge 20+
	var isEdge = !isIE && !!window.StyleMedia;

	// Chrome 1+
	var isChrome = !!window.chrome && !!window.chrome.webstore;
	
	if(isOpera)
		return "Opera";
	else if(isFirefox)
		return "Firefox";
	else if(isSafari)
		return "Safari";
	else if(isIE)
		return "IE";
	else if(isEdge)
		return "Edge";
	else if(isChrome)
		return "Chrome";
		
}

function loadScript(src) {
	var js = document.createElement('script');
	js.src = src;
	js.onload = function() {
		//
	};
	js.onerror = function() {
		//alert('Failed to load script' + src);
	};
	document.head.appendChild(js);
}
