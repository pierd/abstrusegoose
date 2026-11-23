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

var adventure02Instructions;
var origadventure02Instructions;
var blocker01 = document.getElementById('blocker_01');
var adventure01Countdown;
var game2WonEl;
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
	
	adventure02Instructions = document.getElementById('adventure_02_instructions');
	origAdventure02Instructions = adventure02Instructions.innerHTML;
	blocker01 = document.getElementById('blocker_01');
	game2WonEl = document.getElementById('game2won');
	
	renderer_01 = new THREE.WebGLRenderer();
	renderer_01.setClearColor(scene_01.fog.color);
	renderer_01.setPixelRatio(window.devicePixelRatio);
	renderer_01.setSize(panel_01Width-6, panel_01Height-6);
	var panel_26 = document.getElementById("panel_26");

	panel_26.appendChild(renderer_01.domElement);
	panel_26.firstChild.setAttribute("id", "renderer_01");
	
	document.getElementById("renderer_01").style.position = "absolute";
	document.getElementById("renderer_01").style.display = 'none';

	camera_01 = new THREE.PerspectiveCamera(60, panel_01Width / panel_01Height, 1, 2000);
	camera_01.position.y = 10;
	camera_01.position.x = 0;
	camera_01.position.z = 0;
	
	controls_01 = new THREE.PointerLockControls(camera_01);
	scene_01.add(controls_01.getObject());
	
	createMazeCubes();
	createGround();
	createCeiling();
	createPerimWalls();
	addLights();
	
	var startXPos = -45;
	var startZPos = 760;
	controls_01.getObject().translateX(startLeft + UNITWIDTH/2);
	controls_01.getObject().translateZ(startBottom);
	
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
		panel_26.requestPointerLock();
		adventure02Instructions.style.display = "none";
		animate();
	}
	document.addEventListener('pointerlockchange', lockChange, false);
}

function lockChange(){
	if(document.pointerLockElement === panel_26){
		blocker01.style.display = "none";
		adventure02Instructions.style.display = "none";
		controls_01.enabled = true;
		animate();
	}else{
		if(game1Won){
			unlockSequence5();
			game2WonEl.innerHTML = " ";
			return;
		}
		blocker01.style.display = "block";
		adventure02Instructions.innerHTML = " ";
		adventure02Instructions.style.display = "";
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
	
	var ladderGeometry = new THREE.CylinderGeometry(1, 1, 100, 32);
	var ladderMaterial = new THREE.MeshBasicMaterial({color: 0x008900});
	var ladderWidth = 16;
	var rungGeometry = new THREE.CylinderGeometry(1, 1, ladderWidth, 32);
	var rungMaterial = new THREE.MeshBasicMaterial({color: 0x008900});
	var rungHeight = 12;
	var rungSpacing = 10;
	
	var posterGeometry = new THREE.PlaneGeometry(30, 20);
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
					startLeft = (j - totalCubesWide / 2) * UNITWIDTH;
					startRight = startLeft + UNITWIDTH;
					startTop = (i - totalCubesWide / 2) * UNITWIDTH;
					startBottom = startTop + UNITWIDTH;
					
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
					finishLeft = (j - totalCubesWide / 2) * UNITWIDTH;
					finishRight = finishLeft + UNITWIDTH;
					finishTop = (i - totalCubesWide / 2) * UNITWIDTH;
					finishBottom = finishTop + UNITWIDTH;
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
	if(game1Over){
		blocker01.style.display = "block";
		return;
	}
	if(game1Won){
		blocker01.style.display = "block";
		game2WonEl.style.display = "block";
		return;
	}

	render();
	
	var delta = clock.getDelta();
	if(controls_01.getObject().position.z < finishBottom &&
			controls_01.getObject().position.z > finishTop &&
			controls_01.getObject().position.x > finishLeft 	&&
			controls_01.getObject().position.x < finishRight){
		game1Won = true;
	}
	animatePlayer(delta);
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
	game2WonEl.style.display = "none";
	blocker01.style.display = "block";
	adventure02Instructions.style.display = "block";
	game1Over = false;
	game1Won = false;
	controls_01.enabled = false;
	getPointerLock();
	document.getElementById("renderer_01").remove();
	init();
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

function unlockSequence5(){
	$('.sequence5 img').each(function(){
		$(this).css('display', 'block');
	});
}