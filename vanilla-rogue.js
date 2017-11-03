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
    map: null,
    engine: null,
    entities: [],
    
    init: function() {
	this.display = new ROT.Display({width:this.width, height:this.height, fontSize:32});
        document.body.appendChild(this.display.getContainer());
        
		this.map = createArray(this.width, this.height);
        this.generateMap();
        
        var scheduler = new ROT.Scheduler.Simple();

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
    },
	
	drawMap: function() {
		//draw tiles
		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				if (this.map[x][y]) {
					var t = this.map[x][y];
					this.display.draw(x, y, t.character, t.fg, t.bg);
				} else {
					this.display.draw(x, y, " ", "#fff", "#000");
				}
			}
		}
		//draw entities
		for (var i = 0; i < this.entities.length; i++) {
			this.entities[i].draw();
		}
	},
	
	addPotion: function(freeCells) {
		var p = new Entity({name:"Cyan Potion", character:"?", fg:"#0ff"});
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
		
		this.x = null;
		this.y = null;
	}
	
	setPosition(x, y) {
		this.x = x;
		this.y = y;
	}
	
	draw() {
		console.log("finna draw a " + this.name + " at " + this.x + "," + this.y);
		if (this.x && this.y) {
			Game.display.draw(this.x, this.y, this.character, this.fg, this.bg);
		}
	}
}
