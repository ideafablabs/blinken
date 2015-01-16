var path = require('path');
var util = require('util');
var Source = require('../source');

var NAME = path.basename(__filename, '.js'); // Our unique name

// This will play a game of snake
//
// options should be step time and min and max size.
//

var Snake = {
		body: [],
		direction: 'Forward',
		color: [128, 128, 128]
}

function Snakes(grid, options)
{
  options = options || {};
  Snakes.super_.call(this, NAME, grid, options);

  this.body = [];
  var segment = {
		  x: 20,
		  y: 20,
		  food: 0,
		  direction: 0, // 0 - forward, 1 - left, 2 - right
  };
  
  // make the work 3 segments long
  this.body.push(segment);
  segment.x++;
  this.body.push(segment);
  segment.x++;
  this.body.push(segment);

  this.map = []; // this is 60 * 48
}

// Set up inheritance from Source
util.inherits(Snakes, Source);

function randomI(low, high) {
	return Math.floor((Math.random() * (high + 1 - low)) + low);
}

Snakes.prototype.step = function() {
	// get a random color 
	var color = [];
	var width = randomI(this.options.min_width, this.options.max_width);
	var height = randomI(this.options.min_height, this.options.max_height);
	var x = randomI(0, 60 - width);
	var y = randomI(0, 48 - height);
	var shape;
	
	this.ctx.fillStyle = 'rgba(' + randomI(0, 255) + ',' + randomI(0, 255) + ',' + 
		randomI(0, 255) + ',1)';
	if(this.options.shape === 'random'){
		if(randomI(0,1) === 1){
			shape = 'circle';
		} else {
			shape = 'rectangle';
		}
	} else {
		shape = this.options.shape;
	}
	if(shape === 'rectangle'){
		this.ctx.fillRect(x, y, width, height);
	} else if (shape === 'circle'){
		this.ctx.beginPath();
		this.ctx.arc(x, y, width / 2, 0, 2 * Math.PI, 'false');
		this.ctx.fill();
	}
	
	this.grid.set(this.ctx.getImageData(0,0,60,48), 'xy', 'false');

	// We changed the grid
  return true;
};

// Return js object containing all params and their types
Snakes.options_spec = function() {
	return [
	        {
	        	'name': 'min_width',
	        	'type': 'integer',
	        	'default': 2
	        },
	        {
	        	'name': 'max_width',
	        	'type': 'integer',
	        	'default': 10
	        },
	        {
	        	'name': 'min_height',
	        	'type': 'integer',
	        	'default': 2
	        },
	        {
	        	'name': 'max_height',
	        	'type': 'integer',
	        	'default': 10
	        },
	        {
	            'name': 'shape',
	            'type': 'select',
	            'default': 'random',
	            'choices': ['circle', 'rectangle', 'random']
	          }

	        ].concat(Source.options_spec());
}

// Export public interface
exports.constructor = Snakes;
exports.name = NAME;
