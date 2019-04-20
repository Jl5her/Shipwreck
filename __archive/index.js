const express = require('express')
var path = require('path')
var app = express()
var GameServer = require('./GameServer')

app.use(express.static(path.join(__dirname, 'www')))

var server = require('http').createServer(app).listen(80)
console.log("server started on port :80")

var io = require('socket.io').listen(server)
GameServer.createGame(io)

var players = []

io.on('connection', (socket) => {
	socket.on('new player', () => {
		players[socket.id] = {
			x: 300,
			y: 300,
			r: 0
		}
	})

	socket.on('movement', (data) => {
		var player = players[socket.id] || {}
		if (data.left) 
			player.r -= 5 * TO_RADIANS
		else if (data.right)
			player.r += 5 * TO_RADIANS
	})
})

setInterval(function() {
	io.sockets.emit('state', players)
}, 1000 / 60)