**This document is out-of-date. See [`lib/monitoring/monitor.js`](https://github.com/benschmaus/nodeload/tree/master/lib/monitoring/monitor.js), [`lib/monitoring/monitorgroup.js`](https://github.com/benschmaus/nodeload/tree/master/lib/monitoring/monitorgroup.js), and [`lib/monitoring/collectors.js`](https://github.com/benschmaus/nodeload/tree/master/lib/monitoring/collectors.js).**

## Monitoring ##

`TEST_MONITOR` is an EventEmitter that emits 'update' events at regular intervals. This allows tests to be introspected for things like statistics gathering, report generation, etc. See `monitor.js`.

To set the interval between 'update' events:

    var nl = require('./lib/nodeloadlib').setMonitorIntervalMs(seconds)

**Events:**

* `TEST_MONITOR.on('test', callback(test))`: `addTest()` was called. The newly created test is passed to `callback`.
* `TEST_MONITOR.on('start', callback(tests))`: `startTests()` was called. The list of tests being started is passed to `callback`.
* `TEST_MONITOR.on('end', callback(tests))`: All tests finished.
* `TEST_MONITOR.on('update', callback(tests))`: Emitted at regular intervals while tests are running. Default is every 2 seconds. `nodeloadlib` uses this event internally to track statistics and generate the summary webpage.
* `TEST_MONITOR.on('afterUpdate', callback(tests))`: Emitted after the 'update' event. 

**Usage**:

    nl.TEST_MONITOR.on('update', function(tests) { 
        for (var i in tests) {
            console.log(JSON.stringify(tests[i].stats['latency'].summary()))
        }
    });

## HTTP-specific Monitors ##

A collection of wrappers for `requestLoop` functions that record statistics for HTTP requests. These functions can be run scheduled with `SCHEDULER` or run with a `ConditionalLoop`. See `evloops.js`.

**Functions:**

* `monitorLatenciesLoop(latencies, fun)`: Call `fun()` and put the execution duration in `latencies`, which should be a `Histogram`.
* `monitorResultsLoop(results, fun)`: Call `fun()` and put the HTTP response code in `results`, which should be a `ResultsCounter`.
* `monitorByteReceivedLoop(bytesReceived, fun)`: Call `fun()` and put the number of bytes received in `bytesReceived`, usually an `Accumulator`.
* `monitorConcurrencyLoop(concurrency, fun)`: Call `fun()` and put the number of "threads" currently executing it into `concurrency`, usually a `Peak`.
* `monitorRateLoop(rate, fun)`: Call `fun()` and notify `rate`, which should be a `Rate`, that it was called.
* `monitorHttpFailuresLoop(successCodes, fun, log)`: Call `fun()` and put the HTTP request and response into `log`, which should be a `LogFile`, for every request that does not return an HTTP status code included in the list `successCodes`.
* `monitorUniqueUrlsLoop(uniqs, fun)`: Call `fun()` and put the HTTP request path into `uniqs`, which should be a `Uniques`.
* `loopWrapper(fun, start, finish)`: Create a custom loop wrapper by specifying a functions to execute before and after calling `fun()`.

**Usage:**

All of these wrappers return a `function(loopFun, args)` which can be used by `SCHEDULER` and `ConditionalLoop`. The underlying function should have the same signature and execute an HTTP request. It must call `loopFun({req: http.ClientRequest, res: http.ClientResponse})` when it completes the request.

Example:

    // Issue GET requests to random objects at localhost:8080/data/obj-{0-1000} for 1 minute and
    // track the number of unique URLs
    var uniq = new nl.Reportable(Uniques, 'Uniques');
    var loop = nl.LoopUtils.monitorUniqueUrlsLoop(uniq, function(loopFun, client) {
        var req = nl.traceableRequest(client, 'GET', '/data/obj-' + Math.floor(Math.random()*1000));
        req.on('response', function(res) {
            loopFun({req: req, res: res});
        });
        req.end();
    });
    SCHEDULER.schedule({
        fun: loop,
        args: http.createClient(8080, 'localhost'),
        duration: 60
    }).start(function() {
        console.log(JSON.stringify(uniq.summary()));
    });