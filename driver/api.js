//**************************************
//
//                Setup
//
//**************************************
var util = require('util');

// Setup grid
var Grid = require('./grid');
var grid = new Grid();



// Setup mixer and set rendering loop in motion
var Mixer = require('./mixer');
var mixer = new Mixer(grid);
mixer.run();

// Get source registry (this loads sources themselves as well)
var sources = require('./source_registry');

var api = new Object();

//**************************************
//
//              Errors
//
//**************************************

function errorResponse(code, description) {
  return {
    'error': {
      'code': code,
      'desc': description
    }
  };
}


//**************************************
//
//              Sources
//
//**************************************

api.source =  {
  // GET /sources
  list: function() {
    return sources.toJson();
  }
};

//**************************************
//
//              Layers
//
//**************************************

api.layer = new Object();

api.layer.list = function() {
    return mixer.toJson();
};

// POST /layers
// expects request body to contain the following:
// source[name]
// source[options][...]
api.layer.create = function(layer_name, source_name, source_options) {

  // Lookup source
  var source = sources.find(source_name);
  if (source == null) return { error : util.format("ERROR: source not found: '%s'", source_name) };

  // Add layer and return its json representation
  var layer = mixer.add_layer(layer_name, new source(grid, source_options));
  return layer.toJson();

};

// GET /layers/:id
api.layer.get = function(layer_id) {
  // Look up layer
  var layer = mixer.find_layer(layer_id);
  if (layer == null) return { error : util.format("ERROR: layer 'id' not found: '%d'", request.params.id) };
  // Return json representation
  return layer.toJson();
};

// PUT /layers/:id
api.layer.update = function(layer_id, layer_options) {
  // Look up layer
  var layer = mixer.find_layer(layer_id);
  if (layer == null) return { error : util.format("ERROR: layer not found: '%d'", layer_id) };

  // Update layer
  layer.update(layer_options);
  return true;

};

  // DELETE /layers/:id
api.layer.destroy = function(layer_id) {

  mixer.remove_layer(layer_id);
  return layer_id;

}

//**************************************
//
//              Grid
//
//**************************************

api.grid = new Object();
  
// GET /grid
api.grid.get = function(request, response) {
  return grid.toJson();
};
  
// GET /grid/:x/:y 
api.grid.getxy = function(x, y) {
  var color = grid.getPixelColor(x, y);
  if(!color) color = [33,x,y];
  return color.toJson();
}

api.grid.set = function(color_grid, mode, strict){
  grid.set(color_grid, mode, strict);
}

//***************************************************************
//
//                Register handlers
//
//***************************************************************

// Register socket handlers. Called from server.js once sockets
// are up and running.
exports.registerSocketHandlers = function() {

  io.on('connection', function (socket) {

    console.log('User connected.');

    socket.on('disconnect', function(){
      console.log('User disconnected');
    });

    io.emit("Successfully connected to LED Ceiling via websocket, Welcome!");

    // Sources
    socket.on('list sources', function(){ var result = api.source.list(); socket.emit('refresh sources', result) });
    // socket.on('add remote source', websocket.source.addRemoteSource);

    // Layer
    socket.on('list layers', function(){ var result = api.layer.list(); socket.emit('refresh layers', result) });
    socket.on('create layer', function(layer_name, source_name, source_options){ 
      var result = api.layer.create(layer_name, source_name, source_options); 
      return (!result.error) ? socket.emit('layer created', result) : socket.emit('error', result.error );
      socket.broadcast.emit('mixer update', { details : 'layer '+result.id+' created' });
    });
    socket.on('update layer', function(layer_id, layer_options) { 
      var result = api.layer.update(layer_id, layer_options); 
      return (!result.error) ? socket.emit('layer updated', result ) : socket.emit('error', result.error );
      socket.broadcast.emit('mixer update', { details : 'layer '+result.id+' updated' });
    });
    socket.on('destroy layer', function(layer_id) { 
      var result = api.layer.destroy(layer_id);
      return (!result.error) ? socket.emit('layer destroyed', result ) : socket.emit('error', result.error );
      socket.broadcast.emit('mixer update', { details : 'layer '+result.id+'destroyed' });
    });
    socket.on('get layer', function(layer_name) { 
      var result = api.layer.get(layer_name); 
      return (!result.error) ? socket.emit('layer result', result ) : socket.emit('error', result.error );
    });
    // socket.on('layer:destroyAll'), websocket.layer.destroyAll();

    //Grid
    socket.on('set grid', function(color_grid, mode, strict){ return api.grid.set(color_grid, mode, strict); } );
    socket.on('get grid', function(){ return api.grid.get(); } );
    socket.on('get xy', function(x, y){ return api.grid.getxy(x, y); });

    socket.on("update led", function(data) {
      // Validate input values
      var x = parseInt(data.x);
      var y = parseInt(data.y);
      var r = parseInt(data.rgb[0]);
      var g = parseInt(data.rgb[1]);
      var b = parseInt(data.rgb[2]);
      r = r < 0 ? 0 : (r > 255 ? 255 : r);
      g = g < 0 ? 0 : (g > 255 ? 255 : g);
      b = b < 0 ? 0 : (b > 255 ? 255 : b);

      // Change the pixel color
      grid.setPixelColor(x, y, rgb);
      grid.sync();

      // Broadcast change to all other clients
      socket.broadcast.emit("changed:led", { x: x, y: y, rgb: rgb }); 
    });


   socket.on("off", function(data) {
      mixer.clear_layers();
      grid.off();
      io.emit("update", grid.toJson());
    });

  });

};

// Register http handlers. Called from server.js once http
// server is up and running.
exports.registerHttpHandlers = function(app) {

//**************************************
//
//              REST Handler
//
//**************************************

var restful = { grid : {}, layer : {}, source : {} }

restful.layer.list = function(request, response){  
  var result = api.layer.list();
  request.jsonp(result);
}

restful.layer.create = function(request, response){  

  var layer_name = request.body.name;
  var source_name = request.body.source.name;
  var source_options = request.body.source.options;

  var result = api.layer.create(layer_name, source_name, source_options);

  if(!result.error)  response.status(201).jsonp(result);
  else response.status(400).jsonp(errorResponse(400, result.error));

};

restful.layer.update = function(request, response){
  
  var layer_id = request.params.id;
  var layer_options = request.body;

  var result = api.layer.update(layer_id, layer_options);

  if(!result.error) response.send(204);
  else response.status(404).jsonp(errorResponse(404, result.error));

};


restful.layer.get = function(request, response){

  var result = api.layer.get(request.params.id);
  if(!result.error) response.status(201).jsonp(result);
  else jsonp(errorResponse(404, result.error));

};

restful.layer.destroy = function(request, response){

  var layer_id = request.params.id;
  api.layer.destroy(layer_id);
  response.send(204);

};

restful.grid.get = function(request, response){

  var result = api.grid.get();
  response.jsonp(result);

}

restful.grid.getxy = function(request, response){

  var x = request.params.x;
  var y = request.params.y;
  var result = api.grid.getxy(x, y);
  response.jsonp(result);

}

restful.source.list = function(request, response){
  var result = api.source.list();
  response.jsonp(result);
}
module.exports = restful;

  // Sources
  app.get('/sources', api.source.list);

  // Layers
  app.get('/mixer/layers', api.layer.list);
  app.post('/mixer/layers', api.layer.create);
  app.get('/mixer/layers/:id', api.layer.get);
  app.put('/mixer/layers/:id', api.layer.update);
  app.delete('/mixer/layers/:id', api.layer.destroy);

  // Grid
  app.get('/output', api.grid.get);
  app.get('/output/:x/:y', api.grid.getxy);

  // TODO: HACK FOR DEMO, REMOVE ME
  // app.get('/attendance', get_attendance);

};
