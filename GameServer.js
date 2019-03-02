var ships = []
var shots = []

var INITIAL_HEALTH = 30;
var INITIAL_CHARGE = 30;

var MAP_SIZE = 1500;

exports.initGame = function(io, gameSocket) {
    this.io = io
    this.gameSocket = gameSocket
}