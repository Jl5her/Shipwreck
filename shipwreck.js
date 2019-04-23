var io

var players = []
var shots = []

const MAP_SIZE = 2500
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
	socket.on('respawn', respawnSocket )
	socket.on('disconnect', disconnect.bind(null, socket))
}

function disconnect(socket) {
	players = players.filter((player) => player.socketId != socket.id)
}

function respawnSocket(data) {
	var ship = players.filter((player) => player.socketId == data.socketId)[0]
	if(ship.dead) {
		var index = players.indexOf(ship)
		players[index] = newPlayerData(data.socketId)
	}
}

function receiveMovement(data) {
	for(var i in players) 
		if(players[i].socketId == data.socketId) 
			players[i].movement = data.movement
}

function shoot(player) {
	if(player.cooldown == 0 && player.energy > 0) {
		shots.push(newShotData(player))
		player.cooldown = 5
		player.energy -= 2
	}
}

function updatePlayers() {
	players.forEach((player) => {
		if(player.dead) return

		var dx = Math.cos(player.r * TO_RADIANS) * player.speed
		var dy = Math.sin(player.r * TO_RADIANS) * player.speed

		if ((player.x + dx) > 0 && (player.x + dx) < MAP_SIZE)
			player.x += dx
		if((player.y + dy ) > 0 && (player.y + dy) < MAP_SIZE)
			player.y += dy

		if (player.movement.left)
			player.r = (player.r - 5).mod(360)
		
		if (player.movement.right)
			player.r = (player.r + 5).mod(360)

		if (player.movement.space)
			shoot(player)

		if (player.cooldown > 0)
			player.cooldown--
		if(player.energy < 30)
			player.energy += 0.1
	})
}
function updateShots() {
	shots.forEach((shot) => {
		shot.x += Math.cos(shot.r * TO_RADIANS) * shot.speed
		shot.y += Math.sin(shot.r * TO_RADIANS) * shot.speed
	})
	shots = shots.filter((shot) => shot.x > 0 && shot.x < MAP_SIZE && shot.y > 0 && shot.y < MAP_SIZE)
}

function distance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

function checkCollisions() {
	players.forEach((ship) => {
		shots.forEach((shot) => {
			if (ship.socketId != shot.ownerId && distance(shot.x, shot.y, ship.x, ship.y) < 40) {
				if(ship.health-- <= 0)
					ship.dead = true
			}
		})
	})
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
		energy: 30,
		speed: 5,
		movement: {left: false, right: false, up: false, down: false, space: false},
		cooldown: 0
	}
}

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};