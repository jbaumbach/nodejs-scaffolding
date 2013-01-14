/*

  The user manager functions.  The purpose of this class is to decouple your business
  logic from database logic.  This is beneficial because your future developers
  don't have to know or care what database is being used, and if you want to change
  databases in the future, you won't have to refactor your business logic.

  Currently there is no application caching - we're going direct to the db each time
  for our data.  Eventually this could limit the scalability of your site.  
  
  This would be a good place to implement our application caching.
  
 */

//
// todo: use a factory pattern to allow dependency injection.  We just return 
// mongo by default now.
//  
var db = require('./drivers/mongoUserManager');

exports.getUser = function(id, resultCallback) {
  db.getUser(id, resultCallback);
}

exports.upsertUser = function(user, resultCallback) {
  db.upsertUser(user, resultCallback);
}

exports.validateCredentials = function(email, password, resultCallback) {
  db.validateCredentials(email, password, resultCallback);
}

exports.deleteUser = function(id, resultCallback) {
  db.deleteUser(id, resultCallback);
}