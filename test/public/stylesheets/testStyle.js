//
// Test that our style sheet(s) are being generated properly by the "Stylus" component 
// Also test "Nib" component.
//

var request = require('supertest')
  , myApp = require('../../../app.js');

var app = myApp.app();

describe('generated main stylesheet', function() {

  this.timeout(9000);

  it('should have Stylus global-reset functionality', function(done) {
    request(app)
      .get('/stylesheets/style.css')
      .expect(/body.?\{line-height.?:.?1;/)
      .expect(/((ol)+.?(ul)+|(ul)+.?(ol)+).?\{list-style.?:.?none.?\}/)
      .expect(200, done);
  });
  
  // 
  
  it('should have Nib adding vendor-specific hacks for us', function(done) {
    request(app)
      .get('/stylesheets/style.css')
      .expect(/-webkit-border-radius.?:.?[0-9]?px.?;/)
      .expect(200, done);
  });

});
