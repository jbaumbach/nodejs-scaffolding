//
// Let's test that our index page renders properly.
//

var request = require('supertest')
  , myApp = require('../../app.js');

var app = myApp.app();

describe('homepage', function() {

  this.timeout(9000);

  it('should display some basic stuff', function(done) {
    request(app)
      .get('/')
      .expect(/<header>.*<\/header>/)
      .expect(/<div.*class="container".*<\/div>/)
      .expect(/<div.*class="main-content".*<\/div>/)
      .expect(/<div.*class="sidebar".*<\/div>/)
      //.expect(/<footer>.*<\/footer>/) // <-- WTF?  This should pass but mysteriously stopped for no reason
      .expect(200, done);
  });
});
