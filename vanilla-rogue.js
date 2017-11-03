function createArray(length) { //this function by Matthew Crumley
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

var Game = {
    display: null,
	width: 50,
	height: 30,
    map: null,
    engine: null,
    player: null,
    
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
    },
	
	drawMap: function() {
		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				//alert(this.map[x][y]);
				if (this.map[x][y]) {
					var t = this.map[x][y];
					this.display.draw(x, y, t.character, t.fg, t.bg);
				} else {
					this.display.draw(x, y, " ", "#fff", "#000");
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
	}
}
