$(document).ready(function() {
	var socket = io.connect();
	var canvas = document.getElementById("myCanvas");
	var game = new Game(canvas, socket);
	var shipName = prompt("shipName: ");
	joinGame(shipName, socket);
	
	socket.on('addShip', function(ship){
		game.addShip(ship.id, ship.isLocal, ship.x, ship.y, ship.hp, ship.charge);
	});
	
	socket.on('sync', function(gameServerData){
		game.receiveData(gameServerData);
	});
	
	socket.on('killShip', function(shipData){
		game.killShip(shipData);
	});
	
	socket.on('removeShip', function(shipId){
		game.removeShip(shipId);
	});
	
	$(window).on('beforeunload', function(){
		socket.emit('leaveGame', shipName);
	});
});

function joinGame(shipName, socket){
	if(shipName != ''){
		socket.emit('joinGame', {id: shipName});
	}
}