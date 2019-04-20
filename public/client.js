var game;

$(document).ready(() => {
    var socket = io.connect()

    socket.on('connected', (data) => {
       game = new Game(socket)

       game.socketId = data.socketId
       game.setControls()
    })

    socket.on('update', (data) => {
    	game.update(data)
    })
})