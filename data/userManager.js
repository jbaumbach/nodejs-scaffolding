/**
 * User: jbaumbach
 * Date: 1/2/13
 * Time: 5:20 PM
 */
  
// todo: make a factory to replace this, it just returns mongo by default
  
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