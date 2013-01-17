var assert = require('assert'),
    http = require('http'),
    util = require('../lib/util');

module.exports = {
    'ReconnectingClient tolerates connection failures': function(beforeExit) {
        var PORT = 9010, 
            simpleResponse = function (req, res) { res.writeHead(200); res.end(); },
            svr = http.createServer(simpleResponse),
            client = util.createReconnectingClient(PORT, 'localhost'),
            numResponses = 0,
            clientErrorsDetected = 0,
            req, testTimeout;

        // reconnecting client should work like a normal client and get a response from our server
        svr.listen(PORT);
        req = client.request('GET', '/');
        assert.isNotNull(req);
        req.on('response', function(res) {
            numResponses++;
            res.on('end', function() {
                // once the server is terminated, request() should cause a clientError event (below)
                svr = svr.close();
                req = client.request('GET','/');
                
                client.once('reconnect', function() {
                    // restart server, and request() should work again
                    svr = http.createServer(simpleResponse);
                    svr.listen(PORT);

                    req = client.request('GET','/');
                    req.end();
                    req.on('response', function(res) {
                        clearTimeout(testTimeout);

                        numResponses++;
                        svr = svr.close();
                    });
                });
            });
        });
        client.on('error', function(err) { clientErrorsDetected++; });
        req.end();
        
        // Maximum timeout for this test is 1 second
        testTimeout = setTimeout(function() { if (svr) { svr.close(); } }, 2000);

        beforeExit(function() {
            assert.equal(clientErrorsDetected, 1);
            assert.equal(numResponses, 2);
        });
    },
};
