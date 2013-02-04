/*

  Implementation of the user manager functions using MongoDb.
  
 */

var util = require('util')
  , mongodb = require('mongodb')
  , db = require('./../connectors/mongo')
  , thisModule = this
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
  
  //
  // Make sure we can get our new object back so we can return the new id to the 
  // client.  See info here:
  //
  // https://github.com/mongodb/node-mongodb-native#find-and-modify
  //
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
      resultCallback(err);
    });
  });
};

//
// Get an API user by the passed selector
//
function getApiUserWithSelector(collection, findSelector, resultCallback) {
  var result = undefined;
  collection.find(findSelector, function (err, cursor) {
    cursor.each(function (err, apiUser) {
      //
      // Loop through the result set and get the apiUser (if found)
      //
      if (apiUser != null) {
        result = apiUser;
      } else {
        resultCallback(result);
      }
    })
  })
}

//
// Get an API user by the api key
//
exports.getApiUser = function(apiKey, resultCallback) {
  db().collection('apiuser', function(err, collection) {
    
    var findSelector = { apiKey: apiKey };
    getApiUserWithSelector(collection, findSelector, resultCallback);
  })
};

//
// Get an API user by a user id.  Returns undefined if not found.
//
exports.getApiUserByUserId = function(userId, resultCallback) {
  db().collection('apiuser', function(err, collection) {

    //
    // Note: the associatedUserId is not "mongoized" (e.g. not a binary id).  It's
    // just a string that the app knows about.  Since MongoDb doesn't "really"
    // join tables, this is probably ok and easier to use by the app.  
    // 
    // If this needs to be changed in the future, you can add a field 
    // "_associatedUserId" in the "upsertApiUser" function 
    // to convert the id to the mongoized version and store it in the db record,
    // then update this code to also convert the id when searching.
    //
    
    var findSelector = { associatedUserId: userId };
    getApiUserWithSelector(collection, findSelector, resultCallback);
  })
};

//
// Upsert an api user.
//
exports.upsertApiUser = function(apiUser, resultCallback) {

  var result = undefined;
  var upsertSelector = { _id: apiUser.id ? mongodb.ObjectID(apiUser.id) : '' };
  var updateOptions = { upsert: true, new: true };

  db().collection('apiuser', function(err, collection) {

    collection.findAndModify(upsertSelector, [['_id','asc']], apiUser, updateOptions, function(err, upsertedUser) {

      if (upsertedUser) {
        upsertedUser.id = upsertedUser._id.toString();
        result = upsertedUser;
      }

      resultCallback(result);
    })
  })
};

//
// Delete an api user
//
exports.deleteApiUser = function(apiKey, resultCallback) {
  db().collection('apiuser', function(err, collection) {

    var findSelector = { apiKey: apiKey };

    collection.remove(findSelector, function(err) {
      resultCallback(err);
    });
  });
};

