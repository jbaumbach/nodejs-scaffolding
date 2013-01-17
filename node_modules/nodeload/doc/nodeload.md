The `nodeload` module contains a high level interface for constructing load tests for HTTP services. It also includes all of the other modules: [remote](https://github.com/benschmaus/nodeload/tree/master/doc/remote.md), [stats](https://github.com/benschmaus/nodeload/tree/master/doc/stats.md), [monitoring](https://github.com/benschmaus/nodeload/tree/master/doc/monitoring.md), [reporting](https://github.com/benschmaus/nodeload/tree/master/doc/reporting.md), [loop](https://github.com/benschmaus/nodeload/tree/master/doc/loop.md), and [http](https://github.com/benschmaus/nodeload/tree/master/doc/http.md).

# Quickstart

    $ cat > example.js <<EOF

        // This test will hit localhost:8080 with 20 concurrent connections for 10 minutes.
        var http = require('http'),
            nl = require('./nodeload');

        http.createServer(function (req, res) { res.writeHead(200); res.end(); }).listen(8080);
        console.log("Server to load test listening on 8080.");

        var loadtest = nl.run({
            name: 'Example',
            host: 'localhost',
            port: 9000,
            numClients: 20,
            timeLimit: 600,
            targetRps: 200,
            stats: ['latency', 'result-codes', { name: 'http-errors', successCodes: [200], log: 'http-errors.log' }],
            requestGenerator: function(client) {
                return client.request('GET', "/" + Math.floor(Math.random()*10000));
            }
        });
        loadtest.on('end', function() { process.exit(0); });

    EOF

    $ node example.js       ## while running, browse to http://localhost:8000
    Server to load test listening on 9000.
    ......Done.
    Shutdown HTTP server.

Browse to http://localhost:8000 during the test for graphs. Non-200 responses are logged to `http-errors.log`, `results-{timestamp}-stats.log` contains statistics, and the summary web page is written to `results-{timestamp}-summary.html`. Check out [examples/riaktest.ex.js](http://github.com/benschmaus/nodeload/blob/master/examples/riaktest.ex.js) for an example of a full read+write test.



# Configuration

Use the following functions when calling `require()` to alter nodeload's default behavior:

    var nl = require('nodeload')
                .quiet()                        // disable all console output
                .usePort(10000)                 // start HTTP server on port 10000. Default: 8000
                .disableServer()                // don't start the HTTP server
                .setMonitorIntervalMs(1000)     // emit 'update' events every second. Default: 2000
                .setAjaxRefreshIntervalMs(1000) // HTML page should update every second. Default: 2000
                .setSlaveUpdateIntervalMs(1000) // slaves check in every second in distributed tests. Default: 3000
                .disableLogs()                  // don't log anything to disk


# Interface

### Functions:

* `run(specs, ...)`: Run the defined tests (see **Test Definition** below).
* `createClient(...) / extendClient(...)`: Extends built-in node.js `http.createClient()` to track of request urls and bodies and to provide error recovery.

### Basic Usage:

A "test" represents requests being sent at a fixed rate over concurrent connections.  Tests are run by calling `run(spec, ...)`.  A parameters in test specification are detailed in **Test Definition** section below. Issue requests using one of three methods:

* Define `method`, `path`, and `requestData`, leaving `requestGenerator` and `requestLoop` as `null`.

* Set `requestGenerator` to a `function(http.Client) -> http.ClientRequest`.  Requests returned by this function are executed by `nodeload`.  For example, you can GET random URLs using a `requestGenerator`:

        nl.run({
            requestGenerator: function(client) {
                client.request(client, 'GET', '/resource-' + Math.floor(Math.random()*10000));
            }
        });

* Set `requestLoop` to a `function(finished, http.Client)` which calls `finished({req: http.ClientRequest, res: http.ClientResponse})` after each request completes.  This is the most flexibile, but the function must be sure to call `finished()`.  For example, issue `PUT` requests with proper `If-Match` headers using a `requestLoop`:

        nl.run({
            requestLoop: function(finished, client) {
                var req = client.request('GET', '/resource');
                req.on('response', function(res) {
                    if (res.statusCode !== 200 && res.statusCode !== 404) {
                        finished({req: req, res: res});
                    } else {
                        var headers = res.headers['etag'] ? {'if-match': res.headers['etag']} : {};
                        req = client.request('PUT', '/resource', headers);
                        req.on('response', function(res) {
                            finished({req: req, res: res});
                        });
                        req.end("new value");
                    }
                });
                req.end();
            }
        });

Check out [examples/riaktest.ex.js](http://github.com/benschmaus/nodeload/blob/master/examples/riaktest.ex.js) for an example of a full read+write test.

### Events:

`run()` returns a `nl.LoadTest` object, which emits these events:

* `'update', interval, stats`:

    `interval` and `stats` both contains { 'test-name': { 'statistic-name': StatsObject } }. e.g.

        {
            'Read': {
                'latency': [object stats.Histogram],
                'result-codes': [object stats.ResultsCounter]
            }
        }

    `interval` contains the statistics gathered since the last `'update'` event. `stats` contains cumulative statistics since the beginning of the test.

    Set the frequency of 'update' events in milliseconds by changing loadtest.updateInterval.

* 'end': all tests finished


### Load and User Profiles:

Profiles can be used to adjust the load and number of users (concurrency) during a load test. The following will linearly ramp up from 0 to 100 req/sec over the first 10 seconds and ramp back down to 0 in the last 10 seconds. It will also ramp up from 0 to 10 users over the first 10 seconds.

    nl.run({
        timeLimit: 40,
        loadProfile: [[0,0], [10, 100], [30, 100], [39, 0]],
        userProfile: [[0,0], [20, 10]],
    });


### Other options:

The global HTTP server will automatically shutdown after `run(...)` finishes and emits the `'end'` event. This allows the process to terminate after the load test finishes if nothing else is running. To keep the server running, set keepAlive:

    var loadtest = nl.run(...);
    loadtest.keepAlive = true;

### Test Definition:

The following object defines the parameters and defaults for a test, which is used by `run()`:

    var TEST_OPTIONS = {
        name: 'Debug test',                     // A descriptive name for the test

                                                // Specify one of:
        host: 'localhost',                      //   1. (host, port) to connect to via HTTP
        port: 8080,                             //
                                                //
        connectionGenerator: undefined,         //   2. connectionGenerator(), called once for each user. 
                                                //      The return value is passed as-is to requestGenerator,
                                                //      requestLoop, or used internally to generate requests
                                                //      when using (method + path + requestData).

                                                // Specify one of:
        requestGenerator: undefined,            //   1. requestGenerator: a function
                                                //         function(http.Client) ->  http.ClientRequest
        requestLoop: undefined,                 //   2. requestLoop: is a function
                                                //         function(loopFun, http.Client)
        method: 'GET',                          //     If must call:
        path: '/',                              //         loopFun({
        requestData: undefined,                 //             req: http.ClientRequest, 
                                                //             res: http.ClientResponse});
                                                //     after each transaction to finishes to schedule the 
                                                //     next iteration of requestLoop.
                                                //   3. (method + path + requestData) specify a single URL to
                                                //     test
                                                //

                                                // Specify one of:
        numUsers: 10,                           //   1. numUsers: number of virtual users concurrently
                                                //      executing therequest loop
        loadProfile: undefined,                 //   2. loadProfile: array with requests/sec over time:
                                                //        [[time (seconds), rps], [time 2, rps], ...]
                                                //      For example, ramp up from 100 to 500 rps and then
                                                //      down to 0 over 20 seconds:
                                                //        [[0, 100], [10, 500], [20, 0]]

                                                // Specify one of:
        targetRps: Infinity,                    //   1. targetRps: times per second to execute request loop
        userProfile: undefined,                 //   2. userProfile: array with number of users over time:
                                                //        [[time (seconds), # users], [time 2, users], ...]
                                                //      For example, ramp up from 0 to 100 users and back
                                                //      down to 0 over 20 seconds:
                                                //        [[0, 0], [10, 100], [20, 0]]

        numRequests: Infinity,                  // Maximum number of iterations of request loop
        timeLimit: 120,                         // Maximum duration of test in seconds
        delay: 0,                               // Seconds before starting test

        stats: ['latency',                      // Specify list of: 'latency', 'result-codes', 'uniques', 
                'result-codes'],                // 'concurrency', 'http-errors'. These following statistics
                                                // may also be specified with parameters:
                                                //
                                                //     { name: 'latency', percentiles: [0.9, 0.99] }
                                                //     { name: 'http-errors', successCodes: [200,404], log: 'http-errors.log' }
                                                //
                                                // Extend this list of statistics by adding to the
                                                // monitor.js#Monitor.Monitors object.
                                                //
                                                // Note:
                                                // - for 'uniques', traceableRequest() must be used
                                                //   to create the ClientRequest or only 2 will be detected.
    };