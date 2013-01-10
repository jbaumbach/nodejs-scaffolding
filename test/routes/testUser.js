/**
 * User: jbaumbach
 * Date: 1/8/13
 * Time: 10:20 PM
 */

// https://github.com/visionmedia/supertest
  
var request = require('supertest')
  , myApp = require('../../app.js');

var app = myApp.app();

//
// Note: if db closes in other tests, tests here that call the database will bomb out.
//
var connectionWaitTimeMs = 1500;

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
  
  it('should show error for incorrect login', function(done) {
    request(app)
      .post('/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=john.j.baumbach@gmail.com&password=blah')
      .expect(/p.*class="error"/)
      .expect(200, done);
  });

  it('should allow login of known user', function(done) {
    request(app)
      .post('/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=john.j.baumbach@gmail.com&password=hello')
      .expect(302, done);
  });
  
});
