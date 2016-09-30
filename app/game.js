/**
 * Created by mlw on 9/19/2016.
 */

var path = require('path');
var util = require('util');
var Source = require('./source');

//Game states

function Game(name, grid, options) {
    Game.super_.call(this, name, grid, options);

    // Soggy Sandwich
    this.state;
    this.state_cache = "";
    this.state_set("idle") //idle, waiting for opponent,

    this.queue = new Array();
    this.triggers = new Array();
    this.countdown_elapsed = 0;
    this.countdown_begin = 0;
    this.timeout = false;
    this.idleTimeout = false;
}

// Set up inheritance from Game
util.inherits(Game, Source);

Game.options_spec = function() {
    return Source.options_spec();
};

Game.prototype.state_is = function(state){
    return (this.state == state);
};

Game.prototype.state_run = function(){
    if(typeof this[this.state] == "function") this[this.state]();
    else console.log("There seems to be an issue with your state, you should look into that.");
};

Game.prototype.state_set = function(state){
    // if we are leaving idle. The disable any idle timeouts

    if (this.state == "idle" && (state != "idle"))
    {
        // stop any idleTimeout

        if (this.idleTimeout)
        {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = false;
        }
    }

    // change state

    this.state = state;
};

// I expect these to be overriden, so these are simple and do nothing

Game.prototype.idle = function(){
    // this should run a demo
};

Game.prototype.waiting = function(){
    // this is the state where you may have one or more players and you are waiting
    // for more to enter the game.
};

Game.prototype.countdown = function(){
    // here we keep track of the number of elapsed seconds since countdown_begin, set it to false before this
    // to start again

    if(!this.countdown_begin)
    {
        this.countdown_begin = new Date();
    }

    this.countdown_elapsed = Math.floor( (new Date() - this.countdown_begin)/1000 );
};

// really to create a game you must overwrite these. See Pong for the first version of this

// States -------------------------------------------------
Game.prototype.playing = function(){
    // this state should run one step of your game
};

Game.prototype.finished = function(){
    // this state is the final state of the game. You should wait here for a little while then
    // move on to idle, which should allow new play of the game
};

Game.prototype.checkQueue = function(){
    // this state should look to see if anyone is waiting to play the game
    // otherwise move on to idle, which should allow new play of the game
    // for now just move to idle

    this.state_set("idle");
};

// Export public interface
module.exports = Game;
