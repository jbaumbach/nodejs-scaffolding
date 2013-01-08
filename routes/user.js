
/*
 * User - controllers
 */

var userManager = require('./../data/userManager');
var util = require('util');
var globalfunctions = require('./../common/globalfunctions');

exports.loginForm = function(req, res) {
  var pageVars = {
    title: 'User Login'
  };
  res.render('userLogin', pageVars);
};

exports.login = function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  
  userManager.validateCredentials(email, password, function(user) {
    if (user) {
      //
      // User validated successfully
      //
      globalfunctions.loginUser(req, user.id);
      res.redirect('/');
    } else {
      //
      // Oops, something went wrong.  Login is a post, but doesn't affect the database, so 
      // ok to re-render the page with the existing post data rather than our usual
      // redirect nonsense.
      //
      var todoAfterAShortDelay = function() {
        res.render('userLogin', { title: 'User Login', error: 'Incorrect email or password3' });
      };
      setTimeout(todoAfterAShortDelay, 800);
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
    user: {
      name: '',
      address: '',
      email: '',
      password: ''
    }
  };
  res.render('userAddEdit', pageVars);
}

exports.detail = function(req, res) {
  var sessionInfo = globalfunctions.getSessionInfo(req);
  var requestedUserId = req.params.id;
  
  userManager.getUser(sessionInfo.userId, function(user) {
    if (user) {
      if (sessionInfo.userId === requestedUserId) {
        var pageVars = {
          title: 'Edit Profile',
          user: user
        }
        
        res.render('userAddEdit', pageVars);
        
      } else {
        throw 'Viewing other users not implemented yet';
      }
      
    } else {
      res.send(404, 'Sorry, that user is not found.');
    };
  });
}

exports.upsert = function(req, res) {

  //
  // Create a user object from the submitted form values
  //
  var user = {
    name: req.body.name,
    address: req.body.addr,
    email: req.body.email,
    password: req.body.pw1
  }

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