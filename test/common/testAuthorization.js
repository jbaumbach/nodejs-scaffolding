/**
 * Test the authorization module
 */

var assert = require('assert')
  , auth = require('../../common/authorization')
  , userManager = require('../../data/userManager')
  , ApiUser = require('../../models/ApiUser')
  , globalFunctions = require('../../common/globalFunctions')
  , util = require('util');
  ;

//
// These tests demonstrate why you don't need a special mocking library for node.js.  You can mock
// anything just by overwriting what you want.  It's global though, so you ned to be
// careful to reset it afterwards.
//
// There are some interesting discussions about it and a potentially nice library "rewire" here:
//
// http://stackoverflow.com/questions/9250851/do-i-need-dependency-injection-in-nodejs-or-how-to-deal-with
//

//
// Temp variable to hold the existing function pointer in userManager.
//
var tempUserManagerGetApiUser;


describe('api authorization', function() {
  
  before(function() {
    //
    // Record existing function pointer.
    //
    tempUserManagerGetApiUser = userManager.getApiUser;
  });
  
  after(function() {
    //
    // Reset the user manager, or other tests in this run could fail.
    //
    userManager.getApiUser = tempUserManagerGetApiUser;
  });
  
  it('should get values properly from the auth header', function() {
    
    var apiKey = 'abc123';
    var hash = 'abc1234567890defghij';
    
    var authHeader = 'CustomAuth apikey=' + apiKey + ', hash=' + hash;
    
    var matchValues = auth.getValsFromAuthHeader(authHeader);
    
    assert.equal(apiKey, matchValues[1], 'didn\'t get apikey');
    assert.equal(hash, matchValues[2], 'didn\'t get hash value');

  });
  
  it('should successfully validate a known api user and a valid Authorization header', function() {

    var calledNext = false;
    var sampleApiKey = '012345';
    var samplePw = 'hello';
    
    var req = {};
    req.header = function(headerVal) {
      assert.equal('Authorization', headerVal, 'other headers being requested - need to update this test?');
      
      //
      // Demo of the proper way to set the 'Authorization' header in Node.js - useful for some sample 
      // code to put in your online documentation.
      //
      var correctHash = globalFunctions.sha256Encode(sampleApiKey + samplePw + Math.floor(new Date() / 1000));
      return util.format('CustomAuth apikey=%s,hash=%s', sampleApiKey, correctHash); 
    };
    
    var res = {};
    res.format = function(e) {
      assert.equal(undefined, e, 'the function wrote to the response - either a failure or the test needs updating'); 
    };

    //
    // Make sure the user manager requests the correct api key, then return a good sample
    // user.
    //
    userManager.getApiUser = function(apiKey, resultCallback) {
      
      assert.equal(sampleApiKey, apiKey, 'api key not properly extracted from header');
      var apiUser = new ApiUser( { apiKey: sampleApiKey, password: samplePw } );
      
      resultCallback(apiUser);
    };

    //
    // Execute our one and only test.
    //
    auth.authorize(req, res, function() { calledNext = true; });
    
    //
    // Make sure we called "next()" ok.
    //
    assert.equal(true, calledNext, 'never got around to calling next()');
    
  });

  it('should bomb out on invalid timestamp', function() {

    var calledNext = false;
    var formattedResonse = false;
    var sampleApiKey = '012345';
    var samplePw = 'hello';

    var req = {};
    req.header = function(headerVal) {
      assert.equal('Authorization', headerVal, 'other headers being requested - need to update this test?');

      //
      // Timestamp 15 minutes old - shouldn't work.
      //
      var oldTimestamp = Math.floor(new Date() / 1000) - (15 * 60);
      var badHash = globalFunctions.sha256Encode(sampleApiKey + samplePw + oldTimestamp);
      return util.format('CustomAuth apikey=%s,hash=%s', sampleApiKey, badHash);
    };

    var res = {};
    res.format = function(e) {
      formattedResonse = true; 
      e.json();
    };
    res.json = function(code, msg) {
      assert.equal(401, code, 'didn\'t get proper response code');
      assert.equal(true, msg.match(/timestamp/).length > 0, 'error msg did not mention timestamp');
    }

    //
    // Make sure the user manager requests the correct api key, then return a good sample
    // user.
    //
    userManager.getApiUser = function(apiKey, resultCallback) {

      assert.equal(sampleApiKey, apiKey, 'api key not properly extracted from header');
      var apiUser = new ApiUser( { apiKey: sampleApiKey, password: samplePw } );

      resultCallback(apiUser);
    };

    //
    // Execute our one and only test.
    //
    auth.authorize(req, res, function() { calledNext = true; });

    //
    // Make sure we had expected behavior
    //
    assert.equal(false, calledNext, 'next() shouldn\'t have been called');
    assert.equal(true, formattedResonse, 'res didn\'t get called with an error');
  });

  it('should bomb out for unknown user', function() {

    var calledNext = false;
    var sampleApiKey = '012345';
    var samplePw = 'hello';
    var badApiKey = '9999999';
    var formattedResonse = false;

    var req = {};
    req.header = function(headerVal) {
      assert.equal('Authorization', headerVal, 'other headers being requested - need to update this test?');

      //
      // Demo of the proper way to set the 'Authorization' header in Node.js - useful for some sample 
      // code to put in your online documentation.
      //
      var correctHash = globalFunctions.sha256Encode(badApiKey + samplePw + Math.floor(new Date() / 1000));
      return util.format('CustomAuth apikey=%s,hash=%s', badApiKey, correctHash);
    };

    var res = {};
    res.format = function(e) {
      formattedResonse = true;
      e.json();
    };
    res.json = function(code, msg) {
      assert.equal(401, code, 'didn\'t get proper response code');
      assert.equal(true, msg.match(/Unknown user/).length > 0, 'error msg did not mention unknown user');
    }

    //
    // Make sure the user manager requests the correct api key, then return a good sample
    // user.
    //
    userManager.getApiUser = function(apiKey, resultCallback) {

      assert.equal(badApiKey, apiKey, 'api key not properly extracted from header');
      var apiUser = new ApiUser( { apiKey: sampleApiKey, password: samplePw } );

      resultCallback(apiUser);
    };

    //
    // Execute our one and only test.
    //
    auth.authorize(req, res, function() { calledNext = true; });

    //
    // Make sure we had expected behavior
    //
    assert.equal(false, calledNext, 'next() shouldn\'t have been called');
    assert.equal(true, formattedResonse, 'res didn\'t get called with an error');

  });

  //*********** All test should be above this line
});
