/*
01_022618_01 =>
prettygood19 =>

spec used for training:
	spec.update = 'qlearn';
	spec.gamma = 0.9;
	spec.epsilon = 0.2;
	spec.alpha = 0.005;
	spec.experience_add_every = 10;
	spec.experience_size = 5000;
	spec.learning_steps_per_iteration = 20;
	spec.tderror_clamp = 1.0;
	spec.num_hidden_units = 256;
*/

// evil global vars
var UNITWIDTH = 90;
var UNITHEIGHT = 45;
var camera_01, scene_01, renderer_01;
var mapSize;
var mapDiag;
var totalCubesWide;
var collidableObjects = [];
var controls_01;
var controls_01Enabled = false;
var blocker;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var playerVelocity = new THREE.Vector3();
var PLAYERSPEED = 800.0;
var clock;
var MINIONSCALE = 15;
var MINIONSPEED = 2400.0;
var minion;
var minionVelocity = new THREE.Vector3();
var minionAction;
var minionX;
var minionY;
var minionWidth = 30;
var PACKAGESCALE = 5;
var packageWidth = 10;
var amzpackage;
var numPackagesAcquired = 0;
var livesWasted = 0;
var captured = false;
var gameOver = false;
var gameWon = false;
var targetScore = 5;
var gameArenaWidth = 240;
var gameArenaHeight = 240;

var loader = new THREE.JSONLoader();
var textureLoader = new THREE.TextureLoader();
var PLAYERCOLLISIONDISTANCE = 20;
var MINIONCOLLISIONDISTANCE = 20;

var instructions;
var gameArena;
var gameOverMsg;
var gameOverEl;
var capturedEl;
var gameWonMsg;
var gameWonEl;
var book1;
var book2;
var book3;
var book4;
var book5;
var restartCountdownEl;
var mapCanvas;
var mapContext;
var mapPlayerCanvas;
var mapPlayerContext;
var mapWidth;
var mapHeight;
var mapPlayerWidth = 6;
var mapPlayerHeight = 6;
var mappackageWidth = 6;
var mapPackageHeight = 6;
var playerWidth = 30;
var packageX;
var packageY;
var packageAcquired = false;
var package_dx;
var package_dy;
var package_dst;

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
var requestId;
var midEsc = false;

var env;
var state;
var obs;
var agent;
var spec = {}
					
init_maze();

function init_maze(){
	clock = new THREE.Clock();
	listenForPlayerMovement();
	scene_01 = new THREE.Scene();
	
	// to jquery or not to jquery, that is the question
	packagesScore = $('#packages_acquired');
	livesScore = $('#num_captured');
	packagesScore.html(numPackagesAcquired + '/' + targetScore);
	livesScore.html(livesWasted + '/' + targetScore);
	instructions = document.getElementById('instructions');
	blocker = document.getElementById('blocker');

	gameOverMsg = document.getElementById('gameover_msg');
	gameOverEl = document.getElementById('gameover');
	gameWonEl = document.getElementById('gamewon');
	gameWonMsg = document.getElementById('gamewon_msg');
	
	capturedEl = document.getElementById('captured');
	restartCountdownEl = document.getElementById('restart_countdown');
	
	book1 = $('#book1');
	book2 = $('#book2');
	book3 = $('#book3');
	book4 = $('#book4');
	book5 = $('#book5');
	mapCanvas = document.getElementById('map_canvas');
	mapContext = mapCanvas.getContext('2d');
	mapPlayerCanvas = document.getElementById('map_player_canvas');
	mapPlayerContext = mapPlayerCanvas.getContext('2d');
	mapPlayerContext.fillStyle = 'rgb(0, 162, 232)';
	mapWidth = mapCanvas.width;
	mapHeight = mapCanvas.height;
	
	renderer_01 = new THREE.WebGLRenderer();
	renderer_01.setPixelRatio(window.devicePixelRatio);
	renderer_01.setSize(gameArenaWidth-6, gameArenaHeight-6);
	
	gameArena = $('#game_arena');
	gameArena.css('display', 'block');
	gameArena.append(renderer_01.domElement);
	$('#game_arena').children().attr('id', 'renderer');
	gameArenaRenderer = $('#renderer');
	gameArenaRenderer.css('position', 'relative');
	gameArenaRenderer.css('width', '240px');
	gameArenaRenderer.css('height', '240px');

	createMazeCubes();
	createGround();
	createCeiling();
	addLights();
	
	var minionLoaded = false;
	var packageLoaded = false;
	loader.load('models/minion.json', function(geometry, materials){
		minion = new THREE.Mesh(geometry, new THREE.MultiMaterial(materials));
		minion.scale.set(MINIONSCALE, MINIONSCALE, MINIONSCALE);
		minion.position.set(0, 0, -mapSize/2 + 3*UNITWIDTH + 25);
		minion.lookAt(0, 10, -mapSize-30);
		scene_01.add(minion);
		
		// I know.
		if(packageLoaded){
			env = new MazeWorld();
			agent = new RL.DQNAgent(env, spec);
			loadAgent();
		}

		minionX = (mapSize/2 + minion.position.x) * mapHeight/mapSize - mapPlayerWidth/2;
		minionY = (mapSize/2 + minion.position.z) * mapHeight/mapSize - mapPlayerWidth/2;
		mapPlayerContext.fillStyle = 'rgb(250, 35, 35)';
		mapPlayerContext.fillRect(minionX, minionY, mapPlayerWidth, mapPlayerHeight);
		
		minionLoaded = true;
	});
	
	loader.load('models/amz_pckg.json', function(geometry, materials){
		mapPlayerContext.fillStyle = 'rgb(15, 232, 15)';
		amzpackage = new THREE.Mesh(geometry, new THREE.MultiMaterial(materials));
		amzpackage.scale.set(PACKAGESCALE, PACKAGESCALE, PACKAGESCALE);
		amzpackage.position.set(Math.random()*(mapSize-6*UNITWIDTH-packageWidth)-(mapSize-6*UNITWIDTH-packageWidth)/2, 1,
											Math.random()*(mapSize-6*UNITWIDTH-packageWidth)-(mapSize-6*UNITWIDTH-packageWidth)/2);
		packageX = (mapSize/2 + amzpackage.position.x) * mapHeight/mapSize - mappackageWidth/2;
		packageY = (mapSize/2 + amzpackage.position.z) * mapHeight/mapSize - mappackageWidth/2;
		mapPlayerContext.fillRect(packageX, packageY, mappackageWidth, mapPackageHeight);
			
		scene_01.add(amzpackage);
		packageLoaded = true;
		
		if(minionLoaded){
			env = new MazeWorld();
			agent = new RL.DQNAgent(env, spec);
			loadAgent();
		}
	});

	cubeMapUnitWidth = UNITWIDTH*mapHeight/mapSize;
	cubeMapUnitHeight = UNITWIDTH*mapHeight/mapSize;
	cubeMapWidthOffset = widthOffset * mapHeight/(mapSize);
	cubeMapHeightOffset = widthOffset * mapHeight/(mapSize);
	
	camera_01 = new THREE.PerspectiveCamera(60, gameArenaWidth / gameArenaHeight, 1, 2000);
	camera_01.position.y = 10;
	camera_01.position.x = 0;
	camera_01.position.z = 0;
	controls_01 = new THREE.PointerLockControls(camera_01);
	scene_01.add(controls_01.getObject());
	
	var startXPos = 0;
	var startZPos = mapSize/2 - 3*UNITWIDTH - 25;
	controls_01.getObject().translateX(startXPos);
	controls_01.getObject().translateZ(startZPos);

	mapPlayerContext.fillStyle = 'rgb(0, 162, 232)';
	mapX = (mapSize/2 + startXPos) * mapHeight/mapSize - mapPlayerWidth/2;
	mapY = (mapSize/2 + startZPos) * mapHeight/mapSize - mapPlayerHeight/2;
	mapPlayerContext.fillRect(mapX, mapY, mapPlayerWidth, mapPlayerHeight);

	window.addEventListener('resize', onWindowResize, false);
	getPointerLock();
	render();
}

function listenForPlayerMovement(){
	var onKeyDown = function(event){
		if(!event){
			event = window.event;
		}
		if(event.preventDefault){
			event.preventDefault();
		}else{
			event.returnValue = false;
		}
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
		if(!event){
			event = window.event;
		}
		if(event.preventDefault){
			event.preventDefault();
		}else{
			event.returnValue = false;
		}
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

function resetPlayerMovement(){
	moveForward = false;
	moveBackward = false;
	moveRight = false;
	moveLeft = false;
}

function getPointerLock(){
	blocker.onclick = function(){
		gameArena[0].requestPointerLock();
		instructions.style.display = "none";
		gameOverEl.style.display = "none";
		animate();
	}
	document.addEventListener('pointerlockchange', lockChange, false);
}

function lockChange(){
	if(document.pointerLockElement === gameArena[0]){
		if(gameOver || gameWon){
			location.reload();
		}
		// midEsc needs to be here because of that thing in the whatchamacallit.
		if(midEsc){
			midEsc = false;
			resetPositions();
		}
		capturedEl.style.display = "none";
		restartCountdownEl.style.display = "none";
		blocker.style.display = "none";
		instructions.style.display = "none";
		gameOverEl.style.display = "none";
		controls_01.enabled = true;
		animate();
	}else{
		if(gameOver){
			gameOverMsg.innerHTML = "click to restart";
		}
		else if(gameWon){
			gameWonMsg.innerHTML = "click to restart";
		}else{
			resetPlayerMovement();
			midEsc = true;
			blocker.style.display = "block";
			capturedEl.style.display = "none";
			restartCountdownEl.style.display = "none";
			gameOverEl.style.display = "none";
			instructions.innerHTML = " ";
			instructions.style.display = "none";
			gamewon.style.display = "none";
			controls_01.enabled = false;
		}
	}
}

function createMazeCubes(){
	var map = [
        [1, 1, 1, 7, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
				[1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
				[6, 0, 1, 0, 0, 0, 0, 1, 0, 4],
				[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
				[1, 0, 1, 0, 0, 0, 0, 1, 0, 8],
				[3, 0, 1, 0, 0, 0, 0, 1, 0, 1],
				[1, 0, 1, 1, 0, 0, 1, 1, 0, 2],
				[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
				[1, 1, 5, 1, 1, 1, 1, 1, 1, 1]
    ];

	var cubeGeo = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT, UNITWIDTH);
	var cubeMat;
	var brickTexture = new THREE.TextureLoader().load("images/brickwall.png");
	var brickTexture2 = new THREE.TextureLoader().load("images/brickwall_02.png");
	var brickTexture3 = new THREE.TextureLoader().load("images/brickwall_03.png");
	var brickTexture4 = new THREE.TextureLoader().load("images/brickwall_04.png");
	var brickTexture5 = new THREE.TextureLoader().load("images/brickwall_05.png");
	var brickTexture6 = new THREE.TextureLoader().load("images/brickwall_06.png");
	var brickTexture7 = new THREE.TextureLoader().load("images/brickwall_07.png");
	var brickTexture8 = new THREE.TextureLoader().load("images/brickwall_08.png");
	var cubeMat = new THREE.MeshBasicMaterial({
		map: brickTexture,
		side: THREE.DoubleSide
	});
	var cubeMat2 = new THREE.MeshBasicMaterial({
		map: brickTexture2,
		side: THREE.DoubleSide
	});
	var cubeMat3 = new THREE.MeshBasicMaterial({
		map: brickTexture3,
		side: THREE.DoubleSide
	});
	var cubeMat4 = new THREE.MeshBasicMaterial({
		map: brickTexture4,
		side: THREE.DoubleSide
	});
	var cubeMat5 = new THREE.MeshBasicMaterial({
		map: brickTexture5,
		side: THREE.DoubleSide
	});
	var cubeMat6 = new THREE.MeshBasicMaterial({
		map: brickTexture6,
		side: THREE.DoubleSide
	});
	var cubeMat7 = new THREE.MeshBasicMaterial({
		map: brickTexture7,
		side: THREE.DoubleSide
	});
	var cubeMat8 = new THREE.MeshBasicMaterial({
		map: brickTexture8,
		side: THREE.DoubleSide
	});
	
	widthOffset = UNITWIDTH / 2;
	heightOffset = UNITHEIGHT / 2;
	totalCubesWide = map[0].length;
	mapSize = totalCubesWide * UNITWIDTH;
	mapDiag = Math.sqrt(mapSize*mapSize + mapSize*mapSize) - (6*Math.sqrt(UNITWIDTH*UNITWIDTH + UNITWIDTH*UNITWIDTH));
	
	var cubeMapX;
	var cubeMapY;
	var cubeMapUnitWidth = UNITWIDTH*mapHeight/mapSize;
	var cubeMapUnitHeight = UNITWIDTH*mapHeight/mapSize;
	var cubeMapWidthOffset = widthOffset * mapHeight/(mapSize);
	var cubeMapHeightOffset = widthOffset * mapHeight/(mapSize);
	
	mapContext.fillStyle = '#A0522D';
	mapContext.fillRect(0, 0, mapWidth, mapHeight);
	mapContext.fillStyle = '#111111';
	
	for(var i = 0; i < totalCubesWide; i++){
		for(var j = 0; j < map[i].length; j++){
			if(map[i][j]){
				if(map[i][j] === 2){
					var cube = new THREE.Mesh(cubeGeo, cubeMat2);
				}else if(map[i][j] === 3){
					var cube = new THREE.Mesh(cubeGeo, cubeMat3);
				}else if(map[i][j] === 4){
					var cube = new THREE.Mesh(cubeGeo, cubeMat4);
				}else if(map[i][j] === 5){
					var cube = new THREE.Mesh(cubeGeo, cubeMat5);
				}else if(map[i][j] === 6){
					var cube = new THREE.Mesh(cubeGeo, cubeMat6);
				}else if(map[i][j] === 7){
					var cube = new THREE.Mesh(cubeGeo, cubeMat7);
				}else if(map[i][j] === 8){
					var cube = new THREE.Mesh(cubeGeo, cubeMat8);
				}else{
					var cube = new THREE.Mesh(cubeGeo, cubeMat);
				}
				
				cube.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
				cube.position.y = heightOffset;
				cube.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
				scene_01.add(cube);
				collidableObjects.push(cube);

				// draw map
				cubeMapX = (mapSize/2+cube.position.x)*mapHeight/(mapSize);
				cubeMapY = (mapSize/2+cube.position.z)*mapHeight/(mapSize);
				mapContext.fillRect(cubeMapX-cubeMapUnitWidth/2, cubeMapY-cubeMapUnitHeight/2, cubeMapUnitWidth, cubeMapUnitHeight);
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

function addLights(){
	var lightOne = new THREE.DirectionalLight(0xffffff);
	lightOne.position.set(1, 1, 1);
	scene_01.add(lightOne);
	
	var lightTwo = new THREE.DirectionalLight(0xffffff, 0.5);
	lightTwo.position.set(1, -1, -1);
	scene_01.add(lightTwo);
}

function onWindowResize(){
	camera_01.aspect = gameArenaWidth / gameArenaHeight;
	camera_01.updateProjectionMatrix();
	renderer_01.setSize(gameArenaWidth-6, gameArenaHeight-6);
}

function startNextPlay(){
	captured = false;
	if(gameOver || midEsc){
		return;
	}
	restartCountdownEl.innerHTML = '3';
	blocker.style.display = "block";
	capturedEl.style.display = "block";
	restartCountdownEl.style.display = "block";
	
	var start = Date.now();
	var timer = setInterval(function(){
		timePassed = Date.now() - start;
		restartCountdownEl.innerHTML = ((3000 - timePassed)/1000).toFixed(0);
		if(midEsc){
			midEsc = false;
			restartCountdownEl.style.display = "none";
			clearInterval(timer);
			return;
		}
		else if(timePassed >= 3000){
			capturedEl.style.display = "none";
			restartCountdownEl.style.display = "none";
			blocker.style.display = "none";
			restartCountdownEl.style.display = "none";
			resetPositions();
			captured = false;
			animate();
			clearInterval(timer);
		}
	}, 60);
}

function animate(){
	if(gameOver){
		capturedEl.style.display = "none";
		restartCountdownEl.style.display = "none";
		blocker.style.display = "block";
		gameOverEl.style.display = "block";
		return;
	}
	if(gameWon){
		capturedEl.style.display = "none";
		restartCountdownEl.style.display = "none";
		gameWonEl.style.display = "block";
		blocker.style.display = "block";
		return;
	}
	if(captured){
		captured = false;
		livesWasted++;
		livesScore.html(livesWasted + '/' + targetScore);
		if(livesWasted >= targetScore && livesWasted > numPackagesAcquired){
			gameOver = true;
		}else{
			cancelAnimationFrame(requestId);
			startNextPlay();
			return;
		}
		captured = false;
		resetPositions();
	}
	if(packageAcquired){
		packageAcquired = false;
		numPackagesAcquired++;
		packagesScore.html(numPackagesAcquired + '/' + targetScore);
		amzpackage.position.set(Math.random()*(mapSize-6*UNITWIDTH-packageWidth)-(mapSize-6*UNITWIDTH-packageWidth)/2, 1,
			Math.random()*(mapSize-6*UNITWIDTH-packageWidth)-(mapSize-6*UNITWIDTH-packageWidth)/2);
		
		// If you're looking at this, remember... cheaters never win. Well, that's actually not true. They usually
		// do win. But many of them feel guilty about it afterwards... unlike Capt Kirk who totally cheated on the
		// Kobayashi Maru test and was all proud and shit.
		if(numPackagesAcquired === 1){
			book1.html('<a href="http://incompleteideas.net/book/the-book-2nd.html" target="_blank">Reinforcement Learning: An Introduction</a>');
		}else if(numPackagesAcquired === 2){
			book2.html('<a href="https://www.amazon.com/dp/0262035618" target="_blank">Deep Learning</a> (<a href="http://www.deeplearningbook.org/" target="_blank">online</a>)');
		}else if(numPackagesAcquired === 3){
			book3.html('<a href="http://www.mypearsonstore.com/bookstore/artificial-intelligence-a-modern-approach-9780136042594" target="_blank">Artificial Intelligence: A Modern Approach</a>');
		}else if(numPackagesAcquired === 4){
			book4.html('<a href="https://www.amazon.com/dp/0262018020" target="_blank">Machine Learning: A Probabilistic Perspective</a>');
		}else if(numPackagesAcquired === 5){
			book5.html('<a href="https://www.amazon.com/dp/0198739834" target="_blank">Superintelligence: Paths, Dangers, Strategies</a>');
		}
		if(numPackagesAcquired >= targetScore && numPackagesAcquired > livesWasted){
			gameWon = true;
		}else{
			amzpackage.position.set(Math.random()*(mapSize-6*UNITWIDTH-packageWidth)-(mapSize-6*UNITWIDTH-packageWidth)/2, 1,
			Math.random()*(mapSize-6*UNITWIDTH-packageWidth)-(mapSize-6*UNITWIDTH-packageWidth)/2);
		}
	}
	render();
	var delta = clock.getDelta();
	state = env.getState();
	minionAction = agent.act(state);
	animatePlayer(delta);
	animateMinion(delta);
	animateMap(delta);
	requestId = requestAnimationFrame(animate);
	if(midEsc){
		cancelAnimationFrame(requestId);
		return;
	}
}

function animateMap(delta){
	mapPlayerContext.clearRect(0, 0, mapWidth, mapHeight);
	mapX = (mapSize/2 + controls_01.getObject().position.x) * mapHeight/mapSize - mapPlayerWidth/2;
	mapY = (mapSize/2 + controls_01.getObject().position.z) * mapHeight/mapSize - mapPlayerHeight/2;
	mapPlayerContext.fillStyle = 'rgb(0, 162, 232)';
	mapPlayerContext.fillRect(mapX, mapY, mapPlayerWidth, mapPlayerHeight);
	
	minionX = (mapSize/2 + minion.position.x) * mapHeight/mapSize - mapPlayerWidth/2;
	minionY = (mapSize/2 + minion.position.z) * mapHeight/mapSize - mapPlayerWidth/2;
	mapPlayerContext.fillStyle = 'rgb(250, 35, 35)';
	mapPlayerContext.fillRect(minionX, minionY, mapPlayerWidth, mapPlayerHeight);
	
	packageX = (mapSize/2 + amzpackage.position.x) * mapHeight/mapSize - mappackageWidth/2;
	packageY = (mapSize/2 + amzpackage.position.z) * mapHeight/mapSize - mappackageWidth/2;
	mapPlayerContext.fillStyle = 'rgb(15, 232, 15)';
	mapPlayerContext.fillRect(packageX, packageY, mappackageWidth, mappackageWidth);
}

function animateMinion(delta){
	if(Math.abs(minion.position.x) > (mapSize) || Math.abs(minion.position.z) > (mapSize)){
		resetPositions();
	}
	var dx = minion.position.x - controls_01.getObject().position.x;
	var dy = minion.position.z - controls_01.getObject().position.z;
	var dst = Math.sqrt(dx*dx + dy*dy);
	if(dst < 25){
		captured = true;
		minionVelocity.x = 0;
		minionVelocity.z = 0;
	}

	minionVelocity.x -= minionVelocity.x * 10 * delta;
	minionVelocity.z -= minionVelocity.z * 10 * delta;

	// check boundaries
	var collisionDetected = false;
	if(minion.position.x <= (-mapSize/2 + 3*UNITWIDTH + MINIONCOLLISIONDISTANCE)){
		minionVelocity.x = 100;
		collisionDetected = true;
	}
	if(minion.position.x >= (mapSize/2 - 3*UNITWIDTH - MINIONCOLLISIONDISTANCE)){
		minionVelocity.x = -100;
		collisionDetected = true;
	}
	if(minion.position.z <= (-mapSize/2 + 3*UNITWIDTH + MINIONCOLLISIONDISTANCE)){
		minionVelocity.z = 100;
		collisionDetected = true;
	}
	if(minion.position.z >= (mapSize/2 - 3*UNITWIDTH - MINIONCOLLISIONDISTANCE)){
		minionVelocity.z = -100;
		collisionDetected = true;
	}
	if(!collisionDetected){
		if(minionAction === 0){
			// move forward
			minionVelocity.z -= MINIONSPEED * delta;
		}else if(minionAction === 1){
			//move forward right
			minionVelocity.z -= MINIONSPEED * delta * 0.71;
			minionVelocity.x += MINIONSPEED * delta * 0.71;
		}else if(minionAction === 2){
			// move right
			minionVelocity.x += MINIONSPEED * delta;
		}else if (minionAction == 3){
			// move backward right
			minionVelocity.x += MINIONSPEED * delta * 0.71;
			minionVelocity.z += MINIONSPEED * delta * 0.71;
		}else if (minionAction == 4){
			// move backward
			minionVelocity.z += MINIONSPEED * delta;
		}else if (minionAction == 5){
			// move backward left
			minionVelocity.z += MINIONSPEED * delta * 0.71;
			minionVelocity.x -= MINIONSPEED * delta * 0.71;
		}else if(minionAction == 6){
			// move left
			minionVelocity.x -= MINIONSPEED * delta;
		}else if(minionAction == 7){
			// move forward left
			minionVelocity.x -= MINIONSPEED * delta * 0.71;
			minionVelocity.z -= MINIONSPEED * delta * 0.71;
		}else{
			minionVelocity.x = 0;
			minionVelocity.z = 0;
		}
	}
	minion.translateX(minionVelocity.x * delta);
	minion.translateZ(minionVelocity.z * delta);
}

function animatePlayer(delta){
	if(Math.abs(controls_01.getObject().position.x) > (mapSize) || Math.abs(controls_01.getObject().position.z) > (mapSize)){
		resetPositions();
	}
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

function resetPositions(){
	playerVelocity.x = 0;
	playerVelocity.z = 0;
	minionVelocity.x = 0;
	minionVelocity.z = 0;
	minion.lookAt(0, 10, -mapSize-30);
	minion.position.set(0, 0, -mapSize/2 + 3*UNITWIDTH + 25);
	
	controls_01.getObject().position.x = 0;
	controls_01.getObject().position.z = mapSize/2 - 3*UNITWIDTH - 25;
  controls_01.getObject().lookAt(0, 10, -1);
	packageAcquired = false;
	amzpackage.position.set(Math.random()*(mapSize-6*UNITWIDTH-packageWidth)-(mapSize-6*UNITWIDTH-packageWidth)/2, 1,
															Math.random()*(mapSize-6*UNITWIDTH-packageWidth)-(mapSize-6*UNITWIDTH-packageWidth)/2);
}

function detectPlayerCollision(){
	var rotationMatrix;
	var camera_01Direction = controls_01.getDirection(new THREE.Vector3(0, 0, 0)).clone();
	
	package_dx = amzpackage.position.x - controls_01.getObject().position.x;
	package_dy = amzpackage.position.z - controls_01.getObject().position.z;
	package_dst = Math.sqrt(package_dx*package_dx + package_dy*package_dy);
	if(package_dst < PACKAGESCALE + 15){
		packageAcquired = true;
	}
	
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

function MazeWorld(){
	this.getNumStates = function(){
		return 10;
	};
	this.getMaxNumActions = function(){
		return 9;
	};
	this.getState = function(){
		var s = [];
		
		s.push((minion.position.x)/ (mapSize-6*UNITWIDTH) - 0.5);
		s.push((minion.position.z)/ (mapSize-6*UNITWIDTH) - 0.5);
		// hey, stop playing with the velocity ranges
		s.push((minionVelocity.x / MINIONSPEED) * 12.0);
		s.push((minionVelocity.z/ MINIONSPEED) * 12.0);
		s.push((controls_01.getObject().position.x)/ (mapSize-6*UNITWIDTH) - 0.5);
		s.push((controls_01.getObject().position.z)/ (mapSize-6*UNITWIDTH) - 0.5);
		s.push((playerVelocity.x/ PLAYERSPEED) * 12.0);
		s.push((playerVelocity.z/ PLAYERSPEED) * 12.0);
		s.push((amzpackage.position.x)/ (mapSize-6*UNITWIDTH) - 0.5);
		s.push((amzpackage.position.z)/ (mapSize-6*UNITWIDTH) - 0.5);	
		
		return s;
	};
}

function loadAgent() {
  $.getJSON( "secretagents/secretagentman.json", function( data ) {
		agent.fromJSON(data);
		agent.epsilon = 0.05;
    agent.alpha = 0.0;
   });
}