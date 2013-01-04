
/*
 * User - controllers
 */

var db = require('../data/userManager');

exports.loginForm = function(req, res) {
  var pageVars = {
    title: 'User Login'
  };
  res.render('userLogin', pageVars);
};

exports.login = function(req, res) {
  throw 'Not implemented!';
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
  throw 'Not implemented!';
}

exports.upsert = function(req, res) {
  // todo: check if we have a logged in user.  If so,
  // that's what we update.  Otherwise, insert.
  throw 'Not implemented!';
}