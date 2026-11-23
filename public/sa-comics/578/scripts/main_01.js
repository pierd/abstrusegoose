var sequenceNumber = 1;
var UNITWIDTH = 90;
var UNITHEIGHT = 45;
var camera_01, scene_01, renderer_01;
var mapSize;
var totalCubesWide;
var collidableObjects = [];
var controls_01;
var controls_01Enabled = false;
var blocker = document.getElementById('blocker');
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var playerVelocity = new THREE.Vector3();
var PLAYERSPEED = 800.0;
var clock;
var countDownStart = 60;
var countDown = countDownStart;
var accum = 0;
var game1Over = false;
var game1Won = false;

var panel_01Width = 240;
var panel_01Height = 180;

var loader = new THREE.JSONLoader();
var textureLoader = new THREE.TextureLoader();
var PLAYERCOLLISIONDISTANCE = 20;

var adventure01Instructions;
var origAdventure01Instructions;
var blocker01 = document.getElementById('blocker_01');
var adventure01Countdown;
var game1OverMsg;
var game1OverEl;
var game1WonEl;
var map1Canvas;
var map1Context;
var map1PlayerCanvas;
var map1PlayerContext;
var map1Width;
var map1Height;
var map1PlayerWidth = 4;
var map1PlayerHeight = 4;

var mapX;
var mapY;
var cubeMapX;
var cubeMapY;
var cubeMapUnitWidth;
var cubeMapUnitHeight;
var cubeMapWidthOffset;
var cubeMapHeightOffset;
var camera_01OrigDirection;
var widthOffset;
var heightOffset;
var finishLeft;
var finishRight;
var finishTop;
var finishBottom;
					
init_maze();
getPointerLock();
render();

function init_maze(){
	clock = new THREE.Clock();
	listenForPlayerMovement();
	scene_01 = new THREE.Scene();
	scene_01.fog = new THREE.FogExp2(0xcccccc, 0.0015);
	
	adventure01Instructions = document.getElementById('adventure_01_instructions');
	origAdventure01Instructions = adventure01Instructions.innerHTML;
	if(sequenceNumber === 1){
		blocker01 = document.getElementById('blocker_01');
	}
	if(sequenceNumber === 4){
		blocker01 = document.getElementById('blocker_02');
	}
	adventure01Countdown = document.getElementById('adventure_01_countdown');
	adventure01Countdown.innerHTML = countDownStart;
	game1OverMsg = document.getElementById('gameover_msg_01');
	game1OverEl = document.getElementById('game1over');
	game1WonEl = document.getElementById('game1won');
	map1Canvas = document.getElementById('map1');
	map1Context = map1Canvas.getContext('2d');
	map1PlayerCanvas = document.getElementById('map1player');
	map1PlayerContext = map1PlayerCanvas.getContext('2d');
	map1PlayerContext.fillStyle = 'rgb(0, 162, 232)';
	map1Width = map1Canvas.width;
	map1Height = map1Canvas.height;
	
	renderer_01 = new THREE.WebGLRenderer();
	renderer_01.setClearColor(scene_01.fog.color);
	renderer_01.setPixelRatio(window.devicePixelRatio);
	renderer_01.setSize(panel_01Width-6, panel_01Height-6);

	var panel_16 = document.getElementById("panel_16");
	panel_16.style.display = "block";
	panel_16.appendChild(renderer_01.domElement);

	camera_01 = new THREE.PerspectiveCamera(60, panel_01Width / panel_01Height, 1, 2000);
	camera_01.position.y = 10;
	camera_01.position.x = 0;
	camera_01.position.z = 0;
	
	controls_01 = new THREE.PointerLockControls(camera_01);
	scene_01.add(controls_01.getObject());
	
	var startXPos = -45;
	var startZPos = 760;
	controls_01.getObject().translateX(-45);
	controls_01.getObject().translateZ(760);
	
	createMazeCubes();
	createGround();
	createCeiling();
	createPerimWalls();
	addLights();

	cubeMapUnitWidth = UNITWIDTH*map1Height/mapSize;
	cubeMapUnitHeight = UNITWIDTH*map1Height/mapSize;
	cubeMapWidthOffset = widthOffset * map1Height/(mapSize);
	cubeMapHeightOffset = widthOffset * map1Height/(mapSize);

	mapX = (mapSize/2 + startXPos) * map1Height/mapSize + (map1Width - map1Height)/2 + cubeMapWidthOffset - map1PlayerWidth/2;
	mapY = (mapSize/2 + startZPos) * map1Height/mapSize + cubeMapHeightOffset - map1PlayerHeight/2;
	map1PlayerContext.fillRect(mapX, mapY, map1PlayerWidth, map1PlayerHeight);
	
	window.addEventListener('resize', onWindowResize, false);
}

function listenForPlayerMovement(){
	var onKeyDown = function(event){
		switch(event.keyCode){
			case 38: //up
			case 87: //w
				moveForward = true;
				break;
			case 37: // left
			case 65: // a
				moveLeft = true;
				break;
			case 40: // down
			case 83: //s
				moveBackward = true;
				break;
			case 39: // right
			case 68: // d
				moveRight = true;
				break;
		}
	};
	var onKeyUp = function(event){
		switch(event.keyCode){
			case 38: // up
			case 87: // w
				moveForward = false;
				break;
			case 37: // left
			case 65: // a
				moveLeft = false;
				break;
			case 40: // down
			case 83: // s
				moveBackward = false;
				break;
			case 39: // right
			case 68: //d
				moveRight = false;
				break;
		}
	};
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
}

function getPointerLock(){
	blocker01.onclick = function(){
		panel_16.requestPointerLock();
		adventure01Instructions.style.display = "none";
		game1OverEl.style.display = "none";
		animate();
	}
	document.addEventListener('pointerlockchange', lockChange, false);
}

function lockChange(){
	if(document.pointerLockElement === panel_16){
		blocker01.style.display = "none";
		adventure01Instructions.style.display = "none";
		game1OverEl.style.display = "none";
		controls_01.enabled = true;
		animate();
		animateMap1();
	}else{
		if(game1Over){
			blocker01.style.display = "none";
			game1OverEl.style.display = "none";
			adventure01Instructions.style.display = "none";
			location.reload();
		}
		if(game1Won){
			unlockSequence2();
			game1WonEl.innerHTML = " ";
			return;
		}
		blocker01.style.display = "";
		adventure01Instructions.innerHTML = " ";
		adventure01Instructions.style.display = "";
		controls_01.enabled = false;
	}
}

function createMazeCubes(){

	var map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,],
        [1, 0, 0, 0, 1, 'e', 1, 0, 0, 0, 0, 0, 0, 0, 1, 'x', 1, 0, 1, 1,],
        [1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1,],
        [1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1,],
        [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1,],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1,],
        [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1,],
        [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1,],
        [1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1,],
        [1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1,],
        [1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 'e', 1, 1, 0, 0, 1,],
        [1, 'e', 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1,],
        [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1,],
        [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 'e', 1, 1, 0, 1,],
        [1, 'e', 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1,],
        [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1,],
        [1, 1, 0, 0, 0, 0, 1, 1, 'e', 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1,],
        [1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1,],
        [1, 1, 1, 1, 1, 0, 0, 0, 1, 's', 1, 1, 0, 0, 0, 0, 0, 0, 0, 1,],
        [1, 1, 1, 1, 1, 1, 1, 'e', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,]
    ];

	var cubeGeo = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT, UNITWIDTH);
	var cubeMat;
	var brickTexture = new THREE.TextureLoader().load("images/brickwall.png");
	var cubeMat = new THREE.MeshBasicMaterial({
		map: brickTexture,
		side: THREE.DoubleSide
	});
	
	widthOffset = UNITWIDTH / 2;
	heightOffset = UNITHEIGHT / 2;
	totalCubesWide = map[0].length;
	mapSize = totalCubesWide * UNITWIDTH;
	
	var cubeMapX;
	var cubeMapY;
	var cubeMapUnitWidth = UNITWIDTH*map1Height/mapSize;
	var cubeMapUnitHeight = UNITWIDTH*map1Height/mapSize;
	var cubeMapWidthOffset = widthOffset * map1Height/(mapSize);
	var cubeMapHeightOffset = widthOffset * map1Height/(mapSize);
	
	var ladderGeometry = new THREE.CylinderGeometry(1, 1, 100, 32);
	var ladderMaterial = new THREE.MeshBasicMaterial({color: 0x008900});
	var ladderWidth = 16;
	var rungGeometry = new THREE.CylinderGeometry(1, 1, ladderWidth, 32);
	var rungMaterial = new THREE.MeshBasicMaterial({color: 0x008900});
	var rungHeight = 12;
	var rungSpacing = 10;
	
	var posterGeometry = new THREE.PlaneGeometry(30, 20);
	
	map1Context.fillStyle = '#A0522D';
	map1Context.fillRect(0, 0, map1Width, map1Height);
	map1Context.fillStyle = '#111111';
	var posterIdx = 0;
	var posterArr = ['images/brickwall01.png',
										'images/brickwall02.png',
										'images/brickwall03.png',
										'images/brickwall04.png',
										'images/brickwall05.png',
										'images/brickwall06.png',
										'images/brickwall07.png'];
	for(var i = 0; i < totalCubesWide; i++){
		for(var j = 0; j < map[i].length; j++){
			if(map[i][j]){
				if(map[i][j] === 'x'){
					// draw x
					map1Context.strokeStyle = '#00FF00';
				
					var xLeft = (mapSize/2+cube.position.x)*map1Height/(mapSize) + (map1Width - map1Height)/2 + UNITWIDTH*map1Height/(mapSize);
					var xRight = xLeft + UNITWIDTH*map1Height/(mapSize);
					var xTop = (mapSize/2+cube.position.z)*map1Height/(mapSize);
					var xBottom = xTop + UNITWIDTH*map1Height/(mapSize);
					map1Context.beginPath();
					map1Context.moveTo(xLeft, xTop);
					map1Context.lineTo(xRight, xBottom);
					map1Context.closePath();
					map1Context.stroke();
					
					map1Context.beginPath();
					map1Context.moveTo(xLeft, xBottom);
					map1Context.lineTo(xRight, xTop);
					map1Context.closePath();
					map1Context.stroke();
					
					finishLeft = (j - totalCubesWide / 2) * UNITWIDTH;
					finishRight = finishLeft + UNITWIDTH;
					finishTop = (i - totalCubesWide / 2) * UNITWIDTH;
					finishBottom = finishTop + UNITWIDTH;
					
					// draw ladder
					var ladder2Side1 = new THREE.Mesh(ladderGeometry, ladderMaterial);
					var ladder2Side2 = new THREE.Mesh(ladderGeometry, ladderMaterial);
					ladder2Side1.position.z = (i - totalCubesWide / 2) * UNITWIDTH + 2;
					ladder2Side1.position.y = 0;
					ladder2Side1.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset - ladderWidth/2;
					scene_01.add(ladder2Side1);
					
					ladder2Side2.position.z = (i - totalCubesWide / 2) * UNITWIDTH + 2;
					ladder2Side2.position.y = 0;
					ladder2Side2.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset + ladderWidth/2;
					scene_01.add(ladder2Side2);
					rungHeight = 12;
					for(var k = 0; k < 6; k++){
						var rung = new THREE.Mesh(rungGeometry, rungMaterial);
						rung.position.z = (i - totalCubesWide / 2) * UNITWIDTH + 2;
						rung.position.y = rungHeight;
						rung.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
						rung.rotation.z = degreesToRadians(90);
						scene_01.add(rung);
						rungHeight += rungSpacing;
					}
					
				}else if(map[i][j] === 's'){
					// draw ladder
					var ladder1Side1 = new THREE.Mesh(ladderGeometry, ladderMaterial);
					var ladder1Side2 = new THREE.Mesh(ladderGeometry, ladderMaterial);
					ladder1Side1.position.z = (i - totalCubesWide / 2) * UNITWIDTH + UNITWIDTH - 2;
					ladder1Side1.position.y = 0;
					ladder1Side1.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset - ladderWidth/2;
					scene_01.add(ladder1Side1);
					
					ladder1Side2.position.z = (i - totalCubesWide / 2) * UNITWIDTH + UNITWIDTH - 2;
					ladder1Side2.position.y = 0;
					ladder1Side2.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset + ladderWidth/2;
					scene_01.add(ladder1Side2);
					var rungHeight = 12;
					for(var k = 0; k < 6; k++){
						var rung = new THREE.Mesh(rungGeometry, rungMaterial);
						rung.position.z = (i - totalCubesWide / 2) * UNITWIDTH + UNITWIDTH - 2;
						rung.position.y = rungHeight;
						rung.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
						rung.rotation.z = degreesToRadians(90);
						scene_01.add(rung);
						rungHeight += rungSpacing;
					}
				}else{
					if(map[i][j] === 'e'){
						var posterTexture = new THREE.TextureLoader().load(posterArr[posterIdx]);
						var posterMat = new THREE.MeshBasicMaterial({
							map: posterTexture,
							side: THREE.DoubleSide
						});
						var cube = new THREE.Mesh(cubeGeo, posterMat);
						cube.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
						cube.position.y = heightOffset;
						cube.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
						scene_01.add(cube);
						collidableObjects.push(cube);
						posterIdx++;
					}else{
						var cube = new THREE.Mesh(cubeGeo, cubeMat);
						cube.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
						cube.position.y = heightOffset;
						cube.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
						scene_01.add(cube);
						collidableObjects.push(cube);
					}
					
					
					// draw map
					cubeMapX = (mapSize/2+cube.position.x)*map1Height/(mapSize) + (map1Width - map1Height)/2;
					cubeMapY = (mapSize/2+cube.position.z)*map1Height/(mapSize);
					map1Context.fillRect(cubeMapX, cubeMapY, cubeMapUnitWidth, cubeMapUnitHeight);
				}
			}
		}
	}
}

function createGround(){
	var groundGeo = new THREE.PlaneGeometry(mapSize, mapSize);
	var groundMat = new THREE.MeshPhongMaterial({color: 0xA0522D, side: THREE.DoubleSide});
	var ground = new THREE.Mesh(groundGeo, groundMat);
	ground.position.set(0, 1, 0);
	ground.rotation.x = degreesToRadians(90);
	scene_01.add(ground);
}

function createCeiling(){
	var ceilingGeo = new THREE.PlaneGeometry(mapSize, mapSize);
	var ceilingMat = new THREE.MeshPhongMaterial({color: 0x000000, side: THREE.DoubleSide});
	var ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
	ceiling.position.set(0, UNITHEIGHT, 0);
	ceiling.rotation.x = degreesToRadians(90);
	scene_01.add(ceiling);
}

function createPerimWalls(){
	var halfMap = mapSize / 2;
	var sign = 1;
	
	for(i = 0; i < 2; i++){
		var perimGeo = new THREE.PlaneGeometry(mapSize, UNITHEIGHT);
		var perimMat = new THREE.MeshPhongMaterial({color: 0x464646, side: THREE.DoubleSide});
		var perimWallLR = new THREE.Mesh(perimGeo, perimMat);
		var perimWallFB = new THREE.Mesh(perimGeo, perimMat);
		
		perimWallLR.position.set(halfMap * sign, UNITHEIGHT / 2, 0);
		perimWallLR.rotation.y = degreesToRadians(90);
		scene_01.add(perimWallLR);
		collidableObjects.push(perimWallLR);
		
		perimWallFB.position.set(0, UNITHEIGHT / 2, halfMap * sign);
		scene_01.add(perimWallFB);
		collidableObjects.push(perimWallFB);
		
		sign = -1;
	}
}

function addLights(){
	var lightOne = new THREE.DirectionalLight(0xffffff);
	lightOne.position.set(1, 1, 1);
	scene_01.add(lightOne);
	
	var lightTwo = new THREE.DirectionalLight(0xffffff, 0.5);
	lightTwo.position.set(1, -1, -1);
	scene_01.add(lightTwo);
}

function onWindowResize(){
	camera_01.aspect = panel_01Width / panel_01Height;
	camera_01.updateProjectionMatrix();
	renderer_01.setSize(panel_01Width-6, panel_01Height-6);
}

function animate(){

	 //tmp
	//if(controls_01.getObject().position.z > 200){
	//	game1Won = true;
	//}

	if(game1Over){
		adventure01Countdown.style.display = "none";
		blocker01.style.display = "block";
		game1OverEl.style.display = "block";
		return;
	}
	if(game1Won){
		adventure01Countdown.style.display = "none";
		blocker01.style.display = "block";
		game1WonEl.style.display = "block";
		return;
	}

	render();
	
	var delta = clock.getDelta();
	if(controls_01.enabled){
		accum += delta;
	}
	
	if(accum >= 1){
		countDown -= 1;
		accum = 0;
		adventure01Countdown.innerHTML = countDown;
	}
	if(countDown <= 0){
		game1Over = true;
	}
	if(controls_01.getObject().position.z < finishBottom &&
			controls_01.getObject().position.z > finishTop &&
			controls_01.getObject().position.x > finishLeft 	&&
			controls_01.getObject().position.x < finishRight){
		game1Won = true;
	}
	animatePlayer(delta);
	animateMap1();
	
	requestAnimationFrame(animate);
}


function animateMap1(){
	map1PlayerContext.clearRect(0, 0, map1Width, map1Height);
	mapX = (mapSize/2 + controls_01.getObject().position.x) * map1Height/mapSize + (map1Width - map1Height)/2 + cubeMapWidthOffset - map1PlayerWidth/2;
	mapY = (mapSize/2 + controls_01.getObject().position.z) * map1Height/mapSize + cubeMapHeightOffset - map1PlayerHeight/2;
	map1PlayerContext.fillRect(mapX, mapY, map1PlayerWidth, map1PlayerHeight);
}

function animatePlayer(delta){
	playerVelocity.x -= playerVelocity.x * 10.0 * delta;
	playerVelocity.z -= playerVelocity.z * 10.0 * delta;
	
	if(detectPlayerCollision() == false){
		if(moveForward){
			playerVelocity.z -= PLAYERSPEED * delta;
		}
		if(moveBackward){
			playerVelocity.z += PLAYERSPEED * delta;
		}
		if(moveLeft){
			playerVelocity.x -= PLAYERSPEED * delta;
		}
		if(moveRight){
			playerVelocity.x += PLAYERSPEED * delta;
		}
		controls_01.getObject().translateX(playerVelocity.x * delta);
		controls_01.getObject().translateZ(playerVelocity.z * delta);
		
	}else{
		playerVelocity.x = 0;
		playerVelocity.z = 0;
	}
}

function resetGame1(){
	game1OverEl.style.display = "none";
	game1WonEl.style.display = "none";
	blocker01.style.display = "block";
	adventure01Instructions.style.display = "block";
	adventure01Countdown.style.display = "block";

	accum = 0;
	countDown = countDownStart;
	adventure01Countdown.innerHTML = countDown;
	game1Over = false;
	game1Won = false;
	controls_01.enabled = false;
	
	document.getElementById("renderer_01").remove();
	init_maze();
	getPointerLock();
	render();
}

function detectPlayerCollision(){
	var rotationMatrix;
	var camera_01Direction = controls_01.getDirection(new THREE.Vector3(0, 0, 0)).clone();
	
	if(moveBackward){
     rotationMatrix = new THREE.Matrix4();
     rotationMatrix.makeRotationY(degreesToRadians(180));
  }else if(moveLeft){
    rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(degreesToRadians(90));
  }else if(moveRight){
    rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(degreesToRadians(270));
  }
  if (rotationMatrix !== undefined) {
    camera_01Direction.applyMatrix4(rotationMatrix);
  }
  var rayCaster = new THREE.Raycaster(controls_01.getObject().position, camera_01Direction);
  if (rayIntersect(rayCaster, PLAYERCOLLISIONDISTANCE)){
    return true;
  }else{
    return false;
  }
}

function rayIntersect(ray, distance){
  var intersects = ray.intersectObjects(collidableObjects);
  for(var i = 0; i < intersects.length; i++){
    if(intersects[i].distance < distance){
      return true;
     }
  }
  return false;
}

function render(){
	renderer_01.render(scene_01, camera_01);
}

function degreesToRadians(degrees){
	return degrees * Math.PI / 180;
}

function radiansToDegrees(radians){
	return radians * 180 / Math.PI;
}

	function unlockSequence2(){
		$('.sequence2 img').each(function(){
			$(this).css('display', 'block');
		});
		$('#game2').css('display', 'block');
		loadScript("scripts/main_02.js");
}