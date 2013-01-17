#!/usr/bin/env node

// Instructions:
// 
// 1. Get node (http://nodejs.org/#download)
// 2. git clone http://github.com/benschmaus/nodeload.git
// 3. examples/riaktest.ex.js
//
// This example performs a micro-benchmark of Riak (http://riak.basho.com/), a key-value store,
// running on localhost:8098/riak. First, it first loads 2000 objects into the store as quickly
// as possible. Then, it performs a 90% read + 10% update test at total request rate of 300 rps.
// From minutes 5-8, the read load is increased by 100 rps. The test runs for 10 minutes.

var sys = require('sys'),
    nl = require('../nodeload');

function riakUpdate(loopFun, client, url, body) {
    var req = client.request('GET', url, { 'host': 'localhost' });
    req.on('response', function(res) {
        if (res.statusCode !== 200 && res.statusCode !== 404) {
            loopFun({req: req, res: res});
        } else {
            var headers = { 
                'host': 'localhost', 
                'content-type': 'text/plain', 
                'x-riak-client-id': 'bmxpYg=='
                };
            if (res.headers['x-riak-vclock']) {
                headers['x-riak-vclock'] = res.headers['x-riak-vclock'];
            }
                
            req = client.request('PUT', url, headers);
            req.on('response', function(res) {
                loopFun({req: req, res: res});
            });
            req.end(body);
        }
    });
    req.end();
}

var i=0;
var loadData = nl.run({
    name: "Load Data",
    host: 'localhost',
    port: 8098,
    numUsers: 20,
    numRequests: 2000,
    timeLimit: Infinity,
    stats: ['result-codes', 'latency', 'concurrency', 'uniques', { name: 'http-errors', successCodes: [204], log: 'http-errors.log' }],
    requestLoop: function(loopFun, client) {
        riakUpdate(loopFun, client, '/riak/b/o' + i++, 'original value');
    }
});

loadData.on('end', function() {
    console.log("Running read + update test.");
    
    var reads = {
            name: "Read",
            host: 'localhost',
            port: 8098,
            numUsers: 30,
            loadProfile: [[0,0],[20,270],[300,270],[480,370],[590,400],[599,0]], // Ramp up to 270, then up to 370, then down to 0
            timeLimit: 600,
            stats: ['result-codes', 'latency', 'concurrency', 'uniques', { name: 'http-errors', successCodes: [200,404], log: 'http-errors.log' }],
            requestGenerator: function(client) {
                var url = '/riak/b/o' + Math.floor(Math.random()*8000);
                return client.request('GET', url, { 'host': 'localhost' });
            }
        },
        writes = {
            name: "Write",
            host: 'localhost',
            port: 8098,
            numUsers: 5,
            timeLimit: 600,
            targetRps: 30,
            reportInterval: 2,
            stats: ['result-codes', 'latency', 'concurrency', 'uniques', { name: 'http-errors', successCodes: [204], log: 'http-errors.log' }],
            requestLoop: function(loopFun, client) {
                var url = '/riak/b/o' + Math.floor(Math.random()*8000);
                riakUpdate(loopFun, client, url, 'updated value');
            }
        };
    
    nl.run(reads, writes);
});