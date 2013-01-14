/*

  Low level support of the MongoDb database connection.

 */

var util = require('util')
  , mongodb = require('mongodb')
  ;

//
// MongoDb connection parameters
// todo: read from environment variables
//
var dbServerHostname = 'localhost';
var dbServerPort = 27017;
var dbServerOptions = { auto_reconnect: true };
var dbConnectionOptions = { w: 1 };   // "writeconcern"; acknowledge when written to mongodb journal
var dbName = 'nodeRolodexSample';

//
// Current status of the connection
//
var dbConnected = false;

//
// Connect to the MongoDb server
// 
var server = new mongodb.Server(dbServerHostname, dbServerPort, dbServerOptions);
var db = new mongodb.Db(dbName, server, dbConnectionOptions);

db.open(function(err, db) {
  //
  // Note: 'db' return parameter intentionally ignored
  // 
  if (err) {
    console.log('MongoDB connection failed! ' + err);
  } else {
    console.log(util.format('MongoDB connection opened: %s:%d/%s', dbServerHostname, dbServerPort, dbName));
    dbConnected = true;
  }
});

// todo: authenticate here as well

//
// Main export: the global database connection.  If we're not connected, throw 
// an error.
//
module.exports = function() {
  if (!dbConnected) {
    throw 'DB connection not ready - please try again later';    
  } else {
    return db;
  }
}

//
// Close the connection
//
module.exports.close = function() {
  if (dbConnected) {
    db.close();
    dbConnected = false;
    console.log('MongoDb connection closed');
  }
}