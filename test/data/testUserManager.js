/**
 * User: jbaumbach
 * Date: 1/8/13
 * Time: 10:04 PM
 */


var assert = require('assert');
var userManager = require('../../data/userManager');
var globalfunctions = require('../../common/globalfunctions');
var db = require('../../data/connectors/mongo');

var existingUserId = '50ebd8a279ef10b28cf6df85';
var existingUserName = 'John Baumbach';
var existingUserEmail = 'john.j.baumbach@gmail.com';
var existingUserPW = 'hello';

//
// Delay to let db connection start.  This seems to be about right.  Any less, the tests will fail.
//
var connectionWaitTimeMs = 500;

//
// Mongo takes a while to connect to, and all queries sent before connection will timeout.
//
describe('userManager', function() {
  //
  // Give the tests time to connect to the database and run
  // 
  this.timeout(9000);
  
  //
  // Tests should close the database connection when done so we don't run out of connections.
  // But don't blow out other tests that might be running.  To ponder a better solution.
  //
  after(function() {
    setTimeout(function() {
      db.close();
    }, 8000);
  })
  
  it('should simply get a user', function(done) {
    
    //
    // Mongo seems to take a while to connect, so let's wait a couple secs before
    // running the first test.
    //
    setTimeout(function() {
      userManager.getUser(existingUserId, function(resultUser) {
        assert.equal(resultUser.name, existingUserName, 'User name incorrect');
        done();
      });
    }, connectionWaitTimeMs);
    
  });

  it('should fail with wrong password', function(done) {
    userManager.validateCredentials(existingUserEmail, 'badpassword', function(nouser) {
      assert.equal(nouser, undefined);
      done();
    })
  });
  
  it('should insert, get, update, validate, then delete a user', function(done) {
    var user = {
      name: 'Darth',
      address: 'Death Star',
      email: 'hello@there.com',
      password: '12345'
    };
    
    userManager.upsertUser(user, function(upsertedUser) {
      var newId = upsertedUser.id;
      
      assert.notEqual(newId, undefined, 'Upsert didn\'t return a user id');
      
      assert.equal(user.name, upsertedUser.name, 'Wrong name after insert');
      assert.equal(user.address, upsertedUser.address, 'Wrong address after insert');
      assert.equal(user.email, upsertedUser.email, 'Wrong email after insert');
      assert.equal(user.password, upsertedUser.password, 'Wrong password after insert');
      
      userManager.getUser(newId, function(gottenUser) {
        assert.equal(user.name, gottenUser.name, 'Wrong name after get');
        assert.equal(user.address, gottenUser.address, 'Wrong address after get');
        assert.equal(user.email, gottenUser.email, 'Wrong email after get');
        assert.equal(user.password, gottenUser.password, 'Wrong password after get');
        
        var updatedName = 'Boba Fett';
        var updatedAddr = 'Tatooine';
        
        gottenUser.name = updatedName;
        gottenUser.address = updatedAddr;
        
        userManager.upsertUser(gottenUser, function(updatedUser) {
          assert.equal(updatedUser.name, updatedName, 'Wrong name after update');
          assert.equal(updatedUser.address, updatedAddr, 'Wrong address after update');
          assert.equal(updatedUser.email, user.email, 'Somehow email changed after update');          
          assert.equal(updatedUser.password, user.password, 'Somehow password changed after update');
          
          userManager.validateCredentials(updatedUser.email, updatedUser.password, function(validatedUser) {
            assert.equal(validatedUser.name, updatedName, 'Unable to validate user');
            
            userManager.deleteUser(newId, function(err) {
              assert.equal(err, undefined, 'Delete user had error');

              done();
            })
          })
        })
      });
    });
  })
})
