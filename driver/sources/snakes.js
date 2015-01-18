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

function getOffset(direction){
	var offset = {
			x: 0,
			y: 0
	};
	
	switch(direction){
	case "UP":
		offset.y = -1;
		break;
	case "DOWN":
		offset.y = 1;
		break;
	case "LEFT":
		offset.x = -1;
		break;
	case "RIGHT":
		offset.x = -1;
		break;
	}
	
	return(offset);
}

function GenerateFood()
{
	var xy;
	
	while(1)
	{
		xy = randomXY();
		
		var index = (xy.y * this.grid.num_pixels_x) + xy.x;
		
		if( typeof this.map[index] === 'undefined' ||
			this.map[index] == 'empty' )
		{
			// we can place the food here
			
			this.map[index] = 'food';
			return xy;
		}
	}
};

function DrawSnake(parent){
//	console.log("Draw snake this = " + util.inspect(this, false, null));

	var self = this;
	  this.body.forEach(function(element){
		  parent.map[(element.y * parent.grid.num_pixels_x) + element.x] = self.id;
	  })
};

function CheckCollision(){
	var loop;
	
	for(loop = 0; loop < this.snakes.length; loop++){
		var chSnake = this.snakes[loop];

		if( chSnake.state !== 'ALIVE'){
			continue;
		}
		
		// check each head
		for(var innerLoop = 0; innerLoop < this.snakes.length; innerLoop++){
			var inSnake = this.snakes[innerLoop];
			
			if( inSnake.state !== 'ALIVE'){
				continue;
			}

			// we don't check the head on ourself
			for(var seg = (innerLoop == loop) ? 1 : 0; seg < inSnake.body.length ; seg++){
				if((chSnake.body[0].x === inSnake.body[seg].x) && 
						(chSnake.body[0].y === inSnake.body[seg].y)){
					// we have collided, we are dead
					chSnake.state = 'DEAD';
					chSnake.color[0] /= 3;
					chSnake.color[1] /= 3;
					chSnake.color[2] /= 3;
					break;
				}
			}
			
			if(chSnake.state === 'DEAD'){
				break;
			}
		}
	}
};

function MoveSnake(parent) {
	var curDir;
	var x = 0;
	var y = 0;

	// erase the snake first

	this.unDrawSnake();

	// now look to see if there is food, (grow) and move all segments except
	// the head

	if (this.turn == "RIGHT"){
		switch(this.direction){
			case "UP":
				this.direction = "RIGHT";
				break;
			case "DOWN":
				this.direction = "LEFT";
				break;
			case "RIGHT":
				this.direction = "DOWN";
				break;
			case "LEFT":
				this.direction = "UP";
				break;
		}
	} else if (this.turn == "LEFT"){
		switch(this.direction){
		case "UP":
			this.direction = "LEFT";
			break;
		case "DOWN":
			this.direction = "RIGHT";
			break;
		case "RIGHT":
			this.direction = "UP";
			break;
		case "LEFT":
			this.direction = "DOWN";
			break;
		}
	}

	this.turn = "NONE";
	
	offset = getOffset(this.direction);
	
	for (var i = (this.body.length - 1); i > 0; i--) {
		// is there food at the end

		if (this.body[i].food === 1) {
			if (i === (this.body.length - 1)) {
				// grow by one segment

				var seg = new Object();
				seg.x = this.body[i].x;
				seg.y = this.body[i].y;
				
				this.body.push(seg);
			}
		}

		this.body[i].food = this.body[i - 1].food;
		this.body[i].x = this.body[i - 1].x;
		this.body[i].y = this.body[i - 1].y;
	}

	// actually move the head
	 
	this.body[0].x += offset.x;
	this.body[0].y += offset.y;

	// wrap any pieces that went off screen
	
	if (this.body[0].x > parent.grid.num_pixels_x) {
		this.body[0].x = 0;
	} else if (this.body[0].x < 0) {
		this.body[0].x = parent.grid.num_pixels_x - 1;
	}

	if (this.body[0].y > parent.grid.num_pixels_y) {
		this.body[0].y = 0;
	} else if (this.body[0].y < 0) {
		this.body[0].y = parent.grid.num_pixels_y - 1;
	}

	// see if we ate the food
	
	var index = this.body[0].y * parent.grid.num_pixels_x + this.body[0].x;
	
	if (parent.map[index] === 'food'){
		this.body[0].food = 1;
		parent.generateFood();
	} else {
		this.body[0].food = 0;
	}
};

function snake(numSegments, color, start, direction, id)
{
	var parent = this;
	
	var ssss = {
			body: [],
			drawSnake: DrawSnake,
			moveSnake: MoveSnake,
			unDrawSnake: function() {
				var self = this;
				this.body.forEach(function(element) {
					parent.map[(element.y * parent.grid.num_pixels_x) + element.x] = 'empty';
				});
			},

			printSnake: function(text){
				console.log(text);
				this.body.forEach(function(element, index){
					console.log("Snake[" + index + "].x = " + element.x + " .y = " + element.y);
				});
			},

			direction: direction,
			turn: "NONE",
			color: color,
			state: "ALIVE",
			id: id
	};

	// create the initial snake
	// get the offsets given the direction
	
	offset = getOffset(direction);

	// to first place the snake we need these inverted

	offset.x = -offset.x;
	offset.y = -offset.y;

	for (var i = 0; i < numSegments; i++) {
		var segment = new Object();

		segment = {
				x : start.x + offset.x,
				y : start.y + offset.y,
				food : 0
		};

		ssss.body.push(segment);
	};

	ssss.drawSnake(this);

	return ssss;
}

function Snakes(grid, options) {
	options = options || {};
	Snakes.super_.call(this, NAME, grid, options);

	this.count = 0;
	this.mode = "DEMO";
	this.generateFood = GenerateFood,
	this.checkCollision = CheckCollision;
	this.snakes = []; // we may have a few snakes
	this.map = []; // this is grid.num_pixels_x * this.grid.num_pixels_y

	// generate snakes
	var loop;
	
	for(loop = 0; loop < this.options.numSnakes ; loop++){
		var xy = { x: this.options['startx'+loop], y: this.options['starty'+loop] };
		
		this.snakes.push(snake.call(this, this.options['numSegments'+loop],
					this.options['color'+loop], xy,
					this.options['direction'+loop], loop));
	}
	
	// generate food
	
	for(loop = 0 ; loop < this.options.amountFood ; loop++){
		this.generateFood(); // place a piece of food
	}
};

// Set up inheritance from Source
  util.inherits(Snakes, Source);

  function randomI(low, high) {
	  return Math.floor((Math.random() * (high + 1 - low)) + low);
  }

Snakes.prototype.step = function() {
	// get a random color
	
	var self = this;

	// see if we want the snakes to turn
	
	for(var loop = 0 ; loop < this.snakes.length ; loop++){
		switch(randomI(0,15)){
			case 0:
				this.snakes[loop].turn = 'RIGHT';
				break;
			case 1:
				this.snakes[loop].turn = 'LEFT';
				break;
		}
	}
	
	// move all the snakes
	
	for(var loop = 0 ; loop < this.snakes.length ; loop++){
		if(this.snakes[loop].state === 'ALIVE'){
			this.snakes[loop].moveSnake(this);
		}
	}
	
	// check to see if anything collided
	
	this.checkCollision();
	
	// redraw in the map
	for(var loop = 0 ; loop < this.snakes.length ; loop++){
		this.snakes[loop].drawSnake(this);
	}
	
	// clear our grid
	this.grid.setGridColor([0,0,0]);
	
	var self = this;

	// actually write to the grid
	
	this.map.forEach(function(element, index){
		var width = self.grid.num_pixels_x;
		if( element == 'food' ){
			self.grid.setPixelColor(index % width, Math.floor(index / width) , self.options.foodColor);
		} else if( element >= 0 && element < self.snakes.length){
			self.grid.setPixelColor(index % width, Math.floor(index / width ),
						self.snakes[element].color);
//			console.log("drawing S" + element + ": at X: " + index % width + " Y: " + Math.floor(index / width));
		}
	});
	// We changed the grid
	return true;
};

// Return js object containing all params and their types
Snakes.options_spec = function() {
	return [ {
		'name' : 'foodColor',
		'type' : 'color',
		'default' : [ 0, 255, 0 ]
	},  {
		'name' : 'amountFood',
		'type' : 'integer',
		'default' : 30
	},  {
		'name' : 'numSnakes',
		'type' : 'integer',
		'default' : 2
	},  {
		'name' : 'numSegments0',
		'type' : 'integer',
		'default' : 3
	}, {
		'name' : 'color0',
		'type' : 'color',
		'default' : [ 255, 0, 0 ]
	}, {
		'name' : 'startx0',
		'type' : 'integer',
		'default' : 20
	}, {
		'name' : 'starty0',
		'type' : 'integer',
		'default' : 20
	}, {
		'name' : 'direction0',
		'type' : 'string',
		'default' : 'UP'
	},  {
		'name' : 'numSegments1',
		'type' : 'integer',
		'default' : 3
	}, {
		'name' : 'color1',
		'type' : 'color',
		'default' : [ 0, 0, 255 ]
	}, {
		'name' : 'startx1',
		'type' : 'integer',
		'default' : 35
	}, {
		'name' : 'starty1',
		'type' : 'integer',
		'default' : 5
	}, {
		'name' : 'direction1',
		'type' : 'string',
		'default' : 'RIGHT'
	}

	].concat(Source.options_spec());
}

// Export public interface
exports.constructor = Snakes;
exports.name = NAME;
