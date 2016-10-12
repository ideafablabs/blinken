var path = require('path');
var util = require('util');

var Game = require('../game');
//var Source = require('../source');

var NAME = path.basename(__filename, '.js'); // Our unique name

// find a free player and return them or undefined
function findFreePlayer() {
    if (this.player1.socket === undefined)
    {
        return this.player1;
    }
    if (this.player2.socket === undefined) {
        return this.player2;
    }

    return undefined;
}

// Constrain a paddle's position to within the display's border
function constrainPosition(position)
{
    var newPaddlePosY = position;

    if (position - this.paddle.halfHeight < 0)
    {
        newPaddlePosY = this.paddle.halfHeight;
    }
    else if ((position + this.paddle.halfHeight) > this.grid.num_pixels_y)
    {
        newPaddlePosY = this.grid.num_pixels_y - this.paddle.halfHeight;
    }

    return newPaddlePosY;
}

// Update the positions of the paddles:

function updatePaddlePositions()
{
    if (this.player1.socket === undefined) {
        // Update AI's paddle:
        // Follow along with the ball's position:
        if (this.player1.dir === 'DWN') {
            if (this.player1.posY < (this.grid.num_pixels_y - this.paddle.halfHeight)) {
                this.player1.posY += this.player1.velY + .4 * Math.random();
            }
            else {
                // Can't go down any more. Go up
                this.player1.dir = 'UP';
                this.player1.posY -= 1;
            }
        }
        else
        {
            if(this.player1.posY > this.paddle.halfHeight)
            {
                this.player1.posY -= this.player1.velY + .05 * Math.random();
            }
            else {
                // Can't go down any more. Go up
                this.player1.dir = 'DWN';
                this.player1.posY += 1;
            }
        }
    }

    // Move player 2 paddle:

    if (this.player2.socket === undefined) {
        // Update AI's paddle:
        // Follow along with the ball's position:
        if (this.player2.posY < this.ball.posY)
        {
            this.player2.posY += this.enemyVelY;
        }
        else if(this.player2.posY > this.ball.posY)
        {
            this.player2.posY -= this.enemyVelY;
        }
    }

    this.player1.posY = constrainPosition.call(this, this.player1.posY);
    this.player2.posY = constrainPosition.call(this, this.player2.posY);
}

function adjustBallSpeed()
{
    // try to keep the angle from getting 2 steep

    if (Math.abs(this.ball.velY) > (.8 * Math.abs(this.ball.velX))) {
        // this would be too big so reduce it a little

        if (((this.ball.velY > 0) && (this.ball.velX > 0)) ||
            ((this.ball.velY < 0) && (this.ball.velX < 0))) {
            this.ball.velY = this.ball.velX;
        }
        else {
            this.ball.velY = -this.ball.velX;
        }
    }
}

// Move the ball and re-calculate its position:
function moveBall()
{
    this.ball.posY += this.ball.velY;
    this.ball.posX += this.ball.velX;

    // Top and bottom wall collisions
    if (this.ball.posY < this.ball.radius)
    {
        this.ball.posY = this.ball.radius;
        this.ball.velY *= -1.0;
    }
    else if (this.ball.posY > this.grid.num_pixels_y - this.ball.radius)
    {
        this.ball.posY = this.grid.num_pixels_y - this.ball.radius;
        this.ball.velY *= -1.0;
    }

    // Left and right wall collisions
    if (this.ball.posX < this.ball.radius)
    {
        this.ball.posX = this.ball.radius;
        this.ball.velX = this.ball.speedX;
        this.player2.score++;
        this.player2.showScore = 5;
        if(this.player2.socket) this.player2.socket.emit('score');
        if(this.player1.socket) this.player1.socket.emit('miss');

    }
    else if (this.ball.posX > this.grid.num_pixels_x - this.ball.radius)
    {
        this.ball.posX = this.grid.num_pixels_x - this.ball.radius;
        this.ball.velX *= -1.0 * this.ball.speedX;
        this.player1.score++;
        this.player1.showScore = 5;
        if(this.player1.socket) this.player1.socket.emit('score');
        if(this.player2.socket) this.player2.socket.emit('miss');
    }

    // Paddle collisions
    if (this.ball.posX < this.player1.posX + this.ball.radius + this.paddle.halfWidth)
    {
        if (this.ball.posY > this.player1.posY - this.paddle.halfHeight - this.ball.radius &&
            this.ball.posY < this.player1.posY + this.paddle.halfHeight + this.ball.radius)
        {
            this.ball.velX = this.ball.speedX;
            this.ball.velY = 2.0 * (this.ball.posY - this.player1.posY) / this.paddle.halfHeight;
            if(this.player1.socket) this.player1.socket.emit('hit');
        }
        
    }
    else if (this.ball.posX > this.player2.posX - this.ball.radius - this.paddle.halfWidth)
    {
        if (this.ball.posY > this.player2.posY - this.paddle.halfHeight - this.ball.radius &&
            this.ball.posY < this.player2.posY + this.paddle.halfHeight + this.ball.radius)
        {
            this.ball.velX = -1.0 * this.ball.speedX;
            this.ball.velY = 1.5 * (this.ball.posY - this.player2.posY) / this.paddle.halfHeight;
            if(this.player2.socket) this.player2.socket.emit('hit');
        }
    }

    // don't let the X/Y get too steep

    adjustBallSpeed.call(this);

    this.ball.disX = this.ball.posX;
    this.ball.disY = this.ball.posY;
}

// Draw the paddles, ball and score:
function drawGame()
{
    // clear our grid
    this.grid.setGridColor([ 0, 0, 0 ]);

    drawScore.call(this, this.player1.score, this.player2.score);

    if (this.player1.showScore > 0)
    {
        this.player1.showScore--;
        // draw a blue line from 0,1 - 0,48
        this.grid.setColor(this.player1.color);
        this.grid.lineV(59, 1, 47);
    }
    if (this.player2.showScore > 0)
    {
        this.player2.showScore--;
        // draw a blue line from 0,1 - 0,48
        this.grid.setColor(this.player2.color);
        this.grid.lineV(0, 1, 47);
    }
    this.grid.setColor(this.player1.color);
    drawPaddle.call(this, this.player1.posX, this.player1.posY);
    this.grid.setColor(this.player2.color);
    drawPaddle.call(this, this.player2.posX, this.player2.posY);
    this.grid.setColor(this.ball.color);
    drawBall.call(this, Math.round(this.ball.disX), Math.round(this.ball.disY));
}

// Draw the two score integers on the screen
function drawScore(player1, player2)
{
    if( player1) {
        this.grid.setColor(this.player1.color);
        this.grid.lineH(0, 0, player1);
    }

    if( player2) {
        this.grid.setColor(this.player2.color);
        this.grid.lineH(60 - player2, 0, player2);
    }

    this.grid.setColor(this.ball.color);

//  this.grid.setCursor(10, 2);
//  this.grid.print(player1);
//  this.grid.setCursor(50, 2);
//  this.grid.print(player2);
}

// Draw a paddle, given it's x and y coord's
function drawPaddle(x, y)
{
    this.grid.rect(x - this.paddle.halfWidth,
        y - this.paddle.halfHeight,
        this.paddle.width,
        this.paddle.height);
}

// Draw a ball, give it's x and y coords
function drawBall(x, y)
{
//    this.grid.setPixelColor(x, y, this.ball.color);
  this.grid.circleFill(x, y, this.ball.radius);
}

// Check if either player has won.
// Returns:
//  0 - Neither player has won.
//  1 - Player 1 has won
//  2 - Player 2 has won
function checkWin()
{
    if (this.player1.score >= this.options.scoreToWin)
    {
        this.winner = "player1"
        this.loser = "player2"
        return 1;
    }
    else if (this.player2.score >= this.options.scoreToWin)
    {
        this.winner = "player2"
        this.loser = "player1"
        return 2;
    }

    return 0;
}

// Check for which player forfeited
// Returns:
//  0 - Neither player has won.
//  1 - Player 1 has won
//  2 - Player 2 has won
function checkForfeit()
{
    if (this.player1.socket === undefined)
    {
        return 1;
    }
    else if (this.player2.socket === undefined)
    {
        return 2;
    }
}

// Draw the win screen.
// Keep it up for 5 seconds.
// Then go back to the splash screen.
function drawWin(player)
{
    // clear our grid
    this.grid.setGridColor([ 0, 0, 0 ]);

    this.grid.setCursor(8, 2);

    if (player === 1)
    {
        this.grid.setColor(this.player1.color);
        this.grid.print("Player 1");
    }
    else if (player === 2)
    {
        this.grid.setColor(this.player2.color);
        this.grid.print("Player 2");
    }
    this.grid.setCursor(18, 12);
    this.grid.print("Wins!");
    var pong = this;
}

// Draw the win screen.
// Keep it up for 5 seconds.
// Then go back to the splash screen.
function drawForfeit(player)
{
    // clear our grid
    this.grid.setGridColor([ 0, 0, 0 ]);

    this.grid.setCursor(8, 10);

    if (player === 1)
    {
        this.grid.setColor(this.player1.color);
        this.grid.print("Player 1");
    }
    else if (player === 2)
    {
        this.grid.setColor(this.player2.color);
        this.grid.print("Player 2");
    }
    this.grid.setCursor(10, 20);
    this.grid.print("Forfeit!");
    var pong = this;
}

// Draw the countdown
function drawCountdown(player)
{
    // clear our grid
    this.grid.setGridColor([ 0, 0, 0 ]);

    // this.grid.setCursor(8, 2);
    // this.grid.print("Begins in");
    
    this.grid.setCursor(25, 20);
    this.grid.setColor([0,200,0]);
    var tminus = 5-this.countdown_elapsed;
    if(tminus < 1) {
        this.grid.print("Go!");
    }
    else 
    {
//        this.grid.print(tminus);
        this.grid.circle(31,23,tminus);
    }
    
    var pong = this;
}

// Draw the waiting screen
function drawWaiting()
{
    // clear our grid
    this.grid.setGridColor([ 0, 0, 0 ]);

    this.grid.setCursor(8, 20);

    this.grid.setColor(this.player1.color);
    this.grid.print("Play me");
}

//function cleanUp()
//{
//    // clear our grid
//    this.grid.setGridColor([ 0, 0, 0 ]);
//}

function Pong(grid, options) {
    options = options || {};
    Pong.super_.call(this, NAME, grid, options);
    var self = this;
    this.connections = 0;

    this.winner = false;
    this.loser = false;

    io.of('/pong').on('connection', function(socket) {
        console.log(socket.id + " connected to pong");
        self.connections++;  // it seems weisse to keep track

        self.attach(socket);
        // self.emit_state();
        
        socket.on('disconnect', function() {
            console.log(socket.id + " disconnected from pong");
            self.detach(socket);
            self.connections--;  // it seems weisse to keep track
        });

        socket.on('attach', function() {
            self.attach(socket);
        });

        socket.on('detach', function() {
            self.detach(socket);
        });

        socket.on('pos', function(position) {
            if (socket.player !== undefined) {
                socket.player.posY = constrainPosition.call(self, parseFloat(position));
//                console.log("pos " + position + " for player " + socket.player.id + " constrained " + socket.player.posY);
            }
        });
    });

    // Pong Variables: some of these we will fill in right after this, It seemed easier

    this.paddle = {
        width: 0.0,
        height:  0.0,
        halfWidth: 0.0,
        halfHeight: 0.0
    };

    this.player1 = {
        score: 0,
        posX: 0.0,
        posY: 0.0,
        velY: this.options.velY1,
        dir: 'DWN',
        showScore: 0,
        color: [255, 0, 0],
        id: 1
    };

    this.player2 = {
        score: 0,
        posX: 0.0,
        posY: 0.0,
        velY:  this.options.velY2,
        dir: 'BALL',
        showScore: 0,
        color: [0, 0, 255],
        id: 2
    };

    this.enemyVelY = 0.5;

    this.ball = {
        radius: 1,
        speedX: 0.45,
        posX: 0.0,
        posY: 0.0,
        velX: 0.0,
        velY: 0,
        color: [200, 200, 0]
    };

    // setup initial pong game

    this.stepCnt = 0;

    // these probably never change
    this.paddles();
    this.reset();

/*    this.grid.setCursor(12, 5);
    this.grid.print("Press A");
    this.grid.setCursor(0, 13);
    this.grid.print("for single");
    this.grid.setCursor(12, 30);
    this.grid.print("Press B");
    this.grid.setCursor(4, 38);
    this.grid.print("for multi");*/
}

// Set up inheritance from Game which is a source
util.inherits(Pong, Game);

//var timeGameOver = 0;

Pong.prototype.step = function() {


    // Ever seen a realllllllly ugly if? Well, you're about to. Seriously, don't change the order. 
    //It's done like this to limit spaghetti code, without this pattern, state setting and running occurs all over the place, and is difficult to change.
                                                                            
    //This is where it loops around, so we need allow "finished" to complete.

    if( this.total_attached() == 0 && (this.state_is("finished") || !(this.state_is("idle") || this.state_is("checkQueue"))) )
    {
        this.reset();
        this.state_set("checkQueue");
    }

    //Only one player is attached
    else if( this.total_attached() == 1 && !this.state_is("playing") && !this.state_is("forfeit") )
    {                                     
        this.state_set("waiting");
        this.resetScores();
    }
    
    //A player left in the middle of the game.
    else if( !this.state_is("forfeit") && (this.state_is("playing") && this.total_attached() == 1) )
    {
        this.state_set("forfeit");
    }

    //They were waiting, but no longer
    else if( this.state_is("waiting") && this.total_attached() == 2 )   
    {      
        this.state_set("countdown"); 
    }

    //Time to move on to the game :)
    else if( this.state_is("countdown") && this.countdown_elapsed > 5)
    {
        this.countdown_elapsed = 0;
        this.countdown_begin = 0;
        this.state_set("playing");
    }
    // else if(this.state_is("playing") && !checkWin.call(this))
    // {
    //     this.countdown_elapsed = 0;
    //     this.countdown_begin = 0;
    //     this.state_set("playing");
    // }
    //Someone just won.
    else if( this.state_is("playing") && checkWin.call(this) )    
    {          
        this.state_set("finished");
    }

    //Finished state will remove attached players after some time, triggering idle.
    // I think the very first if will see this not here
    else if( this.state_is("finished") && this.total_attached() == 0) {
        this.state_set("idle");
        this.reset();
    }

    // if we are in idle mode we will run the demo. I think the demo should run it's own state machine
    // so that at any point is someone connects we can just abandon the demo state and go to waiting

    // if the demo was running, someone just won. so let the screen display
//    else if( this.state_is("idle") && checkWin.call(this) )
//    {
//        this.state_set("finished");
//    }

    //Only emit state once. 
    if( this.state != this.state_cache ) {
        this.emit_state();
        this.state_cache = this.state;
        console.log("changed state", this.state);
    }

    this.state_run(); // this is where we run the game and

    return true;
};

Pong.prototype.total_attached = function(){
    total = 0;
    if(this.player1.socket !== undefined) total++;
    if(this.player2.socket !== undefined) total++;
    return total;
}

//Pong states

Pong.prototype.idle = function(){
    // this is going to run the demo

    if (!this.idleTimeout) {
        updatePaddlePositions.call(this);
        moveBall.call(this);
        drawGame.call(this);

        if (checkWin.call(this) != 0) {
            drawWin.call(this, checkWin.call(this));
            var self = this;
            this.idleTimeout = setTimeout(function(){
                self.reset(self);
                self.idleTimeout = false;
            }, 5000);

        }
    }
//    this.resetScores(); //Hack for  glitch
}

Pong.prototype.waiting = function(){
    drawWaiting.call(this);
    // this.state_set("waiting");
}

Pong.prototype.countdown = function(){

//    this.resetScores();
    Pong.super_.prototype.countdown.apply(this);
    drawCountdown.call(this);
}


Pong.prototype.emit_state = function(){
    if(this.state == "idle") {
       io.of('/pong').emit("state", this.state);
    }
    else 
    {
        if(this.player1.socket) {
            this.player1.socket.emit("state", this.state);
        }
        if(this.player2.socket) {
            this.player2.socket.emit("state", this.state);
        }
    }
}


// States -------------------------------------------------
Pong.prototype.playing = function(){
    updatePaddlePositions.call(this);
    moveBall.call(this);
    drawGame.call(this);
}

Pong.prototype.finished = function(){
    drawWin.call(this, checkWin.call(this));
    if(!this.timeout) {
        if(this[this.winner].socket !== undefined) {
            this[this.winner].socket.emit('won');
        }
        if(this[this.loser].socket !== undefined) {
            this[this.loser].socket.emit('lost');
        }
        var self = this;
        this.timeout = setTimeout(function(){
            self.detachAll(); // This will reset state to IDLE or ... Grab from Queue?
            self.timeout = false;
        }, 10000);
    }  
}

Pong.prototype.forfeit = function(){
    var forfeiter = checkForfeit.call(this);
    var winner = forfeiter == 1 ? 2 : 1;
    // this["player"+forfeiter].socket.emit('lost');
    if(!this.timeout) {
        this["player"+winner].socket.emit('won');
        drawForfeit.call(this, forfeiter);
        var self = this;
        this.timeout = setTimeout(function(){
            drawWin.call(self, winner);
            self.timeout = setTimeout(function(){
                self.detachAll(); // This will reset state to IDLE or ... Grab from Queue?
                self.timeout = false;
            }, 3000);
        }, 5000);
    }  
}

Pong.prototype.reset = function(){
    console.log('Grid', "Reset");

    // these should be set to this when we reset the game
    this.player1.posX = 1.0 + this.paddle.halfWidth;
    this.player2.posX = this.grid.num_pixels_x - 1.0 - this.paddle.halfWidth;
    this.ball.velX = -1.0 * this.ball.speedX;
    this.ball.posX = this.grid.num_pixels_x  / 2.0;
    this.ball.posY = this.grid.num_pixels_y / 2.0;
    this.enemyVelY = 0.3;

    this.resetScores();

    // clear our grid
    this.grid.setGridColor([ 0, 0, 0 ]);
}

Pong.prototype.resetScores = function(){
    //Reset scores
    this.player1.score = 0;
    this.player2.score = 0;
    //Reset winners/losers.
    this.winner = false;
    this.loser = false;
}

Pong.prototype.attach = function(socket){
    console.log("got an attach");
    // so we should attach this socket to a player
    socket.player = findFreePlayer.call(this);
    console.log("attached now", this.total_attached());
    if (socket.player !== undefined && !this.state_is("forfeit") && !this.state_is("finished")) {
        socket.player.socket = socket;
        console.log("attached to player " + socket.player.id);
        socket.emit('player',
            {
                id: socket.player.id,
                color: socket.player.color,
                height: this.paddle.height
            });
        socket.emit('state', this.state);
        // this.emit_state();
    } else {
        console.log("cannot attach to player");
        socket.emit('errorMsg', {text: 'No Player Available'});
        socket.emit('state', "busy");
    //              socketError(socket, 'No Snake Available');
    }
}

Pong.prototype.detach = function(socket){
    if (socket.player !== undefined){
        console.log('player ' + socket.player.id + ' detached from');
        socket.player.socket = undefined;
        socket.player = undefined;
    }
}

Pong.prototype.detachAll = function(){
    if(this.player1.socket) {
        this.detach(this.player1.socket);
    }
    if(this.player2.socket) {
        this.detach(this.player2.socket);
    }
}

Pong.prototype.paddles = function(){
    this.paddle.width = 1;
    this.paddle.height =  this.grid.num_pixels_y / 4.0;
    this.paddle.halfWidth = this.paddle.width / 2.0;
    this.paddle.halfHeight = this.paddle.height / 2.0;
}

// Return js object containing all params and their types
Pong.options_spec = function() {
    return [ {
        'name' : 'scoreToWin',
        'type' : 'integer',
        'default' : 6
    }, {
        'name' : 'playMode',
        'type' : 'string',
        'default' : 'Auto'
    }, {
        'name' : 'velY1',
        'type' : 'float',
        'default' : 3
    }, {
        'name' : 'velY2',
        'type' : 'float',
        'default' : 0.5
    }


    ].concat(Game.options_spec());
};

// var Queue = function(){
//     this.queue = new Array();
// }
// Queue.prototype.add function(){}
// Queue.prototype.check function(){ 
//     var next = this.queue[0];
//     this.queue.unshift();
//     return next;
// }
// Queue.prototype.remove function(){}

// Export public interface
exports.constructor = Pong;
exports.name = NAME;
