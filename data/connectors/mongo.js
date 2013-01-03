/**
 * User: jbaumbach
 * Date: 1/2/13
 * Time: 4:16 PM
 */

var util = require('util'),
  mongodb = require('mongodb');

//
// MongoDb connection parameters
// todo: read from environment variables
//
var dbServerHostname = 'localhost';
var dbServerPort = 27017;
var dbServerOptions = { auto_reconnect: true };
var dbConnectionOptions = { w: 1 };   // Acknowledge when written to mongodb journal
var dbName = 'nodeRolodexSample';

//
// Connect to the MongoDb server
// 
var server = new mongodb.Server(dbServerHostname, dbServerPort, dbServerOptions);
var db = new mongodb.Db(dbName, server, dbConnectionOptions);

db.open(function(err, db) {
  //
  // Note: 'db' intentionally ignored
  // 
  if (err) {
    console.log('MongoDB connection failed! ' + err);
  } else {
    console.log(util.format('MongoDB connection opened: %s:%d/%s', dbServerHostname, dbServerPort, dbName));
  }
});

// todo: authenticate here as well

module.exports = function() {
  return db;
}