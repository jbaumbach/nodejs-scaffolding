#!/usr/bin/env node

var http = require('http'),
    nl = require('../nodeload');

// Start a local HTTP server that we can load test
var svr = http.createServer(function (req, res) {
    res.writeHead((Math.random() < 0.8) ? 200 : 404, {'Content-Type': 'text/plain'});
    res.end(req.url);
});
svr.listen(9000);
console.log('Started test server.');

// Define the tests and nodeload cluster
var i = 0,
    readtest = {
        name: "Read",
        host: 'localhost',
        port: 9000,
        timeLimit: 40,
        loadProfile: [[0,0], [10, 100], [30, 100], [39, 0]],
        userProfile: [[0,0], [20, 10]],
        stats: ['result-codes', {name: 'latency', percentiles: [0.95, 0.999]}, 'concurrency', 'uniques', 'request-bytes', 'response-bytes'],
        requestGenerator: function(client) {
            var request = client.request('GET', "/" + Math.floor(Math.random()*8000), { 'host': 'localhost' });
            request.end();
            return request;
        }
    },
    writetest = {
        name: "Write",
        host: 'localhost',
        port: 9000,
        numUsers: 10,
        timeLimit: 40,
        targetRps: 20,
        stats: ['result-codes', 'latency', 'uniques'],
        requestGenerator: function(client) {
            var request = client.request('PUT', "/" + Math.floor(Math.random()*8000), { 'host': 'localhost' });
            request.end('foo');
            return request;
        }
    },
    cluster = new nl.LoadTestCluster('localhost:8000', ['localhost:8002', 'localhost:8001']);

// Start the cluster
cluster.run(readtest, writetest);
cluster.on('end', function() {
    console.log('All tests complete.');
    process.exit(0);
});