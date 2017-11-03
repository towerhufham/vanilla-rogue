function createArray(length) { //this function by Matthew Crumley
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

function randomPop(arr) {
	var index = Math.floor(ROT.RNG.getUniform() * arr.length);
    var e = arr.splice(index, 1)[0];
	return e;
}

var Game = {
    display: null,
	width: 50,
	height: 30,
	player: null,
    map: null,
    engine: null,
    entities: [],
    
    init: function() {
	this.display = new ROT.Display({width:this.width, height:this.height, fontSize:32});
        document.body.appendChild(this.display.getContainer());
        
		this.map = createArray(this.width, this.height);
        this.generateMap();
        
        var scheduler = new ROT.Scheduler.Simple();
		scheduler.add(this.player, true);

        this.engine = new ROT.Engine(scheduler);
        this.engine.start();
		
		this.drawMap();
    },
    
    generateMap: function() {
        var generator = new ROT.Map.Rogue(this.width, this.height);
        var freeCells = [];
        var floor = new Tile(".", "#777", "#000")
		
        var callback = function(x, y, value) {
            if (value) { return; }
            
            this.map[x][y] = floor;
            freeCells.push({x:x, y:y});
        }
        generator.create(callback.bind(this));
		
		this.addPotion(freeCells);
		
		//todo: this probably should be put somewhere else
		this.createPlayer(freeCells);
    },
	
	createPlayer(freeCells) {
		this.player = new Player({name:"Player", character:"@", fg:"#0f0"}); 
		var coord = randomPop(freeCells);
		this.player.setPosition(coord.x, coord.y);
		this.entities.push(this.player);
	},
	
	drawTile: function(x, y) {
		if (this.map[x][y]) {
			var t = this.map[x][y];
			this.display.draw(x, y, t.character, t.fg, t.bg);
		} else {
			this.display.draw(x, y, " ", "#fff", "#000");
		}
	},
	
	drawMap: function() {
		//draw tiles
		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				this.drawTile(x, y);
			}
		}
		//draw entities
		for (var i = 0; i < this.entities.length; i++) {
			this.entities[i].draw();
		}
	},
	
	addPotion: function(freeCells) {
		var p = new Item({name:"Cyan Potion", character:"?", fg:"#0ff"});
		var coord = randomPop(freeCells);
		p.setPosition(coord.x, coord.y);
		this.entities.push(p);
	},
}
    
class Tile { 
	constructor(character, fg, bg, passable=true) {
		this.character = character;
		this.fg = fg;
		this.bg = bg;
		this.passable;
	}
}

class Entity {
	constructor(config) {
		if ("name" in config) {
			this.name = config.name;
		} else {
			this.name = "No name";
		}
		
		if ("character" in config) {
			this.character = config.character;
		} else {
			this.character = "?";
		}
		
		if ("fg" in config) {
			this.fg = config.fg;
		} else {
			this.fg = "#fff";
		}
		
		if ("bg" in config) {
			this.bg = config.bg;
		} else {
			this.bg = "#000";
		}
		
		this.entity_type = "entity";
		this.x = null;
		this.y = null;
	}
	
	setPosition(x, y) {
		this.x = x;
		this.y = y;
	}
	
	draw() {
		//console.log("finna draw a " + this.name + " at " + this.x + "," + this.y);
		if (this.x && this.y) {
			Game.display.draw(this.x, this.y, this.character, this.fg, this.bg);
		}
	}
}

class Item extends Entity {
	constructor(config) {
		super(config);
		this.entity_type = "item";
	}
}

class Actor extends Entity {
	constructor(config) {
		super(config);
		this.entity_type = "actor";
	}
}

class Player extends Actor {
	constructor(config) {
		super(config);
		this.entity_type = "player";
	}
	
	act() {
		Game.engine.lock();
		window.addEventListener("keydown", this);
	}
	
	handleEvent(e) {
		var keyMap = {};
		keyMap[38] = 0;
		keyMap[33] = 1;
		keyMap[39] = 2;
		keyMap[34] = 3;
		keyMap[40] = 4;
		keyMap[35] = 5;
		keyMap[37] = 6;
		keyMap[36] = 7;

		var code = e.keyCode;
		/* one of numpad directions? */
		if (!(code in keyMap)) { return; }

		/* is there a free space? */
		var dir = ROT.DIRS[8][keyMap[code]];
		var newX = this.x + dir[0];
		var newY = this.y + dir[1];
		
		//quit if there is no tile
		if (!(Game.map[newX][newY])) {return;}
		//quit if the tile is impassable
		if (Game.map[newX][newY].passable) {return;}

		Game.drawTile(this.x, this.y);
		this.x = newX;
		this.y = newY;
		this.draw();
		window.removeEventListener("keydown", this);
		Game.engine.unlock();
	}
}
		
