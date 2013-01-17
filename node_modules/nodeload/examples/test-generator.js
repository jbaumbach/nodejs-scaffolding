var http = require('http');
var sys = require('sys');
exports.getRequest = function(client) {
    //sys.debug('running request generator');
    // Generate a request for the server being server being tested.
    // (Normally you'd do something more interesting here, like generating
    // a request path for a range of objects.)
    var req = client.request('GET', '/', { 'host': 'localhost' });
    return req;
}
