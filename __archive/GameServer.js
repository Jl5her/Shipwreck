var io;

var ships = []
var shots = []

var INITIAL_HEALTH = 30;
var INITIAL_CHARGE = 30;

var MAP_SIZE = 1500;
exports =  {

    createGame: (sio) => {
        io = sio
    },

    initGame: (socket) => {
        this.gameSocket = socket;
    },

    newShip: () => {

    },

    newShot: () => {

    }
}