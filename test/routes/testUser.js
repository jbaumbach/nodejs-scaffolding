/*

  Here are some integration tests to make sure that node.js, express, and your routes are set up properly.
  These are good to have around to regression test your app as you develop and refactor.
  
  The "supertest" component is good for this.

    https://github.com/visionmedia/supertest
 
 */
  
var request = require('supertest')
  , myApp = require('../../app.js');

var app = myApp.app();

//
// Note: if the db closes in other tests, routes here that call the database will bomb out.
//

describe('login and user features', function() {

  this.timeout(9000);

  it('should have login fields on login page', function(done) {
    request(app)
      .get('/login')
      .expect(/input.*name="email"/)
      .expect(/input.*name="password"/)
      .expect(/input.*type="submit"/)
      .expect(200, done);
  });
  
  //
  // Note: these tests rely on your existing user (see: testUserManager.js)
  // 
  it('should show error for and incorrect login', function(done) {
    request(app)
      .post('/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=neo@thematrix.com&password=wrongpassword')
      .expect(/p.*class="error"/)
      .expect(200, done);
  });

  //
  // Todo: figure out why Supertest isn't following the redirect as indicated
  // in the documentation.  This test should then be updated to test if the 
  // user was logged in successfully (e.g. if Redis not running, sessions won't work,
  // and this should fail).
  //
  it('should allow login of known user', function(done) {
    request(app)
      .post('/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=neo@thematrix.com&password=neo123')
      .expect(302, done);
  });



});
