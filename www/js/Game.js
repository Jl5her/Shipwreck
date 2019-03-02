var CLIENT_LOOP_INTERVAL = 10

var expImg = Image("expImg")
var wreckImg = Image("wreckImg")
var shipImg = Image("shipImg")

function Game(canvas, socket) {
    this.ships = []
    this.explosions = []
    this.shots = []

    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.width = canvas.width = window.innerWidth
    this.height = canvas.height = window.innerHeight
    this.socket = socket
    
    this.cameraX = 0
    this.cameraY = 0
    
    setInterval(Game.mainLoop, CLIENT_LOOP_INTERVAL)
}

Game.prototype = {

    loadServerInfo: (data) => {

    },
    
    drawBackground: function() {
        this.ctx.lineWidth = 0.65
        this.ctx.strokeStyle = "#C7CFD3"
        
        var cellSize = 40
        var ix = this.ship != undefined ? this.ship.x % cellSize : 0
        var iy = this.ship != undefined ? this.ship.y % cellSize : 0
        iy -= 5 // Align with border
        
        this.ctx.beginPath()
        for(var x = 0; x <= this.width+cellSize; x+=cellSize) 
            for(var y = 0; y <= this.height+cellSize; y+=cellSize) 
                this.ctx.rect(-ix+x, -iy+y, cellSize, cellSize)
            
        this.ctx.stroke()
        this.ctx.closePath()
        
        //Border
        this.ctx.beginPath()
        this.ctx.strokeStyle = "red"
        this.ctx.lineWidth = 1
        this.ctx.rect(-this.cameraX, -this.cameraY, MAP_SIZE, MAP_SIZE)
        this.ctx.stroke()
        this.ctx.closePath()
    },
    
    addShip: function(id, isLocal, x, y, hp, charge) {
        var ship = new Ship(id, this, isLocal, x, y, hp, charge)
        if(isLocal) {
            this.ship = ship
            this.cameraX = ship.x - (window.innerWidth / 2)
            this.cameraY = ship.y - (window.innerHeight / 2)
        }else{
            this.ships.push(ship)
        }
    },
    
    removeShip: function(shipId) {
        this.ships = this.ships.filter(function(other){return other.id!=shipId})
    },
    
    killShip: function(ship) {
        ship.dead = true
        //this.removeShip(ship.id)
    },
    
    addShot: function(shot) {
        this.shots.push(shot)
    },
    
    mainLoop: function(){ 
        console.log("this")
        this.width = this.canvas.width = window.innerWidth
        this.height = this.canvas.height = window.innerHeight
        
        this.ctx.clearRect(0, 0, this.width, this.height)
        
        this.drawBackground()
        
        this.shots.forEach((shot) => shot.paint())
        
        if(this.ship == undefined) return
        
        this.cameraX = this.ship.x - (this.width / 2)
        this.cameraY = this.ship.y - (this.height / 2)

        // this.drawBorder()

        if(this.ship != undefined) {
            // Send player move
        }
    },
    
    sendData: function() {
        var gameData = {}
        
        var s = {
            id: this.ship.id,
            x: this.ship.x,
            y: this.ship.y,
            angle: this.ship.angle,
            hp: this.ship.hp,
            charge: this.ship.charge
        }
        
        gameData.ship = s
        this.socket.emit('sync', gameData)
    },
    
    receiveData: function(serverData) {
        var game = this
        serverData.ships.forEach(function(serverShip) {
            if(game.ship != undefined && serverShip.id == game.ship.id) {
                game.ship.hp = serverShip.hp
                if(game.ship.hp <= 0) 
                    game.killShip(game.ship)
            }
            
            var found = false
            game.ships.forEach(function(clientShip) {
                if(clientShip.id == serverShip.id) {
                    clientShip.x = serverShip.x
                    clientShip.y = serverShip.y
                    clientShip.angle = serverShip.angle
                    clientShip.hp = serverShip.hp
                    clientShip.charge = serverShip.charge
                    if(clientShip.hp <= 0) {
                        game.killShip(clientShip)
                    }
                    clientShip.refresh()
                    found = true
                }
            })
            if(!found && (game.ship == undefined || serverShip.id != game.ship.id)) {
                game.addShip(serverShip.id, false, serverShip.x, serverShip.y, serverShip.hp, serverShip.charge)   
            }
        })
        serverData.shots.forEach(function(serverShot) {
           var b = new Shot(game, serverShot.x, serverShot.y)
           game.addShot(b)
        })
    },
    
    drawExplosions: function() {
        this.explosions.forEach(function(explosion) {
            var state = parseInt(explosion.state)
            var x = explosion.x - this.cameraX - 62.5
            var y = explosion.y - this.cameraY - 62.5
            var sx = (128 * (state % 4)) + 3
            var sy = (128 * parseInt(state / 4)) + 3
            this.ctx.drawImage(expImg, sx, sy, 123, 123, x, y, 125, 125)
            explosion.state += 0.4
        }, this)
        this.explosions = this.explosions.filter(function(explosion){ return explosion.state <= 16})
    }
}


function Ship(id, game, isLocal, x, y, hp, energy) {
    this.id = id
    this.game = game
    this.speed = 1
    this.angle = 0
    this.x = x
    this.y = y
    this.isLocal = isLocal
    this.hp = hp
    this.energy = energy
    this.dead = false
    this.keys = []
    
    if(isLocal) {
        game.ship = this
        this.setControls()
    }
}

Ship.prototype = {
    
    paint: function() {
        this.game.ctx.save()
        var x = this.x - this.game.cameraX
        var y = this.y - this.game.cameraY
        this.game.ctx.translate(x, y)
        this.game.ctx.rotate(this.angle * TO_RADIANS)
        
        if(this.dead) {
            this.game.ctx.drawImage(wreckImg, -wreckImg.width/2, -wreckImg.height/2)
            this.game.ctx.restore()
            return
        }
        
        this.game.ctx.drawImage(shipImg, -shipImg.width/2, -shipImg.height/2)
        
        /***/
        
        this.game.ctx.beginPath()
        this.game.ctx.lineWidth = 4
        this.game.ctx.strokeStyle = 'rgb(255,0,0)'
        this.game.ctx.moveTo(0, 0)
        this.game.ctx.lineTo(100, 100)
        this.game.ctx.stroke()
        this.game.ctx.fill()
        this.game.ctx.closePath()
        
        /***/
        
        this.game.ctx.lineWidth = 2
        
        this.game.ctx.beginPath()
        this.game.ctx.strokeStyle = "rgb(0,255,0)"
        this.game.ctx.moveTo(-20, -15)
        this.game.ctx.lineTo(-20, -15+this.health)
        this.game.ctx.stroke()
        this.game.ctx.fill()
        this.game.ctx.closePath()
        
        this.game.ctx.beginPath()
        this.game.ctx.strokeStyle = "rgb(0,0,255)"
        this.game.ctx.moveTo(-25, -15)
        this.game.ctx.lineTo(-25, -15+this.charge)
        this.game.ctx.stroke()
        this.game.ctx.closePath()
        
        this.game.ctx.restore()
    },
    
    setControls: function() {
        var g = this
        $(document).keydown(function(e) {
            var k = e.keyCode || e.which
            if(g.keys.indexOf(k) == -1) 
                g.keys.push(k)
        }).keyup(function(e){
           var k = e.keyCode || e.which
           var i = g.keys.indexOf(k)
           g.keys.splice(i, 1)
        })
    },
    
    move: function() {
        if(this.dead) 
            return  
        
        var newX = this.x + (Math.cos(this.angle * TO_RADIANS) * this.speed)
        var newY = this.y + (Math.sin(this.angle * TO_RADIANS) * this.speed)
        
        if(newX > 0 && newX < MAP_SIZE) this.x = newX
        if(newY > 0 && newY < MAP_SIZE) this.y = newY
        
        this.refresh()
        
        this.paint()
    }, 
    
    refresh: function() {
        if(this.keys.indexOf(39) > -1) 
            this.angle += 2
            
        if(this.keys.indexOf(37) > -1) 
            this.angle -= 2
            
        if(this.keys.indexOf(40) > -1) 
            if(this.speed > 1) 
                this.speed -= 0.1

        if(this.keys.indexOf(38) > -1) 
            if(this.speed < 5) 
                this.speed += 0.1
        
        if(this.keys.indexOf(32) > -1) 
            this.shoot()
    },
    
    shoot: function() {
        if(this.dead) 
            return
            
        if(this.charge < 2)
            return
            
        var deltaX = 20 * Math.cos(this.angle * TO_RADIANS)
        var deltaY = 20 * Math.sin(this.angle * TO_RADIANS)
            
        var serverShot = {}
        serverShot.angle = this.angle
        serverShot.ownerId = this.id
        serverShot.x = this.x + deltaX
        serverShot.y = this.y + deltaY
        
        this.game.socket.emit('shoot', serverShot)
        
        this.charge -= 2
    }
}

function Shot (game, x, y) {
    this.game = game
    this.x = x
    this.y = y
}

Shot.prototype = {
    
    paint: function() {
        var x = this.x - this.game.cameraX
        var y = this.y - this.game.cameraY
        this.game.ctx.beginPath()
        this.game.ctx.arc(x, y, 3, 0, Math.PI * 2)
        this.game.ctx.fill()
        this.game.ctx.closePath()
    }
}

function Image(id) {
    return document.getElementById(id)
}