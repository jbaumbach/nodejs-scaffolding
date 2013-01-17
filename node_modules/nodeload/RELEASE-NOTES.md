## v0.4.0 (HEAD) ##

Compatible with node v0.4.x

Features:

* Add graphJmx() and graphProcess(); deprecate spawnAndMonitor(). These provide an easy way to graph JMX attributes as well as output from external processes, such as iostat.
* More readable date strings are used in log files names
* rps is a separate stat from result codes
* Test Results page timestamp does not auto-update on open
* X-axes now use real timestamps rather than minutes since test start

## v0.3.0 (2011/06/16) ##

Compatible with node v0.3.x

Features:

* Add /console/console.html, a jQuery based UI for connecting to multiple nodeload instances simultaneously
* jmxstat/jmxstat.jar allows command line polling of JMX attributes. Combined with reporting.spawnAndMonitor(), Java processes can be monitored during load tests.
* Add 'header-code' statistic which counts number of responses with different values for a given header. For instance, this can be used to graph cache misses/hits from Squid responses using the X-Cache header.

Bug Fixes:

* config: Add 'nodeload/config' module for configuring global parameters
* multiloop: polling time for next change in load or user profiles was always 1 second
* stats: Fix one-off error in Histogram.percentile wouldn't return the greatest number if it is greater than the number of buckets (i.e. in extra[]). Fix Uniques.clear() to actually reset count.
* nl.js: #issue/5: nl.js discarded URL query string and hash

## v0.2.0 (2010/12/01) ##

This release is a substantial, non-backwards-compatible rewrite of nodeload. The major features are:

* [npm](http://npmjs.org/) compatibility
* Independently usable modules: loop, stats, monitoring, http, reporting, and remote
* Addition of load and user profiles

Specific changes to note are:

* npm should be used to build the source

        [~/nodeload]> curl http://npmjs.org/install.sh | sh     # install npm if not already installed
        [~/nodeload]> npm link

* `nodeload` is renamed to `nl` and `nodeloadlib` to `nodeload`.

* addTest() / addRamp() / runTest() is replaced by run():

        var nl = require('nodeload');
        var loadtest = nl.run({ ... test specications ... }, ...);

* remoteTest() / remoteStart() is replaced by LoadTestCluster.run:

        var nl = require('nodeload');
        var cluster = new nl.LoadTestCluster(master:port, [slaves:port, ...]);
        cluster.run({ ... test specifications ...});

* Callbacks and most of the globals (except `HTTP_SERVER` and `REPORT_MANAGER`) have been removed. Instead EventEmitters are used throughout. For example, run() returns an instance of LoadTest, which emits 'update' and 'end' events, replacing the need for both `TEST_MONITOR` and the startTests() callback parameter.

* Scheduler has been replaced by MultiLoop, which also understands load & concurrency profiles.

* Statistics tracking works through event handlers now rather than by wrapping the loop function. See monitoring/monitor.js.

## v0.100.0 (2010/10/06) ##

This release adds nodeloadlib and moves to Dygraph for charting.

## v0.1.0 to v0.1.2 (2010/02/27) ##

Initial releases of nodeload. Tags correspond to node compatible versions. To find a version of node that's compatible with a tag release do `git show <tagname>`.

    For example: git show v0.1.1
