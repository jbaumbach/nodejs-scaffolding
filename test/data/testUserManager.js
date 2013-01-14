/*

  Test the user manager functions.  Although it tests your database functionality, it
  should be completely agnostic of your chosen database.  This allows you to swap in and out
  database technologies pretty easily without having to refactor your code.
  
  At this time, however, using MongoDb requires a little bit of db-specific futzing to work.
  
  Todo: move the db object to an agnostic class that does the connecting/deconnecting/waiting.

 */
var assert = require('assert');
var userManager = require('../../data/userManager');
var db = require('../../data/connectors/mongo');

//
// For the "existing user" test(s) to work, create this user in your interface so it 
// saves to the database.  Then set the fields here, especially the user id.
//
var existingUserId = '50f1ebc3dd71688aad448b62';
var existingUserName = 'Thomas Anderson';
var existingUserEmail = 'neo@thematrix.com';
var existingUserPW = 'neo123';

//
// Delay to let db connection start.  This seems to be about right.  Any less, the tests will fail.
//
var connectionWaitTimeMs = 500;

//
// Mongo takes a while to connect, and all queries sent before the connection is made will timeout,
// and bomb out our tests.
//
describe('userManager', function() {
  //
  // Give the tests time to connect to the database and run
  // 
  this.timeout(9000);
  
  //
  // Tests should close the database connection when done so we don't run out of connections.
  // But don't blow out other tests that might be running.  To ponder: a better solution.
  //
  after(function() {
    setTimeout(function() {
      db.close();
    }, 8000);
  })
  
  //
  // If you don't have the above existing user created, these tests will fail.  I recommend
  // keeping these to keep a safety net of regression tests around in case you forget something
  // when you're refactoring your db in the future.
  // 
  it('(optionally) should get an existing user', function(done) {
    
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

  it('(optionally) should fail with wrong password for an existing user', function(done) {
    userManager.validateCredentials(existingUserEmail, 'badpassword', function(nouser) {
      assert.equal(nouser, undefined);
      done();
    })
  });
  
  //
  // This tests the full cycle of CRUD actions, and cleans up afterwards.
  //
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
