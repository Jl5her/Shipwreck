var express = require('express');
var app = express();
var SHOT_SPEED = 10;
var SHIP_INIT_HP = 30;
var SHIP_INIT_CHARGE = 30;
var TO_RADIANS = Math.PI / 180;

//Static resources server
app.use(express.static(__dirname + '/www'));

var server = app.listen(80, function () {
	console.log('Server running at port %s', 80);
});

var io = require('socket.io')(server);

function GameServer(){
	this.ships = [];
	this.shots = [];
	this.lastShotId = 0;
}

GameServer.prototype = {
	
	addShip: function(ship){
		this.ships.push(ship);
	},

	addShot: function(shot){
		this.shots.push(shot);
	},

	removeShip: function(shipId){
		this.ships = this.ships.filter( function(other){return other.id != shipId} );
	},

	//Sync tank with new data received from a client
	syncShip: function(newShipData){
		this.ships.forEach( function(ship){
			if(ship.id == newShipData.id){
				ship.x = newShipData.x;
				ship.y = newShipData.y;
				ship.angle = newShipData.angle;
				ship.hp = newShipData.hp;
				ship.charge = newShipData.charge;
			}
		});
	},

	//The app has absolute control of the balls and their movement
	syncShots: function(){
		var self = this;
		//Detect when ball is out of bounds
		this.shots.forEach( function(shot){
			//self.detectCollision(shot);

			if(shot.x < 0 || shot.x > 1000
				|| shot.y < 0 || shot.y > 1000){
				shot.out = true;
			}else{
				//shot.fly();
			}
		});
	},

	//Detect if ball collides with any tank
	detectCollision: function(shot){
		var self = this;

		this.ships.forEach( function(ship){
			if(ship.id != shot.ownerId 
				&& Math.abs(ship.x - shot.x) < 30
				&& Math.abs(ship.y - shot.y) < 30){
				//Hit tank
				self.hurtShip(ship);
				shot.out = true;
			}
		});
	},

	hurtShip: function(ship){
		ship.hp -= 2;
	},

	getData: function(){
		var gameData = {};
		gameData.ships = this.ships;
		gameData.shots = this.shots;

		return gameData;
	},

	cleanDeadShips: function(){
		this.ships = this.ships.filter(function(other){
			return other.hp > 0;
		});
	},

	cleanDeadShots: function(){
		this.shots = this.shots.filter(function(shot){
			return !shot.out;
		});
	},

	increaseLastShotId: function(){
		this.lastShotId ++;
		if(this.lastShotId > 1000){
			this.lastShotId = 0;
		}
	}

}

var game = new GameServer();

/* Connection events */

io.on('connection', function(client) {
	client.on('joinGame', function(ship){
		console.log(ship.id + ' joined the game');
		var initX = getRandomInt(40, 900);
		var initY = getRandomInt(40, 500);
		client.emit('addShip', {id: ship.id, isLocal: true, x: initX, y: initY, hp: SHIP_INIT_HP, charge: SHIP_INIT_CHARGE });
		client.broadcast.emit('addShip', { id: ship.id, isLocal: false, x: initX, y: initY, hp: SHIP_INIT_HP, charge: SHIP_INIT_CHARGE} );
		game.addShip({id: ship.id, charge: SHIP_INIT_CHARGE, hp: SHIP_INIT_HP});
	});

	client.on('sync', function(data){
		//Receive data from clients
		if(data.ship != undefined){
			game.syncShip(data.ship);
		}
		//update ball positions
		game.syncShots();
		//Broadcast data to clients
		client.emit('sync', game.getData());
		client.broadcast.emit('sync', game.getData());

		//I do the cleanup after sending data, so the clients know 
		//when the tank dies and when the balls explode
		game.cleanDeadShips();
		game.cleanDeadShots();
	});

	client.on('shoot', function(shot){
		var newShot = new Shot(shot.ownerId, shot.angle, shot.x, shot.y);
		game.addShot(newShot);
	});

	client.on('leaveGame', function(shipId){
		console.log(shipId + ' has left the game');
		game.removeShip(shipId);
		client.broadcast.emit('removeShip', shipId);
	});

});

function Shot(ownerId, angle, x, y){
	this.id = game.lastShotId;
	game.increaseLastShotId();
	this.ownerId = ownerId;
	this.angle = angle;
	this.x = x;
	this.y = y;
	this.out = false;
};

Shot.prototype = {

	fly: function(){
		//move to trayectory
		var deltaX = this.speed * Math.sin(this.angle * TO_RADIANS);
		var deltaY = this.speed * Math.cos(this.angle * TO_RADIANS);
		this.x += deltaX;
		this.y += deltaY;
	}

}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}
