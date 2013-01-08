/**
 * User: jbaumbach
 * Date: 1/6/13
 * Time: 10:39 AM
 */

//
// Return the current session info object
//
exports.getSessionInfo = function(req) {
  var sessionInfo = req.session.sessionInfo;

  if (!sessionInfo) {
    //
    // We don't have one, so return a default session info object
    //
    sessionInfo = {
      userId: undefined
    }
  }

  return sessionInfo;
}

//
// Set the current session info object
//
exports.setSessionInfo = function(req, sessionInfo) {
  req.session.sessionInfo = sessionInfo;
}

exports.loginUser = function(req, userId) {
  var sessionInfo = this.getSessionInfo(req);
  sessionInfo.userId = userId;
  this.setSessionInfo(req, sessionInfo);
}

exports.logoutUser = function(req) {
  this.setSessionInfo(req, null);
}

exports.hashPassword = function(password) {
  var crypto = require('crypto');
  var salt = 'put_your_salt_here';

  var result = crypto.createHash('sha256').update(salt + password).digest('hex');

  return result;
}