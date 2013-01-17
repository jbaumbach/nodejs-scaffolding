/*

  The one and only app.js file.

  As your app grows, parts of this would probably be split out into separate files for 
  easier long-term maintenance.
  
  To start the server from a terminal:

    $ node app.js

  To run unit tests from a terminal:

    $ mocha --recursive

  In the open source world, new updates are released often.  To list your versions:
  
    $ npm list
  
  To install/update components (all the dependencies in package.json):
  
    $ npm update
    
  Be sure to run all the tests after updating your components.  Something may have broken.
   
  To run on Heroku, follow the node.js guide to set up git, install MongoDb and Redis, then:
  
    * Make sure all dependencies are in the package.json file.  Include an "engines" section as well.
    * Commit changes to local Git repo, then push to Heroku:
      
      $ git push heroku master 
      $ heroku ps     # Gets status
      $ heroku logs   # See what broke, if anything
       
      $ git push github master (assuming you've added 'github' as a remote)
 */

//
// These components are added by default by express.
//
var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  
//
// These are additional components to make node.js easier, faster, and more fun.
//
var stylus = require('stylus')
  , nib = require('nib')  // Added
  , HerokuRedisStore = require('connect-heroku-redis')(express);
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

//
// App configuration added by express.  You may want to move this out to a separate
// config class at some point.
//
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
  // Additional config for redis support in sessions.  
  //
  app.use(express.session({ store:new HerokuRedisStore, secret: 'your session secret here'}));
  
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
// Routing table for your app.  In a production 
// environment, you'd want to use SSL for any sensitive info.
//
app.get('/', routes.index);
app.get('/login', user.loginForm);
app.post('/login', user.login);
app.get('/logout', user.logout);
app.get('/users/new', user.new);
app.get('/users/:id', user.detail);
app.post('/users/', user.upsert);



var startupMessage = '\r\n' +
  '   ********************************************************\r\n' +
  '   *\r\n' +
  '   *  Express server listening on port ' + app.get('port') + '\r\n' +
  '   *\r\n' +
  '   *  Dependent on services:\r\n' +
  '   *\r\n' +
  '   *    MongoDB:  $ mongod -v\r\n' +
  '   *    Redis:    $ ./redis-server --loglevel verbose\r\n' +
  '   * \r\n' +
  '   *  Check out your home page in a browser by going to:\r\n' +
  '   * \r\n' +
  '   *    http://localhost:' + app.get('port') + '\r\n' +
  '   * \r\n' +
  '   ********************************************************\r\n';

//
// Start the webserver and process requests.
//
http.createServer(app).listen(app.get('port'), function(){
  console.log(startupMessage);
});

//
// Export the app object for integration testing (see ./test/routes/testUser.js)
//
exports.app = function() {
  return app;
}