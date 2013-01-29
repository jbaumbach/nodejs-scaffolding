/**
 * UserApi: controllers
 */

var userManager = require('./../data/userManager');
var util = require('util');
var globalfunctions = require('./../common/globalfunctions');
var User = require('./../models/User');

exports.list = function(req, res) {
  
  var temp = {
    Name: "JohnnyB",
    Addr: "1234 Ugga Bugga",
    Phone: "555-1212",
    Activity: [
      { Date: "2012/1/10" },
      { Date: "2012/1/15" },
      { Date: "2012/1/31" }
    ]
  }
  
  res.format({
    json: function() { res.json(JSON.stringify(temp)); }
  });
  
};