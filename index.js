const express = require('express')
var path = require('path')
var app = express()

var gameServer = require('./gameServer')

app.use(express.static(path.join(__dirname, 'www')))

var server = require('http').createServer(app).listen(80)
console.log("server started on port :80")

var io = require('socket.io').listen(server)

io.sockets.on('connection', (socket) => {
	console.log("client connected to the server")
	gameServer.initGame(io, socket)
})


//const express = require('express')
//const app = express()

//app.use(express.static(__dirname + 'www'))

//var server = require('http').createServer(app).listen(80, () => {
//	console.log('Server running at  %s:80', server.address().address)
//})

//const gameServer = require('./gameServer')
//const io = require('socket.io').listen(server)

//io.sockets.on('connection', (socket) => {
//	gameServer.initGame(io, socket)
//})
