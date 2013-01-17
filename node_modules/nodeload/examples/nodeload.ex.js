#!/usr/bin/env node

/*jslint sub:true */

var http = require('http'),
    nl = require('../nodeload');

var svr = http.createServer(function (req, res) {
    res.writeHead((Math.random() < 0.8) ? 200 : 404, {'Content-Type': 'text/plain'});
    res.end(req.url);
});
svr.listen(9000);
console.log('Started test server.');

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
            return client.request('GET', "/" + Math.floor(Math.random()*8000), { 'host': 'localhost', 'connection': 'keep-alive' });
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
            var request = client.request('PUT', "/" + Math.floor(Math.random()*8000), { 'host': 'localhost', 'connection': 'keep-alive' });
            request.end('foo');
            return request;
        }
    },
    cleanup = {
        name: "Cleanup",
        host: 'localhost',
        port: 9000,
        numUsers: 50,
        numRequests: 8001,
        stats: ['result-codes'],
        requestGenerator: function(client) {
            return client.request('DELETE', "/" + i++, { 'host': 'localhost', 'connection': 'keep-alive' });
        }
    },
    loadtest = nl.run(readtest, writetest);

loadtest.updateInterval = 1000;
loadtest.on('end', function() {
    loadtest = nl.run(cleanup);
    loadtest.on('end', function() {
        console.log('Closing test server.');
        svr.close();
        process.exit(0);
    });
});
