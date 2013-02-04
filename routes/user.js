
/*
 * User - controllers
 */

var userManager = require('./../data/userManager');
var util = require('util');
var globalfunctions = require('./../common/globalfunctions');
var User = require('../models/User');
var ApiUser = require('../models/ApiUser');

exports.loginForm = function(req, res) {
  var pageVars = {
    title: 'User Login'
  };
  res.render('userLogin', pageVars);
};

exports.login = function(req, res) {
  var email = req.body.email;
  var password = globalfunctions.hashPassword(req.body.password);
  
  userManager.validateCredentials(email, password, function(user) {
    
    if (user) {
      //
      // User validated successfully.  
      //
      globalfunctions.loginUser(req, user.id);
      res.redirect('/');
    } else {
      //
      // Oops, something went wrong.  Login is a post, but doesn't affect the database, so 
      // ok to re-render the page with the existing post data rather than our usual
      // redirect nonsense.
      //
      var delayMs = 0;
      var todoAfterAShortDelay = function() {
        res.render('userLogin', { title: 'User Login', error: 'Incorrect email or password3' });
      };
      setTimeout(todoAfterAShortDelay, delayMs);
    }
  })
}

exports.logout = function(req, res) {
  globalfunctions.logoutUser(req);
  res.redirect('/');
}

exports.new = function(req, res) {
  var pageVars = {
    title: 'New User',
    user: new User()
  };
  res.render('userAddEdit', pageVars);
}

exports.detail = function(req, res) {
  var sessionInfo = globalfunctions.getSessionInfo(req);
  var requestedUserId = req.params.id;
  
  userManager.getUser(sessionInfo.userId, function(user) {
    if (user) {
      if (sessionInfo.userId === requestedUserId) {
        //
        // Must reenter password in this version of the site.
        //
        user.password = '';
        
        //
        // This may or may not be an example of a "closure" in Javascript.  The 
        // consensus seems to be that's when a function inside another function 
        // uses local variables from the outside function.  This can cause 
        // memory leaks in some circumstances, so be careful.
        //
        var renderPage = function(apiUser) {

          apiUser = apiUser || new ApiUser();

          var pageVars = {
            title: 'Edit Profile',
            user: user,
            apiuser: apiUser
          }

          res.render('userAddEdit', pageVars);
        }

        var action = req.param('action');

        if (action === 'createapikey') {
          userManager.upsertApiUser(new ApiUser( { associatedUserId: user.id } ), renderPage);
        } else {
          userManager.getApiUserByUserId(sessionInfo.userId, renderPage);
        }
        
      } else {
        throw 'Viewing other users not implemented';
      }
      
    } else {
      res.send(404, 'Sorry, that user is not found.');
    };
  });
}

exports.upsert = function(req, res) {
  
  //
  // Todo: sanitize user input here via https://github.com/chriso/node-validator
  //

  //
  // Create a user object from the submitted form values
  //
  var user = new User({
    name: req.body.name,
    address: req.body.addr,
    email: req.body.email,
    password: globalfunctions.hashPassword(req.body.pw1)
  });

  //
  // If the user is logged in, this is an update.  Add the current 
  // user id to the user object we'll add/insert into the db.
  //
  var sessionInfo = globalfunctions.getSessionInfo(req);
  
  if (sessionInfo.userId) {
    user.id = sessionInfo.id;
  }
  
  userManager.upsertUser(user, function(upsertedUser) {
    //
    // If it worked, we have an upserted user
    //
    if (upsertedUser) {
      
      sessionInfo.userId = upsertedUser.id;
      globalfunctions.setSessionInfo(req, sessionInfo);

      // message: util.format('User successfully %s', loggedIn ? 'updated' : 'created') 

      res.redirect('/');
      
    } else {
      res.render('userAddEdit', 
        {
          title: util.format('%s User', loggedIn ? 'Update' : 'Add'),
          error: util.format('Unable to %s user!', loggedIn ? 'update' : 'create')
        });
    }
    
  }); 
}
