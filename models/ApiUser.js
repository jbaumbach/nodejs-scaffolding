/**
 * Defines properties for an api user.  
 * 
 * See architecture notes in "user.js"...
 */

var ApiUser = function(values) {

  values = values || {};
  
  this.id = values.id || '';
  
  //
  // Optional - for convenience, apiUser is associated with regular user accounts.
  //
  this.associatedUserId = values.associatedUserId || '';
  
  this.apiKey = values.apiKey || '';
  this.password = values.password || '';
  this.authorizedOperations = values.authorizedOperations || [];
  this.inactiveDate = values.inactiveDate;
}

module.exports = ApiUser;