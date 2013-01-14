/*

  Implementation of the user manager functions using the MongoDB.
  
 */

var util = require('util')
  , mongodb = require('mongodb')
  , db = require('./../connectors/mongo')
;

//
// Return a user object from the data store corresponding to the passed id
//
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

//
// Upsert the passed user in the data store.  If the user object doesn't have an
// id, then it'll insert.
//
exports.upsertUser = function(user, resultCallback) {
  var result = undefined;

  var upsertSelector = { _id: user.id ? mongodb.ObjectID(user.id) : '' };
  var updateOptions = { upsert: true, new: true };
  
  db().collection('user', function(err, collection) {
    
    collection.findAndModify(upsertSelector, [['_id','asc']], user, updateOptions, function(err, upsertedUser) {
      
      if (upsertedUser) {
        //
        // Get a friendly id from the mongoDb's id and set it into the
        // (possibly) new object.
        //
        upsertedUser.id = upsertedUser._id.toString();
        result = upsertedUser;
      }
      
      resultCallback(result);
    })
  })
};

//
// Validate the passed credentials and return the user if successful
//
exports.validateCredentials = function(email, password, resultCallback) {
  db().collection('user', function(err, collection) {
    var findSelector = {
      email: email
    };
    
    collection.findOne(findSelector, function(err, user) {
      if (user && password === user.password) {
        user.id = user._id.toString();
        resultCallback(user);
      } else {
        resultCallback(null);
      }
    });
  });
};

//
// Delete a user
//
exports.deleteUser = function(id, resultCallback) {
  db().collection('user', function(err, collection) {
    
    var findSelector = { _id: mongodb.ObjectID(id) };

    collection.remove(findSelector, function(err) {
      resultCallback(null);
    });
  });
};
