
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
    user: {}
  };
  res.render('userAddEdit', pageVars);
}

exports.detail = function(req, res) {
  throw 'Not implemented!';
}

exports.upsert = function(req, res) {
  throw 'Not implemented!';
}