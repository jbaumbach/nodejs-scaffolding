/*

  Low level support of the MongoDb database connection.

 */

var util = require('util')
  , mongodb = require('mongodb').Db
  ;

//
// MongoDb connection parameters
// todo: read from environment variables
//
var defaultConnectionUrl = 'mongodb://localhost:27017/nodeRolodexSample?w=1';
var dbConnectionUrl = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || defaultConnectionUrl;

//
// Current status of the connection
//
var dbConnected = false;
var db;

//
// Connect to the MongoDb server
//
mongodb.connect(dbConnectionUrl, function(err, newDb) {
  
  db = newDb;
  
  if (err) {
    console.log('MongoDB connection failed! ' + err);
  } else {
    console.log(util.format('MongoDB connection opened: ' + dbConnectionUrl));
    dbConnected = true;
  }
});

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