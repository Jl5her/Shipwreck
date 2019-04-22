var game;

$(document).ready(() => {
    var socket = io.connect()

    socket.on('connected', (data) => {
       game = new Game(socket)

       game.socketId = data.socketId
       game.MAP_SIZE = data.MAP_SIZE
       game.setControls()
    })

    socket.on('update', (data) => {
    	game.receiveData(data)
    })
})