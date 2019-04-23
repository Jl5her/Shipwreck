const CLIENT_LOOP_INTERVAL = 1000 / 60
const TO_RADIANS = Math.PI / 180

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
        this.socket = socket
        this.movement = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false
        }

        this.canvas = document.getElementById("myCanvas")
        this.ctx = this.canvas.getContext("2d")
        this.minimap_enabled = false

        setInterval(this.mainLoop.bind(this), CLIENT_LOOP_INTERVAL)
    }

    receiveData(data) {
        this.players = data.players
        this.shots = data.shots
        
        /* Which ship is the local player */
        this.ship = this.players.filter((player) => player.socketId == this.socketId)[0]
    }

    drawBackground() {
        this.ctx.lineWidth = 0.65
        this.ctx.strokeStyle = "#C7CFD3"

        // Draw Space
        /*this.ctx.fillRect(0, 0, -this.cameraX, this.height)
        this.ctx.fillRect(0, 0, this.width, -this.cameraY)
        this.ctx.fillRect(-(this.cameraX - this.MAP_SIZE), 0, this.width, this.height)
        this.ctx.fillRect(0, -(this.cameraY - this.MAP_SIZE), this.width, this.height)*/

        
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
        this.ctx.rect(-this.cameraX, -this.cameraY, this.MAP_SIZE, this.MAP_SIZE)
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

    mainLoop() { /* Rendering */
        this.width = this.canvas.width = window.innerWidth
        this.height = this.canvas.height = window.innerHeight

        this.myShip = this.players.filter((player) => player.socketId == this.socketId)[0]
        
        this.cameraX = this.myShip.x - (this.canvas.width / 2)
        this.cameraY = this.myShip.y - (this.canvas.height / 2)
        
        this.ctx.clearRect(0, 0, this.width, this.height)
        
        this.drawBackground()
        
        this.shots.forEach((shotData) => {
            var shot = new Shot(this, shotData)
            shot.paint()
        })

        this.players.forEach((playerData) => {
            var ship = new Ship(this, playerData)
            ship.paint()
        })

        this.socket.emit('movement', { socketId: this.socketId, movement: this.movement })

        this.minimap()
        this.status()
    }

    status() {
        $("#status").html(`<p>${this.socketId}</p>` + 
        `<p>${int(this.myShip.x)}, ${int(this.myShip.y)}, ${int(this.myShip.r)}°</p>` + 
        `<p>${int(this.myShip.energy)} ${int(this.myShip.health)} ${int(this.myShip.cooldown)}</p>` +
        `<p>${int(this.cameraX)}, ${int(this.cameraY)}`)
    }

    minimap() {
        if (!this.minimap_enabled) return;
        var minimap_size = 150
        var scale = minimap_size / this.MAP_SIZE

        this.ctx.fillStyle = "green"
        var x = 5
        var y = 5

        this.ctx.lineWidth = 1
        this.ctx.strokeStyle = "#666"
        this.ctx.strokeRect(x, y, minimap_size, minimap_size)

        this.players.forEach((playerData) => {
            if (playerData.socketId == this.socketId)
                this.ctx.fillStyle = "green"
            else
                this.ctx.fillStyle = "red"
            this.ctx.beginPath()
            this.ctx.arc(x + (playerData.x * scale), y + (playerData.y * scale), 2, 0, 2 * Math.PI)
            this.ctx.fill()
            this.ctx.closePath()
        })
    }
}

class Ship {
    constructor (game, data) {
        this.game = game

        this.x = data.x
        this.y = data.y
        this.r = data.r
        this.health = data.health
        this.energy = data.energy
        this.dead = data.dead
        this.movement = data.movement
        this.cooldown = data.cooldown
        this.socketId = data.socketId
    }

    paint() {
        this.game.ctx.save()

        var x = this.x - this.game.cameraX
        var y = this.y - this.game.cameraY

        this.game.ctx.translate(x,y)
        this.game.ctx.rotate(this.r * TO_RADIANS)

        var img = this.game.socketId == this.socketId ? shipImg : enemyImg

        if (this.dead) 
            img = wreckImg

        this.game.ctx.drawImage(img, -img.width/2, -img.height/2)

        if(this.dead) {
            this.game.ctx.restore()
            return
        }
        /* Health */

        this.game.ctx.beginPath()
        this.game.ctx.lineWidth = 2
        this.game.ctx.strokeStyle = 'rgb(0,255,0)'
        this.game.ctx.moveTo(-20, -15)
        this.game.ctx.lineTo(-20, -15 + this.health)
        this.game.ctx.stroke()
        this.game.ctx.closePath()

        /* Power */

        this.game.ctx.beginPath()
        this.game.ctx.lineWidth = 2
        this.game.ctx.strokeStyle = 'rgb(0,0,255)'
        this.game.ctx.moveTo(-25, -15)
        this.game.ctx.lineTo(-25, -15 + this.energy)
        this.game.ctx.stroke()
        this.game.ctx.closePath()

        /***/

        this.game.ctx.restore()
    }
}

class Shot {
    constructor (game, data) {
        this.game = game
        this.ownerId = data.ownerId

        this.x = data.x
        this.y = data.y
        this.r = data.r
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

function int(num) {
    return parseInt(num)
}