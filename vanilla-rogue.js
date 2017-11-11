function createArray(length) { //this function is by Matthew Crumley
    var arr = new Array(length || 0),
        i = length;
    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }
    return arr;
}

function randInt(min, max) {
	return Math.floor(ROT.RNG.getUniform() * (max - min + 1)) + min;
}

function randomPop(arr) {  //TODO: make this use the rot.js random engine so it uses deterministic seeding
	var index = Math.floor(ROT.RNG.getUniform() * arr.length);
    var e = arr.splice(index, 1)[0];
	return e;
}

var Game = {
    display: null,
	width: 70,
	height: 25,
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
		this.addSnail(freeCells);
		
		//todo: this probably should be put somewhere else
		this.createPlayer(freeCells);
    },
	
	getEntitiesAt: function(x, y) {
		found = []
		for (var i = 0; i < this.entities.length ; i++) {
			var ent = this.entities[i];
			if (ent.x === x && ent.y === y) {
				found.push(ent);
			}
		}
		return found;
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
	
	addSnail: function(freeCells) {
		var ai = function() {
			var x = randInt(-1,1);
			var y = randInt(-1,1);
			//console.log(x+","+y);
			this.move(x,y);
		};
		var p = new Actor({name:"Snail", character:"s", fg:"#f4e4a4", ai:ai});
		var coord = randomPop(freeCells);
		p.setPosition(coord.x, coord.y);
		this.entities.push(p);
	},
	
	actorTurn: function() {
		for (var i = 0; i < this.entities.length; i++) {
			//console.log("looking at " + this.entities[i].name);
			if (this.entities[i].entity_type === "actor") {
				//console.log("is actor");
				if (!(this.entities[i].ai === null)) {
					//console.log("has ai");
					this.entities[i].think();
				}
			}
		}
	}
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
		if ("ai" in config) {
			this.ai = config["ai"];
		} else {
			this.ai = null;
		}
		this.entity_type = "actor";
		this.inventory = [];
	}
	
	think() {
		if (typeof this.ai === "function") {
			this.ai();
		} else {
			console.log("Actor " + this.name + " has ai defined but is not callable.");
		}
	}
	
	addToInventory(item) {
		item.setPosition(null, null);
		this.inventory.push(item);
	}
	
	move(dx, dy) {
		var newX = this.x + dx;
		var newY = this.y + dy;
		
		//quit if there is no tile
		if (!(Game.map[newX][newY])) {return;}
		//quit if the tile is impassable
		if (Game.map[newX][newY].passable) {return;}
		
		this.x = newX;
		this.y = newY;
	}
	
	pickUp() {
		var entitiesHere = Game.getEntitiesAt(this.x, this.y);
		for (var i = 0; i < entitiesHere.length; i++) {
			var e = entitiesHere[i];
			if (e.entity_type == "item") {
				this.addToInventory(e);
			}
		}
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
		//console.log(e);
		var movement = {};
		
		movement["ArrowUp"] = {x:0, y:-1};
		movement["ArrowLeft"] = {x:-1, y:0};
		movement["ArrowRight"] = {x:1, y:0};
		movement["ArrowDown"] = {x:0, y:1};
		
		movement["Numpad8"] = {x:0, y:-1};
		movement["Numpad4"] = {x:-1, y:0};
		movement["Numpad6"] = {x:1, y:0};
		movement["Numpad2"] = {x:0, y:1};
		
		movement["Numpad7"] = {x:-1, y:-1};
		movement["Numpad9"] = {x:1, y:-1};
		movement["Numpad1"] = {x:-1, y:1};
		movement["Numpad3"] = {x:1, y:1};
		movement["Numpad5"] = {x:0, y:0};
		
		var key = e.code;
		var didAction = false;
		
		if (key in movement) {
			var dx = movement[key].x;
			var dy = movement[key].y;
			this.move(dx, dy);
			didAction = true;
		}
		else if (key === "Comma") {
			this.pickUp();
			didAction = true;
		}
		
		if (didAction) {
			Game.drawMap()
			window.removeEventListener("keydown", this);
			Game.actorTurn();
			Game.engine.unlock();
		}
	}
}
