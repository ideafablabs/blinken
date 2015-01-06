var path = require('path');
var util = require('util');
var Source = require('../source');
var Canvas = require('canvas');
var canvas = new Canvas(60,48);

var NAME = path.basename(__filename, '.js'); // Our unique name

// This will put a random color squares or circles up, they will be randomly placed and sized
//
// options should be step time and min and max size.
//

function ColorShapes(grid, options)
{
  options = options || {};
  ColorShapes.super_.call(this, NAME, grid, options);
  // get our own context
  this.ctx = canvas.getContext('2d');
}

// Set up inheritance from Source
util.inherits(ColorShapes, Source);

function randomI(low, high) {
	return Math.floor((Math.random() * (high + 1 - low)) + low);
}

ColorShapes.prototype.step = function() {
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
ColorShapes.options_spec = function() {
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
exports.constructor = ColorShapes;
exports.name = NAME;
