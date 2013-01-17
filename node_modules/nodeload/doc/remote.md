**This document is out-of-date. See [`lib/remote/remotetesting.js`](https://github.com/benschmaus/nodeload/tree/master/lib/remote/remotetesting.js) and [`lib/remote/cluster.js`](https://github.com/benschmaus/nodeload/tree/master/lib/remote/cluster.js).**

## Distributed Testing ##

Functions to distribute tests across multiple slave `nodeload` instances. See `remote.js`.

**Functions:**

* `remoteTest(spec)`: Return a test to be scheduled with `remoteStart(...)` (`spec` uses same format as `addTest(spec)`).
* `remoteStart(master, slaves, tests, callback, stayAliveAfterDone)`: Run tests on specified slaves.
* `remoteStartFile(master, slaves, filename, callback, stayAliveAfterDone)`: Execute a `.js` file on specified slaves.

**Usage**:

First, start `nodeloadlib.js` on each slave instances.

    $ node dist/nodeloadlib.js       # Run on each slave machine

Then, create tests using `remoteTest(spec)` with the same `spec` fields in the **Test Definition** section above. Pass the created tests as a list to `remoteStart(...)` to execute them on slave `nodeload` instances. `master` must be the `"host:port"` of the `nodeload` which runs `remoteStart(...)`. It will receive and aggregate statistics from the slaves, so the address should be reachable by the slaves. Or, use `master=null` to disable reports from the slaves.

    // This script must be run on master:8000, which will aggregate results. Each slave 
    // will GET http://internal-service:8080/ at 100 rps.
    var t1 = nl.remoteTest({
        name: "Distributed test",
        host: 'internal-service',
        port: 8080,
        timeLimit: 20,
        targetRps: 100
    });
    nl.remoteStart('master:8000', ['slave1:8000', 'slave2:8000', 'slave3:8000'], [t1]);

Alternatively, an existing `nodeload` script file can be used:

    // The file /path/to/load-test.js should contain valid javascript and can use any nodeloadlib functions
    nl.remoteStartFile('master:8000', ['slave1:8000', 'slave2:8000', 'slave3:8000'], '/path/to/load-test.js');

When the remote tests complete, the master instance will call the `callback` parameter if non-null. It then automatically terminates after 3 seconds unless the parameter `stayAliveAfterDone==true`.