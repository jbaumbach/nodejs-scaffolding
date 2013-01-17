var assert = require('assert'),
    http = require('http'),
    nlconfig = require('../lib/config').disableServer(),
    HttpServer = require('../lib/http').HttpServer;

var server = new HttpServer().start(9020);
setTimeout(function() { server.stop(); }, 1500);

module.exports = {
    'example: add a new route': function(beforeExit) {
        var done = false;
        server.addRoute('^/route', function(url, req, res) {
            done = true;
            res.end();
        });

        var client = http.createClient(9020, '127.0.0.1'),
            req = client.request('GET', '/route/item');
        req.end();
        
        beforeExit(function() {
            assert.ok(done, 'Never got request to /route');
        });
    },
    'test file server finds package.json': function(beforeExit) {
        var done = false;
        var client = http.createClient(9020, '127.0.0.1'),
            req = client.request('GET', '/package.json');
        req.end();
        req.on('response', function(res) {
            assert.equal(res.statusCode, 200);
            res.on('data', function(chunk) {
                done = true;
            });
        });

        beforeExit(function() {
            assert.ok(done, 'Never got response data from /package.json');
        });
    },
};
