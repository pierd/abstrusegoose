var basilisk = new Image();
var ast1 = new Image();
var ast2 = new Image();
var ast3 = new Image();
var numGraphImagesToLoad = 4;
var numGraphImagesLoaded = 0;

function loaded(){
	numGraphImagesLoaded++;
	if(numGraphImagesLoaded === numGraphImagesToLoad){
		loadScript('scripts/graph.js');
	}
}

basilisk.onload = function(){
	loaded();
}
ast1.onload = function(){
	loaded();
}
ast2.onload = function(){
	loaded();
}
ast3.onload = function(){
	loaded();
}

basilisk.src = 'images/basilisk_base.png';
ast1.src = 'images/ast1.png';
ast2.src = 'images/ast2.png';
ast3.src = 'images/ast3.png';

