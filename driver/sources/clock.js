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

function Clock(grid, options)
{
  options = options || {};
  Clock.super_.call(this, NAME, grid, options);
  // get our own context
  this.ctx = canvas.getContext('2d');
}

// Set up inheritance from Source
util.inherits(Clock, Source);

function randomI(low, high) {
	return Math.floor((Math.random() * (high + 1 - low)) + low);
}

function getTime(){
	var date = new Date();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	
	minutes = (minutes < 10) ? "0" : "" + minutes;
	
	return hours + ":" + minutes;
}

Clock.prototype.step = function() {
	// get a random color 
	var x = 1;
	var y = 24;
	
	this.ctx.fillStyle = 'rgba(' + this.options.color[0] + ',' + this.options.color[1] + ',' + 
		this.options.color[2] + ',1)';
	this.ctx.clearRect(0,0,60,48);
	this.ctx.font = this.options.font;
	this.ctx.fillText(getTime(), x, y);
	
	this.grid.set(this.ctx.getImageData(0,0,60,48), 'xy', 'false');

	// We changed the grid
  return true;
};

// Return js object containing all params and their types
Clock.options_spec = function() {
	return [
	        {
	            'name': 'color',
	            'type': 'color',
	            'default': [128,255,0]
	        },
	        {
	        	'name': 'font',
	        	'type': 'string',
	        	'default': '12px sans-serif'
	        }	        
	        ].concat(Source.options_spec());
}

// Export public interface
exports.constructor = Clock;
exports.name = NAME;
