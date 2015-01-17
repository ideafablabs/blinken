var path = require('path');
var util = require('util');
var Source = require('../source');

var NAME = path.basename(__filename, '.js'); // Our unique name

// This will play a game of snake
//
// options should be step time and min and max size.
//
function randomI(low, high) {
	return Math.floor((Math.random() * (high + 1 - low)) + low);
}

function randomXY()
{
	var xy = {
			x: randomI(0,60),
			y: randomI(0,48)
	};
	
	return xy;
}

function generateFood(map)
{
	var xy;
	
	while(1)
	{
		xy = randomXY();
		
		var index = (xy.y * 60) + xy.x;
		
		if( typeof map[index] === 'undefined' ||
			map[index] == 'empty' )
		{
			// we can place the food here
			
			map[(xy.y * 60) + xy.x] = 'food';
			return xy;
		}
	}
};

function DrawSnake(){
	var self = this;
	  this.body.forEach(function(element){
		  self.map[(element.y * 60) + element.x] = 'S';
	  })
};

function Snakes(grid, options) {
	options = options || {};
	Snakes.super_.call(this, NAME, grid, options);

	this.count = 0;
	this.body = [];

	this.drawSnake = DrawSnake;

	this.unDrawSnake = function() {
		var self = this;
		this.body.forEach(function(element) {
			self.map[(element.y * 60) + element.x] = 'empty';
		})
	};

	this.moveSnake = function() {
		var curDir;
		var x = 0;
		var y = 0;

		// erase the snake first

		this.unDrawSnake();

		// now look to see if there is food, (grow) and move all segments except
		// the head

		for (var i = (this.body.length - 1); i >= 0; i--) {
			// is there food at the end

			if (this.body[i].food) {
				if (i === (this.body.length - 1)) {
					// grow by one segment

					var seg = this.body[i];
					this.body.push(seg);
				}
			}

			if (i != 0) {
				this.body[i].food = this.body[i - 1].food;
				this.body[i].x = this.body[i - 1].x;
				this.body[i].y = this.body[i - 1].y;
			} else {
				// what is the current direction
				if (this.body[0].x === this.body[1].x) {
					// we must be moving up or down

					if (this.body[0].y > this.body[1].y) {
						// we are heading down
						x = 1;
					} else {
						x = -1;
					}
				} else {
					// we must be moving screen left or screen right

					if (this.body[0].x > this.body[1].x) {
						y = 1;
					} else {
						y = -1;
					}
				}
			}
		}

		// now that we know the screen direction the snake is moving, see where
		// we want to go.
//		console.log("Body 0 direction: " + this.body[0].direction);
		if (this.body[0].direction === 1) {
			// we want to turn right
			console.log("Turning Right X: " + x + " Y: " + y);
			if (x === 0) {
				x = -y;
				y = 0;
			} else {
				y = x;
				x = 0;
			}
		} else if (this.body[0].direction === 2) {
			// we want to turn left
			console.log("Turning Left X: " + x + " Y: " + y);
			if (x === 0) {
				x = y;
				y = 0;
			} else {
				y = -x;
				x = 0;
			}
		}

		console.log("x: " + x + " y: " + y);
		
		// after we change direction, go forward

		this.body[0].direction = 0;

		// actually move the head

		this.body[0].x += x;
		if (this.body[0].x > 60) {
			this.body.x = 0;
		} else if (this.body[0].x < 0) {
			this.body.x = 59;
		}

		this.body[0].y += y;
		if (this.body[0].y > 48) {
			this.body.y = 0;
		} else if (this.body[0].y < 0) {
			this.body.x = 47;
		}

		// redraw in the map

		this.drawSnake();
	};

	for (var i = 0; i < 3; i++) {
		var segment = new Object();

		segment = {
			x : 20 + i,
			y : 20,
			food : 0,
			direction : 0, // 0 - forward, 1 - left, 2 - right
		};

		this.body.push(segment);
	};

	this.map = []; // this is 60 * 48
	this.drawSnake();
	generateFood(this.map); // place a piece of food
};

// Set up inheritance from Source
  util.inherits(Snakes, Source);

  function randomI(low, high) {
	  return Math.floor((Math.random() * (high + 1 - low)) + low);
  }

Snakes.prototype.step = function() {
	// get a random color
	
	var self = this;

	this.count++;
	if( this.count > 40 ){
		this.count = 0;
	}
	
	if(this.count === 0){
		console.log("count = " + this.count + " Setting direction this:" + this);
		this.body[0].direction = 2;
	};
	
	this.moveSnake();

	// clear our grid
	this.grid.setGridColor([0,0,0]);
	
	this.map.forEach(function(element, index){
		if( element == 'food' ){
			self.grid.setPixelColor(index % 60, Math.floor(index / 60) , [0,255,0]);
//			console.log("drawing food at X:" + index % 60 + " Y: " + Math.floor(index / 60));
		} else if( element == 'S'){
			self.grid.setPixelColor(index % 60, Math.floor(index / 60), self.options.color);
//			console.log("drawing S:" + " at X: " + index % 60 + " Y: " + Math.floor(index / 60));
		}
	});
	// We changed the grid
	return true;
};

// Return js object containing all params and their types
Snakes.options_spec = function() {
	return [
	        {
	            'name': 'color',
	            'type': 'color',
	            'default': [255,0,0]
	          }
	        ].concat(Source.options_spec());
}

// Export public interface
exports.constructor = Snakes;
exports.name = NAME;
