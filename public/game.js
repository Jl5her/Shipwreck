const CLIENT_LOOP_INTERVAL = 1000 / 60
const TO_RADIANS = Math.PI / 180

const MAP_SIZE = 5000

var expImg = new Image()
expImg.src = "img/explosion.png"

var wreckImg = new Image()
wreckImg.src = "img/shipWreck.png"

var shipImg = new Image()
shipImg.src = "img/shipBlue.png"

var enemyImg = new Image()
enemyImg.src = "img/shipRed.png"


class Game {
    constructor(socket) {
        this.players = []
        this.explosions = []
        this.shots = []
        this.movement = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false
        }

        this.canvas = document.getElementById("myCanvas")
        this.ctx = this.canvas.getContext("2d")
        this.width = this.canvas.width = window.innerWidth
        this.height = this.canvas.height = window.innerHeight
        this.socket = socket
        this.cameraX = 0
        this.cameraY = 0

        setInterval(this.mainLoop.bind(this), CLIENT_LOOP_INTERVAL)
    }

    update(data) {
        this.players = data.players
        this.ship = this.players.filter((player) => player.socketId == this.socketId)[0]
        this.shots = data.shots
    }

    drawBackground() {
        this.ctx.lineWidth = 0.65
        this.ctx.strokeStyle = "#C7CFD3"
        
        var cellSize = 40
        var ix = this.ship != undefined ? this.ship.x % cellSize : 0
        var iy = this.ship != undefined ? this.ship.y % cellSize : 0
        iy -= 5 // Align with border
        
        // Cells
        this.ctx.beginPath()
        for(var x = 0; x <= this.width+cellSize; x+=cellSize) 
            for(var y = 0; y <= this.height+cellSize; y+=cellSize) 
                this.ctx.rect(-ix+x, -iy+y, cellSize, cellSize)
            
        this.ctx.stroke()
        this.ctx.closePath()
        
        // Boundaries
        this.ctx.beginPath()
        this.ctx.strokeStyle = "red"
        this.ctx.lineWidth = 1
        this.ctx.rect(-this.cameraX, -this.cameraY, MAP_SIZE, MAP_SIZE)
        this.ctx.stroke()
        this.ctx.closePath()
    }

    setControls() {
        $(document).keydown((e) => {
            switch(e.keyCode) {
                case 65: // A
                    game.movement.left = true
                    break
                case 87: // W
                    game.movement.up = true
                    break
                case 68: // D
                    game.movement.right = true
                    break
                case 83: // S
                    game.movement.down = true
                    break
                case 32:
                    game.movement.space = true
                    break
            }
        }).keyup((e) => {
            switch(e.keyCode) {
                case 65: // A
                    game.movement.left = false
                    break
                case 87: // W
                    game.movement.up = false
                    break
                case 68: // D
                    game.movement.right = false
                    break
                case 83: // S
                    game.movement.down = false
                    break
                case 32: // Space
                    game.movement.space = false
                    break
            }
        })
    }

    drawBorder() {
        this.ctx.beginPath()
        this.ctx.strokeStyle = 'rgb(100,0,0)'
        this.ctx.lineWidth = 3
        //this.ctx.rect(-this.cameraX, -this.cameraY, mapSize, mapSize)
        this.ctx.stroke()
        this.ctx.closePath()
    }

    mainLoop() {
        this.width = this.canvas.width = window.innerWidth
        this.height = this.canvas.height = window.innerHeight

        var myShip = this.players.filter((player) => player.socketId == this.socketId)[0]
        
        this.cameraX = myShip.x - (this.canvas.width / 2)
        this.cameraY = myShip.y - (this.canvas.height / 2)
        
        this.ctx.clearRect(0, 0, this.width, this.height)
        
        this.drawBackground()
        
        this.shots.forEach((shot) => shot.paint())

        for(var i in this.players) {
            var ship = new Ship(this, this.players[i])
            ship.paint()
        }

        this.socket.emit('movement', { socketId: this.socketId, movement: this.movement })

        this.drawBorder()
        $("#status").html(parseInt(myShip.x) + ", " + parseInt(myShip.y))   

    }
}

class Ship {
    constructor (game, data) {
        this.game = game

        this.x = data.x
        this.y = data.y
        this.r = data.r
        this.health = data.health
        this.socketId = data.socketId
    }

    update() {
        this.x += Math.cos(this.r * TO_RADIANS) * 5
        this.y += Math.sin(this.r * TO_RADIANS) * 5
    }

    paint() {
        this.game.ctx.save()

        var x = this.x - this.game.cameraX
        var y = this.y - this.game.cameraY

        this.game.ctx.translate(x,y)
        this.game.ctx.rotate(this.r * TO_RADIANS)

        if (this.dead) {
            this.game.ctx.drawImage(wreckImg, -wreckImg.width/2, -wreckImg.height/2)
            this.game.ctx.restore()
            return
        }

        var img = enemyImg

        if (this.game.socketId == this.socketId)
            img = shipImg

        this.game.ctx.drawImage(img, -shipImg.width/2, -shipImg.height/2)

        /* Health */

        this.game.ctx.beginPath()
        this.game.ctx.lineWidth = 2
        this.game.ctx.strokeStyle = 'rgb(0,255,0)'
        this.game.ctx.moveTo(-20, -15)
        this.game.ctx.lineTo(-20, -15 + this.health)
        this.game.ctx.stroke()
        this.game.ctx.fill()
        this.game.ctx.closePath()

        /* Power */

        this.game.ctx.beginPath()
        this.game.ctx.lineWidth = 2
        this.game.ctx.strokeStyle = 'rgb(0,0,255)'
        this.game.ctx.moveTo(-25, -15)
        this.game.ctx.lineTo(-25, -15 + this.health)
        this.game.ctx.stroke()
        this.game.ctx.closePath()

        /***/

        this.game.ctx.restore()
    }
}

class Shot {
    constructor (game, shotId) {
        this.game = game
        this.shotId = shotId

        this.x = game.shots[shotId].x
        this.y = game.shots[shotId].y
        this.r = game.shots[shotId].r
    }

    paint() {
        var x = this.x - this.game.cameraX
        var y = this.y - this.game.cameraY

        this.game.ctx.beginPath()
        this.game.ctx.arc(x, y, 3, 0, Math.PI * 2)
        this.game.ctx.fill()
        this.game.ctx.closePath()
    }
}