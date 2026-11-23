$(function(){
	var gameCanvas = $('#game_canvas');
	var gameContext = gameCanvas.get(0).getContext("2d");
	var gameCanvasWidth = gameCanvas.width();
	var gameCanvasHeight = gameCanvas.height();
	
	var gridCanvas = $('#grid_canvas');
	var gridContext = gridCanvas.get(0).getContext("2d");
	var gridCanvasWidth = gridCanvas.width();
	var gridCanvasHeight = gridCanvas.height();
	
	var messageCanvas = $('#message_canvas');
	var messageContext = messageCanvas.get(0).getContext("2d");
	var messageCanvasWidth = messageCanvas.width();
	var messageCanvasHeight = messageCanvas.height();
	
	var asteroidsCanvas = $('#asteroids_canvas');
	var asteroidsContext = asteroidsCanvas.get(0).getContext("2d");
	var asteroidsCanvasWidth = asteroidsCanvas.width();
	var asteroidsCanvasHeight = asteroidsCanvas.height();
	var collidableObjects = [];
	var numEnemies = 3;
	
	gridContext.lineWidth = 1;
	gridContext.fillStyle = "rgb(25, 25, 25)";
	gridContext.fillRect(0, 0, gridCanvasWidth, gridCanvasHeight);
	gridContext.fillStyle = "rgb(5, 5, 255)";
	gridContext.strokeStyle = "rgb(100, 100, 100)";
	gridContext.font = "24px Arial";
	
	
	gameContext.fillStyle = "rgb(5, 255, 5)";
	messageContext.fillStyle = "rgb(5, 255, 5)";
	messageContext.font = "32px Arial";
	
	var counter3 = 0;
	var t;
	var y;

	var fireButton = $('#fire');
	var reset = $('#reset');
	var clearScreen = $('#clear_screen');
	var doNotPress = $('#do_not_press');
	var missed = false;
	var hit = false;
	
	var mathExprVal = '';
	var exprText = $('#expr_text');
	var inputButtons = $('#input_buttons');
	var buttonNode;
	var resultMessage = '';
	
	var spaceObject = function(x, y, img, type){
		this.type = type;
		asteroidsContext.drawImage(img, x, y);
		this.radius = img.width / 2;
		this.x = x+this.radius;
		this.y = y+this.radius;
	};
	
	for(var i = Math.PI/4; i < Math.PI*2; i += Math.PI/4){
		gridContext.beginPath();
		gridContext.moveTo(i*300/Math.PI, 0);
		gridContext.lineTo(i*300/Math.PI, gridCanvasHeight);
		gridContext.closePath();
		gridContext.stroke();
		for(var j = 60; j < 360; j += 60){
			if(j == 180){
				gridContext.lineWidth = 3;
			}else{
				gridContext.lineWidth = 1;
			}
			gridContext.beginPath();
			gridContext.moveTo(0, j);
			gridContext.lineTo(gridCanvasWidth, j);
			gridContext.closePath();
			gridContext.stroke();
		}
	}
	
	var basilisk1 = new spaceObject(500, 150, basilisk, 'basilisk');
	var basilisk2 = new spaceObject(127, 50, basilisk, 'basilisk');
	var basilisk3 = new spaceObject(380, 245, basilisk, 'basilisk');
	var asteroid1 = new spaceObject(133, 157, ast1, 'asteroid');
	var asteroid2 = new spaceObject(300, 245, ast2, 'asteroid');
	var asteroid3 = new spaceObject(404, 120, ast3, 'asteroid');
	collidableObjects.push(basilisk1);
	collidableObjects.push(basilisk2);
	collidableObjects.push(basilisk3);
	collidableObjects.push(asteroid1);
	collidableObjects.push(asteroid2);
	collidableObjects.push(asteroid3);
	
	var laser = new Audio("sounds/Laser_Shoot14.wav");
	var explosion = new Audio("sounds/Explosion19.wav");
	var dud = new Audio("sounds/bad_move.wav");
	laser.volume = .25;
	laser.load();
	explosion.volume = .25;
	explosion.load();
	dud.volume = .25;
	dud.load();

	var scope = {
		t: 0
	};
	var node;
	var code;
	
	function fire(){
		messageContext.clearRect(0, 0, messageCanvasWidth, messageCanvasHeight);
		if(missed){
			missed = false;
			messageContext.fillText(resultMessage, 25, 350);
			counter3 = 0;
			y = 0;
			return;
		}
		if(hit){
			messageContext.fillText(resultMessage, 25, 350);
			hit = false;
			counter3 = 0;
			y = 0;
			return;
		}
		mathExprVal = exprText.val();
		scope.t = (counter3*Math.PI*2)/600;
		
		try{
			evalRes = math.eval(mathExprVal, scope);
			if(isNaN(evalRes)){
				throw "NaN";
			}
		}
		catch(err){
			resultMessage = "error";
			messageContext.fillText(resultMessage, 25, 350);
			counter3 = 0;
			 y = 0;
			 dud.play();
			return;
		}
		
		if((evalRes.valueOf() < -10000 || evalRes.valueOf() > 10000) && counter3 > 50){
			resultMessage = "out of range";
			messageContext.fillText(resultMessage, 25, 350);
			counter3 = 0;
			y = 0;
			dud.play();
			return;
		}
		
		y = 180 - 60 * evalRes.valueOf();
		gameContext.beginPath();
		gameContext.arc(counter3, y, 1, 0, Math.PI*2, false);
		gameContext.closePath();
		gameContext.fill();
		counter3 += 3;
		if(counter3 > gameCanvasWidth){
			dud.play();
			resultMessage = 'missed';
			missed = true;
		}
		detectCollision();
		requestAnimationFrame(fire, 60);
	}
	
	var distance;
	var dx;
	var dy;
	function detectCollision(){
		for(var i = 0; i < collidableObjects.length; i++){
			dx = counter3 - collidableObjects[i].x;
			dy = y - collidableObjects[i].y;
			distance = Math.sqrt((dx*dx)+(dy*dy));
			if(distance < collidableObjects[i].radius){
				if(collidableObjects[i].type === 'asteroid'){
					dud.play();
					resultMessage = "missed";
					missed = true;
				}
				if(collidableObjects[i].type === 'basilisk'){
					explosion.play();
					asteroidsContext.clearRect(collidableObjects[i].x - collidableObjects[i].radius,
																			collidableObjects[i].y - collidableObjects[i].radius,
																			collidableObjects[i].radius*2,
																			collidableObjects[i].radius*2);
					resultMessage = "basilisk ship destroyed";
					missed = false;
					hit = true;
					numEnemies--;
					if(numEnemies == 0){
						resultMessage = 'congratulations';
						messageContext.fillText(resultMessage, 25, 350);
						unlockSequence3();
					}
					collidableObjects.splice(i, 1);
				}
			}
		}
	}
	
	fireButton.click(function(){
		laser.play();
		fire();
	});
	
	$('#expr_area input').each(function(){
		$(this).click(function(){
			$(this).attr("value", " ");
		});
	});
	
	$('#input_buttons input').each(function(){
		$(this).click(function(event){
			if($(this).val() === 'X'){
				exprText.val(exprText.val() + '*');
			}else{
				exprText.val(exprText.val() + $(this).val());
			}
		});
	});
	
	reset.click(function(event){
		exprText.val('');
		mathExprVal = '';
	});
	
	clearScreen.click(function(event){
		gameContext.clearRect(0, 0, gameCanvasWidth, gameCanvasHeight);
		messageContext.clearRect(0, 0, messageCanvasWidth, messageCanvasHeight);
	});
	
	doNotPress.click(function(event){
		messageContext.clearRect(0, 0, messageCanvasWidth, messageCanvasHeight);
		resultMessage = "this is why we can't have nice things";
		messageContext.fillText(resultMessage, 25, 350);
	});
});

	function unlockSequence3(){
		$('.sequence3 img').each(function(){
			$(this).css('display', 'block');
		});
		$('#panel_23').css('width', '740px');
		$('#panel_23').css('height', '680px');
		$('#panel_23').css('left', '5px');
		$('#panel_23').css('border', 'none');
		$('#login_game').css('display', 'block');
		$('#panel_24').css('display', 'none');
		$('#panel_25').css('display', 'none');
		$('#panel_26').css('display', 'none');
		$('#panel_27').css('display', 'none');
		$('#panel_28').css('display', 'none');
		$('#panel_29').css('display', 'none');
		$('#login_game').append('<iframe src="scripts/login.html" width="750" height="680" marginwidth="0" marginheight="0" frameborder="0" scrolling="no"></iframe>');
	}
