var canvas
var socket
var game

$(document).ready(() => {
	socket = io.connect()
	canvas = document.getElementById("myCanvas")
	game = new Game(canvas, socket)

	socket.on('connection', game.loadServerInfo)
	
	// socket.on('addShip', function(ship){
	// 	game.addShip(ship.id, ship.isLocal, ship.x, ship.y, ship.hp, ship.charge)
	// })
	
	$(window).on('beforeunload', () => {
		socket.emit('leaveGame', shipName)
	})
})