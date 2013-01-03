/**
 * User: jbaumbach
 * Date: 1/2/13
 * Time: 5:33 PM
 */

var util = require('util'),
  db = require('../connectors/mongo'),
  mongodb = require('mongodb');

exports.getUser = function(id, resultCallback) {
  var result = undefined;

  db().collection('user', function(err, collection) {
    //
    // Convert our friendly hex version of the user's id into Mongo's 
    // preferred binary, then search
    //
    collection.find({ _id: mongodb.ObjectID(id)}, function (err, cursor) {
      cursor.each(function(err, user) {
        //
        // Loop through the result set and add all the customers to the 
        // result collection (if any)
        //
        if (user != null) {
          user.id = user._id.toString();
          result = user;
        } else {
          resultCallback(result);
        }
      })
    })
  })
};

exports.upsertUser = function(user, resultCallback) {
  throw 'Not implemented!';
};

exports.validateCredentials = function(id, password) {
  throw 'Not implemented!';
};