/**
 * Authentication module
 */

exports.getValsFromAuthHeader = function(headerString) {

  var result = headerString.match(/Authorization:.*CustomAuth.*apikey="(.*)".*,.*hash="(.*)".*/);

  return result;
}

exports.test = function(temp) {
  console.log("In 'test' ok");
}

exports.authorize = function(req, res, next) {
  
  var httpResponseCode;
  var error; 
  var expectedDesc = 'Authorization: CustomAuth apikey="your_key", hash="sha256(your_key+your_password+seconds_since_epoch)"';
  
  // https://developers.google.com/youtube/2.0/developers_guide_protocol_clientlogin

  // curl -H "Accept: application/json" -H "Authorization:ugga"  http://localhost:3000/apiv1/users/
  
  var authHeader = req.header('Authorization');

  if (!authHeader) {
    httpResponseCode = 401;
    error = {
      Message: 'Missing \'Authorization\' header.  Expected: ' + expectedDesc + '\r\n'
    }
  }

  todo: figure out why suddenly functions can't be called!! WTF???
    
  this.test('ugga');
  
  
  var userVals = this.getValsFromAuthHeader(authHeader);
  
  if (!userVals[1] || !userVals[2]) {
    httpResponseCode = 401;
    error = {
      Message: 'Unable to retrieve "apikey" or "hash" authorization header values.  Expected: ' + expectedDesc + '\r\n'
    }
  }
  
  if (error) {
    //
    // Error message
    //
    res.format({
      json: function() { res.json(httpResponseCode, JSON.stringify(error)) }
    });
    
  } else {
    //
    // Successful authorization
    //
    next();
    
  }
}