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
      // todo: fix these tests, they don't like newlines in the HTML
      //.expect(/<div.*class="container"(.|[\r\n])<\/div>/gm)
      //.expect(/<div.*class="main-content"(.|[\r\n])<\/div>/)
      .expect(/<div.*class="sidebar".*<\/div>/)
      .expect(/<footer>.*<\/footer>/) 
      .expect(200, done);
  });
});
