/**
 * User: jbaumbach
 * Date: 1/29/13
 * Time: 12:49 AM
 */

var assert = require('assert');
var userApi = require('../../common/authorization');

describe('authorization', function() {
  
  it('should get values properly from the auth header', function() {
    
    var apiKey = 'abc123';
    var hash = 'abc1234567890defghij';
    
    var authHeader = 'Authorization: CustomAuth apikey="' + apiKey + '", hash="' + hash + '"';
    
    var matchValues = userApi.getValsFromAuthHeader(authHeader);
    
    assert.equal(apiKey, matchValues[1], 'didn\'t get apikey');
    assert.equal(hash, matchValues[2], 'didn\'t get hash value');

  });
  
});