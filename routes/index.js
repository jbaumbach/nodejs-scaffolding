
/*
 * GET home page.
 */

var globalfunctions = require('./../common/globalfunctions');
var userManager = require('./../data/userManager');

exports.index = function(req, res){
  
  var pageVars = 
  { 
    title: 'Express',
    user: {}
  };
  
  var sessionInfo = globalfunctions.getSessionInfo(req);
  
  if (sessionInfo.userId) {
     userManager.getUser(sessionInfo.userId, function(user) {
       pageVars.user.id = sessionInfo.userId,
       pageVars.user.name = user.name;
       
       res.render('index', pageVars);
     });
  } else {
    res.render('index', pageVars);
  };
  
};