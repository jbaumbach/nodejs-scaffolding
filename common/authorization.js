/**
 * Authentication module
 * 
 * There are many possible ways to authenticate and authorize API calls.  Two existing
 * standards are "BasicAuthentication" and "DigestAuthentication".  Both have pros
 * and cons.
 * 
 * For our purposes, we want to:
 * 
 * - Ensure the caller is known to our system (passes credentials)
 * - Have valid credentials passed on every call (e.g. no challenge-response round trips)
 * - If we don't have SSL, ensure the password is not sent across the wire in plain 
 *   text (e.g. hashed or encrypted in some way)
 * - Ensure that if any requests are sniffed by an attacker, the request will eventually
 *   expire (e.g. timestamped).
 * 
 * A reasonable approach is to reuse the existing RFC specified "Authorization" header
 * and set up a simple custom authentication scheme.  Amazon and Google have taken
 * similar approaches, and some discussions can be found here.
 * 
 * https://developers.google.com/youtube/2.0/developers_guide_protocol_clientlogin
 * http://stackoverflow.com/questions/8042907/how-does-api-signature-authentication-work-as-implemented-by-mashery
 *
 * The signed url is good for a variable amount of minutes before it expires.  The
 * approach to validating the timestamp is to round the time to seconds, and not
 * require the client to separately send the timestamp.  We will assume that the
 * client and server have reasonably similar clock values, and that the request gets
 * to the server from the client within a short period of time < 2 seconds.
 * 
 * When we get the request, we loop through the seconds backwards and validate the
 * timestamp for each second.  If our assumptions are true, then we probably won't
 * loop more than 2 times for each request, keeping CPU usage reasonable (we have
 * to sha256 hash a string in each loop).  Obviously, the older the request then
 * the more work the server CPU has to do.  
 * 
 * One drawback with a custom header is that you can no longer test your API with 
 * a standard browser (although there are plugins that can help).
 * 
 * It's easy to test in curl however, here's a sample command line to grab some 
 * users:
 * 
 *  curl -H 'Accept: application/json' -H 'Authorization: CustomAuth apikey=your_key, hash='$(php -r 'echo hash("sha256","your_key"."your_password".time());') http://localhost:3000/apiv1/users/
 *  
 */
  
  
var globalFunctions = require('./globalFunctions')
  , userManager = require('../data/userManager')
  , util = require('util')
  , thisModule = this
  ;

//
// Search the passed header string and grab it's values if possible, returning
// them in an array of strings.
//
exports.getValsFromAuthHeader = function(headerString) {

  var result = headerString.match(/ *CustomAuth *apikey=(.*) *, *hash=(.*) */);

  return result;
}

//
// Validate the passed hash value with the values from the passed api user.  Returns
// true if the hashed value is valid.  The hashed value must have been generated
// by the client within the last "validForMinutes" minutes.
//
exports.authorizeCredentials = function(hashedValue, apiUser, validForMinutes) {
  
  var result = false;
  var timestamp = Math.floor(new Date() / 1000);  // If your server's clock is consistently off you can add seconds here
  var minutes = Math.min(Math.max(1, validForMinutes), 10);  // validMinutes should be between 1 and 10
  var maxSecondsToSearch = 60 * minutes;
  
  for (var loop = 0; loop <= maxSecondsToSearch; loop++) {
    
    var validValueToHash = util.format('%s%s%d', apiUser.apiKey, apiUser.password, timestamp - loop);
    var validValueHash = globalFunctions.sha256Encode(validValueToHash);
    
    if (hashedValue === validValueHash) {
      result = true;
      break;
    }
  }
  
  return result;
}

//
// Write an error to the response object, or call next, depending on whether
// there's an error object or not.
//
exports.authorizationComplete = function(error, req, res, next) {
  if (error) {
    //
    // Error message
    //
    res.format({
      json:function () {
        res.json(error.httpResponseCode, JSON.stringify(error.Message))
      }
    });

  } else {
    //
    // Successful authorization
    //
    next();
  }
}

//
// Authenticate and authorize an api call.  Call next() if ok, otherwise 
// write an error to response.
//
exports.authorize = function(req, res, next) {
  
  var error; 
  
  //
  // Descriptive string to pass to client in an error message in case something goes wrong
  //
  var expectedDesc = 'Authorization: CustomAuth apikey=your_key, hash=sha256(your_key+your_password+seconds_since_epoch)';
  
  var requestValidForMins = 5;
  
  var authHeader = req.header('Authorization');

  if (!authHeader) {
    
    error = {
      httpResponseCode: 401,
      Message: 'Missing \'Authorization\' header.  Expected: ' + expectedDesc
    }
  } 
  
  if (!error) {

    var userVals = thisModule.getValsFromAuthHeader(authHeader);
    
    if (!userVals || !userVals[1] || !userVals[2]) {
      error = {
        httpResponseCode: 401,
        Message: 'Unable to retrieve "apikey" or "hash" authorization header values.  Expected: ' + expectedDesc
      }
    }
  }

  if (!error) {
    //
    // Authorize the apiUser
    //
    var password = userManager.getApiUser(userVals[1], function(apiUser) {

      if (!apiUser) {
        
        error = {
          httpResponseCode: 401,
          Message: util.format('Unknown user \'%s\' or invalid password', userVals[1])
        }
        
      } else {

        var isAuthorized = thisModule.authorizeCredentials(userVals[2], apiUser, requestValidForMins);
        
        if (!isAuthorized) {
          error = {
            httpResponseCode: 401,
            Message: util.format('Unknown user \'%s\', invalid password, or invalid/expired timestamp', userVals[1])
          }
        }
        
        //
        // If no error by here, we're valid!
        //
      }

      thisModule.authorizationComplete(error, req, res, next);
    });
    
  } else {
    
    //
    // We have an error
    //
    thisModule.authorizationComplete(error, req, res, next);
  }
}
