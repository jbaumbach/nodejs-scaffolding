
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , stylus = require('stylus')
  , nib = require('nib')  // Added
  , redisStore = require('connect-redis')(express)  // Added, use "[reddis src]$ ./redis-server --loglevel verbose" to start it
  ;

var app = express();

//
// Added compile function for Nib (vendor-prefix library)
//
function compile(str, path) {
  return stylus(str)
      .set('filename', path)
      .set('compress', true)
      .use(nib());
}

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your cookie secret here'));
  
  //
  // Added redis support in sessions.  
  //
  app.use(express.session({ store:new redisStore, secret: 'your session secret here'}));
  
  app.use(app.router);
  
  //
  // Updated to add "compile" callback, required for Nib
  //
  app.use(stylus.middleware({
    src: __dirname + '/public'
    , compile: compile
  }));
  
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

//
// Routing table for your app
//
app.get('/', routes.index);
app.get('/login', user.loginForm);
app.post('/login', user.login);
app.get('/logout', user.logout);
app.get('/users/new', user.new);
app.get('/users/:id', user.detail);
app.post('/users/', user.upsert);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

exports.app = function() {
  return app;
}