var io

var players = []
var shots = []

const MAP_SIZE = 5000
const TO_RADIANS = Math.PI / 180

exports.initGame = function(sio) {
    io = sio

    setInterval(() => {
    	updatePlayers()
    	updateShots()
    	checkCollisions()
    	io.sockets.emit('update', { players: players, shots: shots })
    }, 35)
}

exports.connection = function(socket) {
	players.push(newPlayerData(socket.id))

	socket.emit('connected', { socketId: socket.id, MAP_SIZE: MAP_SIZE })
	socket.on('movement', receiveMovement )

	socket.on('disconnect', disconnect )
}

function disconnect(socket) {
	players = players.filter((player) => player.socketId != socket.id)
	})
}

function receiveMovement(data) {
	for(var i in players) 
		if(players[i].socketId == data.socketId) 
			players[i].movement = data.movement
}

function update() {
	for(var i in players) {
		var player = players[i]
		player.x += Math.cos(player.r * TO_RADIANS) * 5
		player.y += Math.sin(player.r * TO_RADIANS) * 5

		if (player.movement.left){
			player.r -= 5
		}
		if (player.movement.right){
			player.r += 5
		}

function newShotData(player) {
	return {
		x: player.x,
		y: player.y,
		r: player.r,
		speed: 10,
		ownerId: player.socketId
	}
}

function newPlayerData(socketId) {
	return {
		socketId: socketId,
		x: MAP_SIZE * Math.random(),
		y: MAP_SIZE * Math.random(),
		r: 360 * Math.random(),
		health: 30,
		r: 360 * Math.random(),
		movement: {left: false, right: false, up: false, down: false}
	}
}