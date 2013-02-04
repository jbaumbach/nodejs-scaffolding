/**
 * api documentation
 */

var globalfunctions = require('./../common/globalfunctions')
  , userManager = require('./../data/userManager')
  , util = require('util')
  , ApiUser = require('../models/ApiUser')
  ;

exports.index = function(req, res) {

  var pageVars =
  {
    title: 'API Documentation',
  };

  var sessionInfo = globalfunctions.getSessionInfo(req);

  function finalRender(apiUser) {
    var apiUser = apiUser || new ApiUser({ apiKey:'yourkey', password:'yourpassword'});

    //
    // todo: update these with values read from config settings
    //
    var host = 'http://localhost:3000';
    
    //
    // List of all API operations here
    //
    pageVars.operations = [
      {
        title:'Get All Users',
        description:'This call returns all users in the database.',
        signature:util.format('%s/apiv1/users/', host),
        authentication:'Hashed credentials + timestamp',
        //
        // Insert the users credentials if we have them
        //
        tryit:util.format('curl -H \'Accept: application/json\' -H \'Authorization: CustomAuth apikey=%s, hash=\'$(php -r \'echo hash("sha256","%s" . "%s" . time());\') %s/apiv1/users/', apiUser.apiKey, apiUser.apiKey, apiUser.password, host)
      }
    ];

    pageVars.apiUser = apiUser;
    
    res.render('apidocumentation', pageVars);
  }

  if (sessionInfo.userId) {
    userManager.getApiUserByUserId(sessionInfo.userId, function(apiUser) {
      finalRender(apiUser);
    });
  } else {
    finalRender(undefined);
  };
};
