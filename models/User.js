/*

  Define the properties of a User.  This "class" is not technically required (nor
  do "classes" actually exist in Javascript), because as a dynamic language
  you're allowed to create objects and add properties and methods on the fly.
  
  However, as your applications move beyond "trivial" and get a bit more
  complicated, it's useful to have a more solid definition of your models.
  This helps other developers get up to speed with your code quicker, and
  some IDEs (such as "Webstorm") can provide you with intellisense
  as you're coding.
  
  There are many many ways to implement "Class" patterns in Javascript.  Check
  out some of these discussions for more info:

    http://www.phpied.com/3-ways-to-define-a-javascript-class/
    http://stackoverflow.com/questions/387707/whats-the-best-way-to-define-a-class-in-javascript
    http://blog.mixu.net/2011/02/02/essential-node-js-patterns-and-snippets/
    http://css.dzone.com/articles/naked-javascript-defining
 
 */

var User = function(values) {
  //
  // Explicitly initialize instance variables in the constructor.  All properties
  // not initialized here are treated as static variables.
  //
  values = values || {};

  this.id = values.id || '';
  this.name = values.name || '';
  this.address = values.address || '';
  this.email = values.email || '';
  this.password = values.password || '';
}

module.exports = User;