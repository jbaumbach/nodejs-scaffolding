//
// Let's test some global functions action
//
var assert = require('assert');

var globalFunctions = require('../../common/globalfunctions');

describe('globalFunctions', function() {

  //
  // Mock the request and session.  This tests our functions, not the session object.
  //
  it('should have undefined userId if no session', function() {
    var req = {};
    req.session = {};
    var sessionInfo = globalFunctions.getSessionInfo(req);

    assert.equal(undefined, sessionInfo.userId, 'user id is not undefined');
  });

  it('should retain user id in session', function() {
    var req = {};
    req.session = {};
    req.session.sessionInfo = { userId: 'yoda' };
    var sessionInfo = globalFunctions.getSessionInfo(req);

    assert.equal('yoda', sessionInfo.userId, 'didn\'t get user id properly');
  });

  it('should set the session info', function() {
    var req = {};
    req.session = {};
    var sessionInfo = { userId: 'boba' };
    
    globalFunctions.setSessionInfo(req, sessionInfo);
    
    assert.equal('boba', req.session.sessionInfo.userId, 'Session userId not set correctly');
  });
  
  it('should login user', function() {
    var req = {};
    req.session = {};
    var userId = 'luke';
  
    globalFunctions.loginUser(req, userId);
    
    assert.equal('luke', req.session.sessionInfo.userId, 'Session userId not set correctly');
  });
  
  it('should log out the user', function() {
    var req = {};
    req.session = {};
    req.session.sessionInfo = { userId: 'agentsmith' };
    
    globalFunctions.logoutUser(req);
    
    assert.equal(req.session.sessionInfo, undefined, 'Did not null out session properly');
  });
  
  it('should have some kind of password hashing', function() {
    var password = 'uggabugga';
    var password2 = 'uggabugga';
    
    var hashedPw = globalFunctions.hashPassword(password);
    var hashedPw2 = globalFunctions.hashPassword(password2);
    
    assert.notEqual(hashedPw, password, 'Password not altered');
    assert.equal(hashedPw, hashedPw2, 'Hash not reproducible');
  });
  
  it('should generate unique id and pw vals from seed value', function() {
    
    var uniqueVal = 'uggabugga';
    var res = globalFunctions.generateUniqueCredentials(uniqueVal);
    var expectedPWLength = 32;
    
    assert.notEqual(uniqueVal, res.uid, 'UID not unique');
    assert.notEqual(uniqueVal, res.password, 'PW not unique');
    assert.notEqual(res.uid, res.password, 'UID is same as password!');
    
    assert.equal(expectedPWLength, res.uid.length, 'UID not ' + expectedPWLength + ' chars in length');
    assert.equal(expectedPWLength, res.password.length, 'PW not ' + expectedPWLength + ' chars in length');
    
  });
})