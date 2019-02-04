var canvas;
var ctx;

var expImg;
var wreckImg;

var cameraX;
var cameraY;


var shipImg;
var shipX = 200;
var shipY = 200;
var shipAngle = 0;
var charge = 30;
var shipHealth = 30;

var kills = 0;
var score = 0;

var shipSpeed = 1;

var mapSize = 1000;

var shots = [];
var keys = [];
var explosions = [];
var wrecks = [];
var n = 0;

var ships = [];

var TO_RADIANS = Math.PI / 180;

$(document).ready(function() {
	
	canvas = document.getElementById("myCanvas");
 	ctx = canvas.getContext("2d");

	
	shipImg = document.getElementById("shipImg");
	expImg =document.getElementById("expImg");
	wreckImg = document.getElementById("wreckImg");
	
	setInterval(function() {
		
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		drawBackground();
		
		cameraX = shipX - (canvas.width / 2);
		cameraY = shipY - (canvas.height / 2);
		
		drawBorder();
		
		drawWrecks();
		drawExplosions();
		drawOthers();
		drawPlayer();
		
		if (n % 30 == 0) {
			if(charge < 30) charge++;
			for(var i =0 ; i < ships.length; i++){
				if(ships[i].charge <30){
					ships[i].charge ++;
				}
			}
		}
		
		if(n%5==0) {
			if(shipSpeed > 1) {
				var delta = (shipSpeed) / 5;
				if(charge > delta){
					charge -= delta;
				}else{
					shipSpeed -= 0.2;
				}
			}
		}
		
		n++;
		
		var newX = shipX + (Math.cos(shipAngle * TO_RADIANS) * shipSpeed);
		var newY = shipY + (Math.sin(shipAngle * TO_RADIANS) * shipSpeed);
		
		if(newX > 0 && newX < mapSize) shipX = newX;
		if(newY > 0 && newY < mapSize) shipY = newY;
		
		for(var i = 0; i < shots.length;){
			var shot = shots[i];
			ctx.beginPath();
			ctx.arc(shot.x - cameraX, shot.y - cameraY, 3, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
			
			shot.x += Math.cos(shot.angle * TO_RADIANS) * shot.speed;
			shot.y += Math.sin(shot.angle * TO_RADIANS) * shot.speed;
			shot.life += 1;
			
			if(shot.x < 0 || shot.x > mapSize || shot.y < 0 || shot.y > mapSize || shot.life >= 200) 
				shots.splice(i, 1);
			else
				i++;
		}
		
		if(keys.indexOf(39) > -1){
			shipAngle += 2;
		}
		if(keys.indexOf(37) > -1) {
			shipAngle -= 2;
		}
		if(keys.indexOf(40) > -1) {
			if(shipSpeed > 1)
			shipSpeed -= 0.1;
		}
		if(keys.indexOf(38) > -1) {
			if(shipSpeed < 5 && charge > 2){
				shipSpeed += 0.1;
				charge-=0.02;
			}
		}
		if(n % 10 == 0 && keys.indexOf(32) > -1) {
			shoot();
		}
		
		checkDeaths();
		checkWrecks();
		
		ctx.font = "18px Arial";
		ctx.textAlign = "right";
		ctx.fillText("Score: " + score + "    Kills: " + kills, canvas.width - 10, 20);
		
	}, 10);
	
	setInterval(function() {
		if(ships.length < 10) {
			var newShip = {
				x: parseInt(Math.random() * mapSize),
				y: parseInt(Math.random() * mapSize),
				r: parseInt(Math.random() * 360),
				health: 30,
				charge: 30
			};
			
			ships.push(newShip);
			log("New ship spawned at (" + newShip.x + "," + newShip.y +")");
		}
	}, 500);
});

function log(msg) {
	console.log(msg);
	var p = $("<p/>").text(msg);
	$("#log").append(p);
	setTimeout(function() {
		p.fadeOut(1000);
		setTimeout(function() {
			p.remove();
		}, 1000);
	}, 3000);
}

function drawOthers() {
	for(var i =0 ; i < ships.length; i++) {
		
		var rand = parseInt(Math.random() * 10);
		
		if(rand < 2) {
			ships[i].r += 3;
		}else if(rand > 8) {
			ships[i].r -= 3;
		}
		
		var ship = ships[i];
		var x = ship.x - cameraX;
		var y = ship.y - cameraY;
		
		ctx.save();
		ctx.translate(x,y);
		ctx.rotate(ship.r * TO_RADIANS);
		ctx.drawImage(shipImg, -shipImg.width / 2, -shipImg.height / 2);
	
		ctx.beginPath();
	    ctx.strokeStyle = "rgb(0,255,0)";		
		ctx.lineWidth = 2;
		ctx.moveTo(-20, -15);
		ctx.lineTo(-20, -15+ship.health);
		ctx.stroke();
		ctx.closePath();
		
		/*ctx.rotate(-ship.r * TO_RADIANS);
		ctx.font = "18px Arial";
		ctx.fillText(parseInt(ship.x)+","+parseInt(ship.y), 25, 25);
		ctx.rotate(ship.r * TO_RADIANS);*/
		
		ctx.beginPath();
		ctx.strokeStyle = "rgb(0,0,255)";
		ctx.moveTo(-25, -15);
		ctx.lineTo(-25, -15+ship.charge);
		ctx.stroke();
		ctx.closePath();
		
		ctx.restore();
		
		var newX = ships[i].x + Math.cos(ship.r * TO_RADIANS);
		var newY = ships[i].y + Math.sin(ship.r * TO_RADIANS);
		if(newX > 0 && newX < mapSize) {
			ships[i].x = newX;
			ships[i].r += 180;
		}
		if(newY > 0 && newY < mapSize) {
			ships[i].y = newY;
			ships[i].r += 180;
		}
	}
}

function shoot() {
	if(!(charge >= 2)) return;
	var shotX = shipX + (Math.cos(shipAngle * TO_RADIANS) * 20);
	var shotY = shipY + (Math.sin(shipAngle * TO_RADIANS) * 20);
	shots.push({x: shotX, y: shotY, angle: shipAngle, speed: shipSpeed + 3, life: 0});
	charge-=2;
}

function oshoot(i) {
	var ship = ships[i];
	if(!(ship.charge >= 2)) return;
	var shotX = ship.x + (Math.cos(ship.r * TO_RADIANS) * 20);
	var shotY = ship.y + (Math.sin(ship.r * TO_RADIANS) * 20);
	shots.push({x: shotX, y: shotY, angle: ship.r, speed: 3, life: 0});
	ships[i].charge -= 2;
}

document.onkeydown = function(e) {
	if(keys.indexOf(e.keyCode) == -1) 
		keys.push(e.keyCode);
};

document.onkeyup = function(e) {
	keys.splice(keys.indexOf(e.keyCode), 1);
};

function drawBackground() {
	ctx.lineWidth = 0.65;
	ctx.strokeStyle = "#c7cfd3";
	var cellSize = 40;
	var ix = shipX % cellSize;
	var iy = shipY % cellSize;
	
	ctx.beginPath();
	for(var x = 0 ; x <= canvas.width+cellSize; x+=cellSize) {
		for(var y = 0; y <= canvas.height+cellSize; y+=cellSize) {
			ctx.rect(-ix+x, -iy+y , cellSize, cellSize);
		}
	}
	ctx.stroke();
	ctx.closePath();
}

function drawPlayer() {
	ctx.save();
	ctx.translate(shipX-cameraX,shipY-cameraY);
	ctx.rotate(shipAngle * TO_RADIANS);
	ctx.drawImage(shipImg, -shipImg.width / 2, -shipImg.height / 2);

	ctx.beginPath();
    ctx.strokeStyle = "rgb(0,255,0)";		
	ctx.lineWidth = 2;

	ctx.moveTo(-20, -15);
	ctx.lineTo(-20, -15+shipHealth);
	ctx.stroke();
	ctx.closePath();
	
	/*ctx.rotate(-shipAngle * TO_RADIANS);
	ctx.font = "18px Arial";
	ctx.fillText(parseInt(shipX)+","+parseInt(shipY), 25, 25);
	ctx.rotate(shipAngle * TO_RADIANS);*/
	
	ctx.beginPath();
	ctx.strokeStyle = "rgb(0,0,255)";
	ctx.moveTo(-25, -15);
	ctx.lineTo(-25, -15+charge);
	ctx.stroke();
	ctx.closePath();
	
	ctx.restore();
}

function drawBorder() {
	ctx.beginPath();
	ctx.strokeStyle = "RED";
	ctx.lineWidth = 3;
	ctx.rect(-cameraX, -cameraY, mapSize, mapSize);
	ctx.stroke();
	ctx.closePath();
}

function checkDeaths() {
	for(var s = 0; s < shots.length; s++) {
		var shot = shots[s];
		if(distance(shot, {x: shipX, y:shipY}) < 15) {
			shipHealth -= 5;
			shots.splice(s, 1);
			s--;
			if(shipHealth <= 0){
				alert("You Lose");
				explosion(shipX, shipY);
				wrecks.push({x: shipX, y: shipY});
			}
			continue;
		}
		for(var i = 0; i < ships.length; i++) {
			var ship = ships[i];
			if(distance(shot, ship) < 15) {
				ships[i].health -= 5;
				shots.splice(s, 1);
				s--;
				if(ships[i].health <= 0) {
					explosion(ship.x, ship.y);
					wrecks.push({x: ship.x, y: ship.y});
					ships.splice(i, 1);
					kills++;
					i--;
				}
				continue;
			}
		}
	}
}

function explosion(x, y){
	explosions.push({x: x, y: y, state: 0});
}

function distance(o1, o2) {
	return Math.sqrt(Math.pow(o2.x - o1.x, 2) + Math.pow(o2.y - o1.y, 2));
}

function drawExplosions() {
	for(var i = 0; i < explosions.length; i++) {
		var exp = explosions[i];
		var state = parseInt(exp.state);
		var sx = (128 * (state % 4)) + 3;
		var sy = (128 * parseInt(state / 4)) + 3;
		ctx.drawImage(expImg, sx, sy, 123, 123, exp.x-cameraX-62.5, exp.y-cameraY-62.5, 125, 125);
		if(exp.state > 16) {
			explosions.splice(i, 1);
			i--;
		}else{
			explosions[i].state += 0.4;
		}
	}
}

function checkWrecks() {
	for(var w = 0; w < wrecks.length; w++){
		var wreck = wrecks[w];
		if(distance(wreck, {x: shipX, y:shipY}) < 15) {
			wrecks.splice(w, 1);
			w--;
			
			var element = $("<div/>").text("Wreck").addClass("wreck");
			element.css("top", wreck.y-cameraY-(wreckImg.height/2));
			element.css("left", wreck.x-cameraX-(wreckImg.width/2));
			$("#view").append(element);
			element.animate({
				left: canvas.width - 150,
				top: 10
			}, 850, function() {
				score+=50;
				if(charge > 25) 
					charge = 30;
				else
					charge += 5;
				element.remove();
			});
		}
	}
}

function drawWrecks() {
	for(var i =0; i < wrecks.length; i++) {
		var wreck = wrecks[i];
		ctx.drawImage(wreckImg, wreck.x-cameraX-(wreckImg.width/2), wreck.y-cameraY-(wreckImg.height/2));
	}
}