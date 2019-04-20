const express = require('express')
const path = require('path')
const app = express()

const shipwreck = require('./shipwreck')

app.use(express.static(path.join(__dirname, 'public')))

const server = require('http').createServer(app).listen(80)
const io = require('socket.io').listen(server)

shipwreck.initGame(io)

io.on('connection', (socket) => {
	shipwreck.connection(socket)
})