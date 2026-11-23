//  ---------------------------------------------------------------------------------
// Prime Starfighter by Abstruse Goose (abstrusegoose.com).
// This work is licensed under a
// Creative Commons Attribution-Noncommercial 3.0 United States License.
// http://creativecommons.org/licenses/by-nc/3.0/us/
// I mean, c'mon, we talkin' 'bout JavaScript practice!
//  ---------------------------------------------------------------------------------

// Keep these vars global... for science.
var numberFontSize = 33;
var numberFontSizeOffset = numberFontSize/5.5;
var numberFont = numberFontSize + "px Arial";
var numberFillStyle = "red";
var primeProb = 0.4;

// This is bridge.
var lvlConf = {
	1: {min: 3, max: 50, numberPoolSize: 25},
	2: {min: 11, max: 100, numberPoolSize: 25},
	3: {min: 61, max: 150, numberPoolSize: 25},
	4: {min: 100, max: 200, numberPoolSize: 25},
	5: {min: 200, max: 500, numberPoolSize: 25},
	6: {min: 500, max: 1000, numberPoolSize: 25},
	7: {min: 1000, max: 3000, numberPoolSize: 25},
	8: {min: 3000, max: 5000, numberPoolSize: 25},
	9: {min: 5000, max: 10000, numberPoolSize: 25}
};

var imageRepository = new function(){
	this.background = new Image();
	this.spaceship = new Image();
	this.bullet = new Image();
	
	var numStuffToLoad = 3;
	var numStuffLoaded = 0;
	function loaded(){
		numStuffLoaded++;
		if(numStuffLoaded === numStuffToLoad){
			window.init();
		}
	}
	
	this.background.onload = function(){
		loaded();
	}
	
	this.spaceship.onload = function(){
		loaded();
	}
	
	this.bullet.onload = function(){
		loaded();
	}
	
	this.background.src = "imgs/bg.png";
	this.spaceship.src = "imgs/shipx.png";
	this.bullet.src = "imgs/bullet.png";
}
/*
One day in highschool, I was spending time with this girl when my rival
called her out of the blue to ask her out. She rejected him on the spot
and told him that she was hanging out with me. That was a good day.
*/
function NumberPool(maxSize){
	this.size = maxSize;
	this.pool = [];
	this.currIndex = 0;
	
	this.init = function(){
		var min;
		var max;
		this.visibleNumbers = [];
		
		if(game.lvl < 9){
			min = lvlConf[game.lvl]["min"];
			max = lvlConf[game.lvl]["max"];
		}else{
			min = lvlConf["9"]["min"];
			max = lvlConf["9"]["max"];
		}
		for(var i = 0; i < this.size; i++){
			if(Math.random() < primeProb){
				var candidate = randomRange(min, max);
				while(!isPrime(candidate)){
					candidate = randomRange(min, max);
				}
				var x = randomRange(game.mainCanvas.width/2-game.mainContext.measureText(candidate).width, game.mainCanvas.width/2+game.mainContext.measureText(candidate).width);
				var y = -randomRange(25, 75);
				if(this.pool[i]){
					this.pool[i].init(x, y, game.mainContext.measureText(candidate).width, numberFontSize-numberFontSizeOffset, candidate, true, game.numberSpeed);
				}else{
					var numberObject = new NumberObject();
					numberObject.init(x, y, game.mainContext.measureText(candidate).width, numberFontSize-numberFontSizeOffset, candidate, true, game.numberSpeed);
					this.pool.push(numberObject);
				}
					
			}else{
				var candidate = randomRange(min, max);
				while(isPrime(candidate)){
					candidate = randomRange(min, max);
				}
				var x = randomRange(game.mainCanvas.width/2-game.mainContext.measureText(candidate).width, game.mainCanvas.width/2+game.mainContext.measureText(candidate).width);
				var y = -randomRange(25, 75);
				if(this.pool[i]){
					this.pool[i].init(x, y, game.mainContext.measureText(candidate).width, numberFontSize-numberFontSizeOffset, candidate, false, game.numberSpeed);
				}else{
					var numberObject = new NumberObject();
					numberObject.init(x, y, game.mainContext.measureText(candidate).width, numberFontSize-numberFontSizeOffset, candidate, false, game.numberSpeed);
					this.pool.push(numberObject);
				}
			}
		}
	};
	
	this.animate = function(){
		if(game.counter >= 100 && this.currIndex < this.size){
			this.pool[this.currIndex].alive = true;
			this.visibleNumbers.push(this.pool[this.currIndex]);
			game.counter = 0;
			this.currIndex++;
		}else{
			game.counter++;
		}
		
		for(var i = this.visibleNumbers.length-1; i >= 0; i--){
			if(this.visibleNumbers[i].draw()){
				this.visibleNumbers.splice(i, 1);
			}
			else
				continue;
		}
	};
	
	this.clear = function(){
		for(i = 0; i < this.pool.length; i++){
			this.pool[i].clear();
		}
	}
	
}

function Pool(maxSize){
	this.size = maxSize;
	this.pool = [];
	this.visibleNumbers = [];
	
	this.init = function(){
		var min;
		var max;
	
		for(var i = 0; i < this.size; i++){
			var bullet = new Bullet();
			bullet.init(0, 0, imageRepository.bullet.width, imageRepository.bullet.height);
			this.pool[i] = bullet;
		}
	};
	
	this.get = function(x, y, speed){
		if(!this.pool[this.size-1].alive){
			this.pool[this.size-1].spawn(x, y, speed);
			this.pool.unshift(this.pool.pop());
		}
	};
	
	this.animate = function(){	
		for(var i = 0; i < this.size; i++){
			if(this.pool[i].alive){
				if(this.pool[i].draw()){
					this.pool[i].clear();
					this.pool.push((this.pool.splice(i, 1))[0]);
				}
			}
			else
				break;
		}
	};
	
	this.getPool = function(){
		var obj = [];
		for(var i = 0; i < this.size; i++){
			if(this.pool[i].alive){
				obj.push(this.pool[i]);
			}
		}
		return obj;
	};
	
	this.clear = function(){
		for(i = 0; i < this.pool.length; i++){
			this.pool[i].clear();
		}
	}
}

function SoundPool(maxSize){
	var size = maxSize;
	var pool = [];
	this.pool = pool;
	var currSound = 0;
	
	this.init = function(object){
		if(object === "laser"){
			for(var i = 0; i < size; i++){
				laser = new Audio("sounds/Laser_Shoot14.wav");
				laser.volume = .25;
				laser.load();
				pool[i] = laser;
			}
		}else if(object === "explosion"){
			for(var i = 0; i < size; i++){
				var explosion = new Audio("sounds/Explosion19.wav");
				explosion.volume = .25;
				explosion.load();
				pool[i] = explosion;
			}
		}else if(object === "badmove"){
			for(var i = 0; i < size; i++){
				var explosion = new Audio("sounds/bad_move.wav");
				explosion.volume = .8;
				explosion.load();
				pool[i] = explosion;
			}
		}
	};
	
	this.get = function(){
		if(pool[currSound].currentTime == 0 || pool[currSound].ended){
			pool[currSound].play();
		}
		currSound = (currSound + 1) % size;
	};
}

function Drawable(){
	this.init = function(x, y, width, height){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;
	this.isColliding = false;
	
	this.draw = function(){
	};
}

function Background(){
	this.speed = 1.5;
	this.draw = function(){
		this.y += this.speed;
		this.context.drawImage(imageRepository.background, this.x, this.y);
		this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);
		
		if(this.y >= this.canvasHeight)
			this.y = 0;
	};
}
Background.prototype = new Drawable();

function Bullet(){
	this.alive = false;
	
	this.spawn = function(x, y, speed){
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.alive = true;
	};
	
	this.draw = function(){
		this.context.clearRect(this.x, this.y, this.width, this.height);
		this.y -= this.speed;
		if(this.y <= -this.height || this.isColliding){
			return true;
		}else{
			this.context.drawImage(imageRepository.bullet, this.x, this.y);
		}
	};
	
	this.clear = function(){
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.alive = false;
		this.isColliding = false;
	};
}
Bullet.prototype = new Drawable();

function NumberObject(){
	this.init = function(x, y, width, height, number, prime, speed){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.number = number;
		this.prime = prime;
		this.alive = false;
		
		this.speed = speed;
		if(Math.random() < 0.5){
			this.speedX = speed;
		}else
			this.speedX = -speed;
		
		this.speedY = speed;
		this.leftEdge = randomRange(this.width, this.canvasWidth/2 - this.width);
		this.rightEdge = randomRange(this.canvasWidth/2 + this.width, this.canvasWidth-this.width);
	};
	
	this.draw = function(){
		this.context.clearRect(this.x-2, this.y-this.height-2, this.width+4, this.height+4);

		this.x += this.speedX;
		this.y += this.speedY;
		if(this.x <= this.leftEdge || this.x >= this.rightEdge){
			this.speedX = -this.speedX;
		}
		if(this.y >= this.canvasHeight){
			// Off screen.
			if(this.prime){
				document.getElementById("game-over").innerHTML = this.number + ' IS PRIME';
				document.getElementById("restart").innerHTML = "RESTART";
				document.getElementById("showcredits").innerHTML = "credits";
				game.badmove.get();
				game.gameover = true;
			}else if(this.y >= this.canvasHeight+this.height){
				game.numLiveNumbers--;
				return true;
			}
		}
		if(!this.isColliding){
			this.context.fillText(this.number, this.x, this.y);
			return false;
		}else{
			return true;
		}
	};
	
	this.clear = function(){
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.speedX = 0;
		this.speedY = 0;
		this.alive = false;
		this.isColliding = false;
	};
	
	this.dirtyBox = function(){
		this.context.clearRect(this.x-2, this.y-this.height-2, this.width+4, this.height+4);
	};
}
NumberObject.prototype = new Drawable();

// Sometimes I think that I am somehow psychically linked with Seth MacFarlane.
// Now, after watching a full season of The Orville, I'm sure of it.
function Ship(){
	this.speed = 3;
	this.bulletPool = new Pool(15);
	this.bulletPool.init();
	var fireRate = 15;
	var counter = 0;
	this.draw = function(){
		this.context.drawImage(imageRepository.spaceship, this.x, this.y);
	};
	this.move = function(){
		counter++;
		if(KEY_STATUS.left || KEY_STATUS.right || KEY_STATUS.down || KEY_STATUS.up){
			this.context.clearRect(this.x, this.y, this.width, this.height);
			if(KEY_STATUS.left){
				this.x -= this.speed;
				if(this.x <= 0)
					this.x = 0;
			}else if(KEY_STATUS.right){
				this.x += this.speed;
				if(this.x >= this.canvasWidth - this.width)
				this.x = this.canvasWidth - this.width;
			}else if(KEY_STATUS.up){
				this.y -= this.speed;
				if(this.y <= this.canvasHeight/2)
					this.y = this.canvasHeight/2;
			}else if(KEY_STATUS.down){
				this.y += this.speed;
				if(this.y >= this.canvasHeight - this.height)
					this.y = this.canvasHeight - this.height;
			}
			this.draw();
		}
		if(KEY_STATUS.space && counter >= fireRate){
			this.fire();
			counter = 0;
		}
	};
	this.fire = function(){
		this.bulletPool.get(this.x+this.width/2, this.y, 6);
		game.shotsFired++;
		game.hitRate = game.hits / game.shotsFired;
		game.laser.get();
	};
}
Ship.prototype = new Drawable();

// As long as you're snooping around in my javascript, how about a donation, kind stranger?
// BTC: 1Ag178Cq14vMnRjGmpKNfdbJysLcHtnV1t
function Game(){
	this.init = function(){
		this.counter = 0;
		this.lvl = 1;
		this.numberSpeed = 1.0;
		this.maxNumberSpeed = 1.5;
		this.shotsFired = 0;
		this.hits = 0;
		this.bonus = 0;
		this.bgCanvas = document.getElementById("background");
		this.shipCanvas = document.getElementById("ship");
		this.mainCanvas = document.getElementById("main");
		if(this.bgCanvas.getContext){
			this.bgContext = this.bgCanvas.getContext("2d");
			this.shipContext = this.shipCanvas.getContext("2d");
			this.mainContext = this.mainCanvas.getContext("2d");
			this.mainContext.font = numberFont;
			this.mainContext.fillStyle = numberFillStyle;
			this.mainContext.strokeStyle = "red";
			
			Background.prototype.context = this.bgContext;
			Background.prototype.canvasWidth = this.bgCanvas.width;
			Background.prototype.canvasHeight = this.bgCanvas.height;
			
			Ship.prototype.context = this.shipContext;
			Ship.prototype.canvasWidth = this.shipCanvas.width;
			Ship.prototype.canvasHeight = this.shipCanvas.height;
			
			Bullet.prototype.context = this.mainContext;
			Bullet.prototype.canvasWidth = this.mainCanvas.width;
			Bullet.prototype.canvasHeight = this.mainCanvas.height;
			
			NumberObject.prototype.context = this.mainContext;
			NumberObject.prototype.canvasWidth = this.mainCanvas.width;
			NumberObject.prototype.canvasHeight = this.mainCanvas.height;
			
			this.background = new Background();
			this.background.init(0, 0);
			
			this.ship = new Ship();
			this.shipStartX = this.shipCanvas.width/2 - imageRepository.spaceship.width/2;
			this.shipStartY = this.shipCanvas.height/4*3 + imageRepository.spaceship.height*2;
			this.ship.init(this.shipStartX, this.shipStartY, imageRepository.spaceship.width, imageRepository.spaceship.height);
			
			this.numberPool = new NumberPool(lvlConf[game.lvl]["numberPoolSize"]);
			this.numberPool.init();
			this.numLiveNumbers = this.numberPool.pool.length;
			
			this.score = 0;
			this.shotsFired = 0;
			this.hits = 0;
			this.hitRate = 0.0;
			this.lvlScore = 0;
			this.gameover = false;
			
			this.laser = new SoundPool(10);
			this.laser.init("laser");
			this.explosion = new SoundPool(10);
			this.explosion.init("explosion");
			this.badmove = new SoundPool(1);
			this.badmove.init("badmove");
			this.backgroundMusic = new Audio("sounds/CyborgNinja.mp3");
			this.backgroundMusic.loop = true;
			this.backgroundMusic.volume = .25;
			this.backgroundMusic.load();
			this.gameOverAudio = new Audio("sounds/DearDiaryEnding.mp3");
			this.gameOverAudio.loop = true;
			this.gameOverAudio.volume = .60;
			this.gameOverAudio.load();
			
			this.checkAudio = window.setInterval(function(){checkReadyState()},1000);
		
			return true;
		}else{
			return false;
		}
	};
	
	this.start = function(){
		this.ship.draw();
		this.backgroundMusic.play();
		animate();
	};
	
	this.gameOver = function(){
		this.backgroundMusic.pause();
		this.gameOverAudio.currentTime = 0;
		this.gameOverAudio.play();
		document.getElementById("game-over").style.display = "block";
		document.getElementById("restart").style.display = "block";
		document.getElementById("showcredits").style.display = "block";
	};
	
	this.restart = function(){
		this.gameOverAudio.pause();
		
		document.getElementById("game-over").innerHTML = "";
		document.getElementById("game-over").style.display = "none";
		document.getElementById("restart").style.display = "none";
		document.getElementById("restart").style.top = "169px"
		document.getElementById("showcredits").innerHTML = "";
		document.getElementById("showcredits").style.display = "none";
		document.getElementById("credits").innerHTML = "";

		this.lvl = 1;
		this.numberSpeed = 1;
		this.bgContext.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
		this.shipContext.clearRect(0, 0, this.shipCanvas.width, this.shipCanvas.height);
		this.mainContext.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
		this.background.init(0, 0);
		this.ship.init(this.shipStartX, this.shipStartY, imageRepository.spaceship.width, imageRepository.spaceship.height);
		this.ship.bulletPool.init();
		this.numberPool.clear();
		this.numberPool.size = lvlConf[game.lvl]["numberPoolSize"];
		this.numberPool.init();
		this.counter = 0;
		this.numberPool.currIndex = 0;
		this.numLiveNumbers = this.numberPool.size;
		this.score = 0;
		this.hitRate = 0.0;
		this.shotsFired = 0;
		this.hits = 0;
		this.hitRate = 0.0;
		this.lvlScore = 0;
		this.backgroundMusic.currentTime = 0;
		this.gameover = false;
		this.backgroundMusic.play();
		
		this.start();
	};
	
	this.showCredits = function(){
		document.getElementById("game-over").innerHTML = "";
		document.getElementById("game-over").style.display = "none";
		document.getElementById("restart").style.top = "5px";
		document.getElementById("showcredits").innerHTML = "";
		document.getElementById("showcredits").style.display = "none";
		document.getElementById("credits").innerHTML = "<p>Cyborg Ninja by Kevin MacLeod (<a href='https://incompetech.com/wordpress/2016/02/cyborg-ninja/'>incompetech.com</a>)<br>\
																												Licensed under Creative Commons: By Attribution 3.0 License<br>\
																												<a href='http://creativecommons.org/licenses/by/3.0'>http://creativecommons.org/licenses/by/3.0</a></p>\
																												<p>Dear Diary by PetterTheSturgeon<br>\
																												<a href='https://opengameart.org/content/melodic-gentle-ambient-music'>https://opengameart.org/content/melodic-gentle-ambient-music</a><br>\
																												<a href='http://creativecommons.org/licenses/by/3.0/'>http://creativecommons.org/licenses/by/3.0/</a></p>\
																												<p>Game by Abstruse Goose<br>\
																												This game is largely based on a tutorial by Steven Lambert:<br>\
																												<a href='http://blog.sklambert.com/galaxian-html5-game/'>http://blog.sklambert.com/galaxian-html5-game/</a></p";
		document.getElementById("credits").style.diplay = "block";
		
		this.bgContext.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
		this.shipContext.clearRect(0, 0, this.shipCanvas.width, this.shipCanvas.height);
		this.mainContext.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
		this.background.init(0, 0);
		game.background.draw();
		
	};
	
	this.hideTransition = function(){
			fazeOut(document.getElementsByClassName("level-transition")[0], 50);
			clearTimeout(this.hideTransitionTimer);
		};
		
	this.hideHitRateBonus = function(){
		fazeOut(document.getElementsByClassName("hit-rate-bonus")[0], 50);
		clearTimeout(this.hideHitRateBonusTimer);
	};
}

function detectBulletCollision(){
	var bulletPool = game.ship.bulletPool.getPool();
	var visibleNumberPool = game.numberPool.visibleNumbers;

	for(var i = 0; i < bulletPool.length; i++){
		for(var j = 0; j < visibleNumberPool.length; j++){
			if(bulletPool[i].x < visibleNumberPool[j].x + visibleNumberPool[j].width &&
					bulletPool[i].x + bulletPool[i].width > visibleNumberPool[j].x &&
					bulletPool[i].y < visibleNumberPool[j].y &&
					bulletPool[i].y + bulletPool[i].height > visibleNumberPool[j].y - visibleNumberPool[j].height){
				bulletPool[i].isColliding = true;
				visibleNumberPool[j].isColliding = true;
				if(visibleNumberPool[j].prime){
					visibleNumberPool[j].dirtyBox();
					game.explosion.get();
					game.score += Number(visibleNumberPool[j].number);
					game.lvlScore += Number(visibleNumberPool[j].number);
					game.hits++;
					game.hitRate = game.hits / game.shotsFired;
					game.numLiveNumbers--;
				}else{
					document.getElementById("game-over").innerHTML = visibleNumberPool[j].number + ' NOT PRIME';
					document.getElementById("restart").innerHTML = "RESTART";
					document.getElementById("restart").style.display = "block"
					document.getElementById("showcredits").innerHTML = "credits";
					document.getElementById("showcredits").style.display = "block"
					game.badmove.get();
					game.gameover = true;
				}
			}
		}
	}
}

function animate(){
	document.getElementById("score").innerHTML = game.score;
	document.getElementById("level").innerHTML = game.lvl;
	document.getElementById("hit").innerHTML = game.hitRate.toFixed(4);
	if(!game.gameover){
		requestAnimFrame(animate);
		game.background.draw();
		game.ship.move();
		game.ship.bulletPool.animate();
		game.numberPool.animate();
		detectBulletCollision();

		if(game.numLiveNumbers <= 0){
			game.lvl++;
			game.bonus = 0;
			game.bonus = Math.round(game.hitRate * game.lvlScore);
			var hitRateBonusCl = document.getElementsByClassName("hit-rate-bonus")[0];
			var levelTransitionCl = document.getElementsByClassName("level-transition")[0];
			
			document.getElementById("hit-rate-bonus").innerHTML = game.bonus;
			hitRateBonusCl.style.display = 'block';
			hitRateBonusCl.style.opacity = 1;
			levelTransitionCl.style.display = 'block';
			levelTransitionCl.style.opacity = 1;
			game.score += game.bonus;
			game.hideTransitionTimer = setTimeout(game.hideTransition, 800);
			game.hideHitRateBonusTimer = setTimeout(game.hideHitRateBonus, 1000);
			if(game.lvl < 9){
				game.numberPool.size = lvlConf[game.lvl]["numberPoolSize"];
			}else{
				if(game.lvl > 9 && game.numberSpeed < game.maxNumberSpeed){
					game.numberSpeed += 0.1;
				}
				game.numberPool.size = lvlConf["9"]["numberPoolSize"];
			}
			if(game.lvl > 15){
				lvlConf["9"]["max"] += 10000;
			}
			game.numberPool.clear();
			game.numberPool.init();
			game.numberPool.currIndex = 0;
			game.numLiveNumbers = game.numberPool.size;
			game.lvlScore = 0;
		}
	}else{
		game.gameOver();
	}
}

function checkReadyState() {
	if (game.gameOverAudio.readyState === 4 && game.backgroundMusic.readyState === 4) {
		window.clearInterval(game.checkAudio);
		document.getElementById("loading").style.display = "none";
		var startscreen = document.getElementById("start-screen");
		var controlKeys = document.getElementById("control-keys");
		var clickToStart = document.getElementById("click-to-start");
		document.getElementById("background").style.display = "block";
		document.getElementById("main").style.display = "block";
		document.getElementById("ship").style.display = "block";
		game.background.draw();
		game.ship.draw();
		
		startscreen.style.display = "block";
		controlKeys.style.display = "block";
		clickToStart.style.display = "block";
		clickToStart.onclick = function(){
			startscreen.innerHTML = "";
			startscreen.style.diplay = "none";
			controlKeys.innerHTML = "";
			controlKeys.style.display = "none";
			clickToStart.innerHTML = "";
			clickToStart.style.display = "none";
			document.getElementsByClassName("score-label")[0].style.display = "block";
			document.getElementsByClassName("level-label")[0].style.display = "block";
			document.getElementsByClassName("hit-label")[0].style.display = "block";
			game.start();
		};
	}
}

window.requestAnimFrame  = (function(){
	return window.requestAnimationFrame		||
		window.webkitRequestAnimationFrame	||
		window.mozRequestAnimationFrame			||
		window.oRequestAnimationFrame				||
		window.msRequestAnimationFrame			||
		function(callback, element){
			window.setTimeout(callback, 1000/60);
		};
})();

KEY_CODES = {
	32: "space",
	37: "left",
	38: "up",
	39: "right",
	40: "down"
};

KEY_STATUS = {};
for(code in KEY_CODES){
	KEY_STATUS[KEY_CODES[code]] = false;
}

document.onkeydown = function(e){
	var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
	if(KEY_CODES[keyCode]){
		e.preventDefault();
		KEY_STATUS[KEY_CODES[keyCode]] = true;
	}
}

document.onkeyup = function(e){
	var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
	if(KEY_CODES[keyCode]){
		e.preventDefault();
		KEY_STATUS[KEY_CODES[keyCode]] = false;
	}
}

function randomRange(min, max){
	return Math.floor(Math.random()*(max-min)) + min;
}

function randomRangeFloat(min, max){
	return Math.random()*(max-min)+min;
}

function isPrime(n){
	for(var i = 2; i <= Math.sqrt(n); i++){
		if((n % i) == 0){
			return false;
		}
	}
	return true;
}

function fazeOut(el, fadeTime){
	var op = 1;
	var timer = setInterval(function(){
		if(op <= 0.1){
			clearInterval(timer);
			el.style.display = 'none';
		}
		el.style.opacity = op;
		el.style.filter = 'alpha(opacity=' + op*100 + ")";
		op -= op * 0.1;
	}, fadeTime);
}

var game = new Game();

function init(){
	game.init();
}