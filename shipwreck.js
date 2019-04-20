var io

var players = []
var shots = []

const MAP_SIZE = 5000
const TO_RADIANS = Math.PI / 180

exports.initGame = function(sio) {
    io = sio

    setInterval(() => {
    	update()

    	io.sockets.emit('update', { players: players, shots: shots })
    }, 35)
}

exports.connection = function(socket) {
	players.push(newPlayerData(socket.id))

	socket.emit('connected', { socketId: socket.id })
	socket.on('movement', movement)

	socket.on('disconnect', () => {
		players = players.filter((player) => player.socketId != socket.id)
	})
}

function movement(data) {
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
	}
}

function newPlayerData(socketId) {
	return {
		socketId: socketId,
		x: MAP_SIZE * Math.random(),
		y: MAP_SIZE * Math.random(),
		health: 30,
		r: 360 * Math.random(),
		movement: {left: false, right: false, up: false, down: false}
	}
}