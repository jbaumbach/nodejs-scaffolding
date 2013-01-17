/*jslint sub:true */

var assert = require('assert'),
    http = require('http'),
    EventEmitter = require('events').EventEmitter,
    util = require('../lib/util'),
    monitoring = require('../lib/monitoring'),
    Monitor = monitoring.Monitor,
    MonitorGroup = monitoring.MonitorGroup;

var svr = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(req.url);
});
svr.listen(9000);
setTimeout(function() { svr.close(); }, 1000);

function mockConnection(callback) {
    var conn = { 
        operation: function(opcallback) { 
            setTimeout(function() { opcallback(); }, 25);
        }
    };
    setTimeout(function() { callback(conn); }, 75);
}

module.exports = {
    'example: track runtime of a function': function(beforeExit) {
        var m = new Monitor('runtime'),
            f = function() {
                var ctx = m.start(), runtime = Math.floor(Math.random() * 100);
                setTimeout(function() { ctx.end(); }, runtime);
            };

        for (var i = 0; i < 20; i++) { 
            f();
        }
        
        beforeExit(function() {
            var summary = m.stats['runtime'] && m.stats['runtime'].summary();
            assert.ok(summary);
            assert.equal(m.stats['runtime'].length, 20);
            assert.ok(summary.min >= 0 && summary.min < 100);
            assert.ok(summary.max > 0 && summary.max <= 100);
            assert.ok(summary.median > 0 && summary.median < 100);
        });
    },
    'example: use a MonitorGroup to organize multiple Monitors': function(beforeExit) {
        var m = new MonitorGroup('runtime'),
            f = function() {
                var transactionCtx = m.start('transaction');
                mockConnection(function(conn) {
                    var operationCtx = m.start('operation');
                    conn.operation(function() {
                        operationCtx.end();
                        transactionCtx.end();
                    });
                });
            };

        for (var i = 0; i < 10; i++) { 
            f();
        }
        
        beforeExit(function() {
            var summary = m.interval.summary();
            assert.ok(summary);
            assert.ok(summary['transaction'] && summary['transaction']['runtime']);
            assert.ok(summary['operation'] && summary['operation']['runtime']);
            assert.ok(Math.abs(summary['transaction']['runtime'].median - 100) <= 10, summary['transaction']['runtime'].median.toString());
            assert.ok(Math.abs(summary['operation']['runtime'].median - 25) <= 5);
        });
    },
    'example: use EventEmitter objects instead of interacting with MonitorGroup directly': function(beforeExit) {
        function MonitoredObject() {
            EventEmitter.call(this);
            var self = this;
            self.run = function() {
                self.emit('start', 'transaction');
                mockConnection(function(conn) {
                    self.emit('start', 'operation');
                    conn.operation(function() {
                        self.emit('end', 'operation');
                        self.emit('end', 'transaction');
                    });
                });
            };
        }
        util.inherits(MonitoredObject, EventEmitter);

        var m = new MonitorGroup('runtime');
        for (var i = 0; i < 5; i++) {
            var obj = new MonitoredObject();
            m.monitorObjects(obj);
            setTimeout(obj.run, i * 100);
        }
        
        beforeExit(function() {
            var trSummary = m.stats['transaction'] && m.stats['transaction']['runtime'] && m.stats['transaction']['runtime'].summary();
            var opSummary = m.stats['operation'] && m.stats['operation']['runtime'] && m.stats['operation']['runtime'].summary();
            assert.ok(trSummary);
            assert.ok(opSummary);
            assert.equal(m.stats['transaction']['runtime'].length, 5);
            assert.ok(Math.abs(trSummary.median - 100) <= 5, '100 == ' + trSummary.median);
            assert.ok(Math.abs(opSummary.median - 25) <= 5, '25 == ' + opSummary.median);
        });
    },
    'use EventEmitter objects with Monitor': function(beforeExit) {
        function MonitoredObject() {
            EventEmitter.call(this);
            var self = this;
            self.run = function() {
                self.emit('start');
                setTimeout(function() { self.emit('end'); }, Math.floor(Math.random() * 100));
            };
        }
        util.inherits(MonitoredObject, EventEmitter);

        var m = new Monitor('runtime');
        for (var i = 0; i < 5; i++) {
            var obj = new MonitoredObject();
            m.monitorObjects(obj);
            setTimeout(obj.run, i * 100);
        }
        
        beforeExit(function() {
            var summary = m.stats['runtime'] && m.stats['runtime'].summary();
            assert.ok(summary);
            assert.equal(m.stats['runtime'].length, 5);
            assert.ok(summary.min >= 0 && summary.min < 100, summary.min.toString());
            assert.ok(summary.max > 0 && summary.max <= 100, summary.max.toString());
            assert.ok(summary.median > 0 && summary.median < 100, summary.median.toString());
        });
    },
    'HTTP specific monitors': function(beforeExit) {
        var q = 0,
            m = new Monitor('result-codes', 'uniques', 'request-bytes', 'response-bytes', {name: 'header-code', header: 'content-type'}),
            client = http.createClient(9000, 'localhost'),
            f = function() {
                var ctx = m.start(),
                    path = '/search?q=' + q++,
                    req = client.request('GET', path, {'host': 'localhost'});
                req.path = path;
                req.end();
                req.on('response', function(res) {
                    ctx.end({req: req, res: res});
                });
            };
    
        for (var i = 0; i < 2; i++) {
            f();
        }
    
        beforeExit(function() {
            var resultCodesSummary = m.stats['result-codes'] && m.stats['result-codes'].summary(),
                uniquesSummary = m.stats['uniques'] && m.stats['uniques'].summary(),
                requestBytesSummary = m.stats['request-bytes'] && m.stats['request-bytes'].summary(),
                responseBytesSummary = m.stats['response-bytes'] && m.stats['response-bytes'].summary(),
                headerCodeSummary = m.stats['header-code'] && m.stats['header-code'].summary();
    
            assert.ok(resultCodesSummary);
            assert.ok(uniquesSummary);
            assert.ok(requestBytesSummary);
            assert.ok(responseBytesSummary);
                
            assert.equal(resultCodesSummary.total, 2);
            assert.equal(resultCodesSummary['200'], 2);

            assert.equal(headerCodeSummary['text/plain'], 2);
            
            assert.equal(uniquesSummary.total, 2);
            assert.equal(uniquesSummary.uniqs, 2);
    
            assert.ok(requestBytesSummary.total > 0);
    
            assert.ok(responseBytesSummary.total > 20);
        });
    },
    'monitor generates update events with interval and overall stats': function(beforeExit) {
        var m = new Monitor('runtime'),
            intervals = 0,
            f = function() {
                var ctx = m.start(), runtime = Math.floor(Math.random() * 10);
                setTimeout(function() { ctx.end(); }, runtime);
            };
        
        m.updateInterval = 220;
        
        // Call to f every 100ms for a total runtime >500ms
        for (var i = 1; i <= 5; i++) {
            setTimeout(f, i*100);
        }
        
        // Disable 'update' events after 500ms so that this test can complete
        setTimeout(function() { m.updateInterval = 0; }, 510);

        m.on('update', function(interval, overall) { 
            assert.strictEqual(overall, m.stats);

            assert.ok(interval['runtime']);
            assert.equal(interval['runtime'].length, 2);
            assert.ok(interval['runtime'].mean() > 0 && interval['runtime'].mean() < 10);
            assert.ok(interval['runtime'].mean() > 0 && interval['runtime'].mean() < 10);
            intervals++;
        });
        
        beforeExit(function() {
            assert.equal(intervals, 2, 'Got incorrect number of update events: ' + intervals);
            assert.equal(m.stats['runtime'].length, 5);
        });
    }
};

process.setMaxListeners(20);