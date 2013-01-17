**This document is out-of-date. See [`lib/loop/loop.js`](https://github.com/benschmaus/nodeload/tree/master/lib/loop/loop.js) and [`lib/loop/multiloop.js`](https://github.com/benschmaus/nodeload/tree/master/lib/loop/multiloop.js).**

## Function Scheduler ##

The `SCHEDULER` object allows a function to be called at a desired rate and concurrency level. See `scheduler.js`.
**Functions:**

* `SCHEDULER.schedule(spec)`: Schedule a function to be executed (see the **Schedule Definition** below)
* `SCHEDULER.startAll(callback)`: Start running all the scheduled functions and execute callback when they complete
* `SCHEDULER.startSchedule(callback)`: Start a single scheduled function and execute callback when it completes
* `funLoop(fun)`: Wrap functions that do not perform IO so they can be used with SCHEDULER

**Usage**:

Call `SCHEDULER.schedule(spec)` to add a job. `spec.fun` must be a `function(loopFun, args)` and call `loopFun(results)` when it completes. Call `SCHEDULER.startAll()` to start running all scheduled jobs.

If `spec.argGenerator` is non-null, it is called `spec.concurrency` times on startup. One return value is passed as the second parameter to each concurrent execution of `spec.fun`.  If null, the value of `spec.args` is passed to all executions of `spec.fun` instead.

A scheduled job finishes after its target duration or it has been called the maximum number of times. `SCHEDULER` stops *all* jobs once all *monitored* jobs finish. For example, 1 monitored job is scheduled for 5 seconds, and 2 unmonitored jobs are scheduled with no time limits. `SCHEDULER` will start all 3 jobs when `SCHEDULER.startAll()` is called, and stop all 3 jobs 5 seconds later.  Unmonitored jobs are useful for running side processes such as statistics gathering and reporting.

Example:

    var t = 1;
    nl.SCHEDULER.schedule({
        fun: nl.LoopUtils.funLoop(function(i) { console.log("Thread " + i) }),
        argGenerator: function() { return t++; },
        concurrency: 5,
        rps: 10,
        duration: 10
    });
    nl.SCHEDULER.startAll(function() { sys.puts("Done.") });

Alternatively, a Job can started independently. A Job instance is analogous to a single thread, and does not understand the `concurrency` parameter.

    var i = 0;
    var job = new nl.Job({
        fun: nl.LoopUtils.funLoop(function() { console.log(i++) }),
        rps: 10,
        duration: 10
    }).start();

**Job Definition**: The following object defines the parameters and defaults for a job run by `SCHEDULER`:

    var JOB_DEFAULTS = {
        fun: null,                  // A function to execute which accepts the parameters (loopFun, args).
                                    // The value of args is the return value of argGenerator() or the args
                                    // parameter if argGenerator is null. The function must call 
                                    // loopFun(results) when it completes.
        argGenerator: null,         // A function which is called once when the job is started. The return
                                    // value is passed to fun as the "args" parameter. This is useful when
                                    // concurrency > 1, and each "thread" should have its own args.
        args: null,                 // If argGenerator is NOT specified, then this is passed to the fun as "args".
        concurrency: 1,             // Number of concurrent calls of fun()
        rps: Infinity,              // Target number of time per second to call fun()
        duration: Infinity,         // Maximum duration of this job in seconds
        numberOfTimes: Infinity,    // Maximum number of times to call fun()
        delay: 0,                   // Seconds to wait before calling fun() for the first time
        monitored: true             // Does this job need to finish in order for SCHEDULER.startAll() to end?
    };


## Event-based loops ##

The `ConditionalLoop` class provides a generic way to write a loop where each iteration is scheduled using `process.nextTick()`. This allows many long running "loops" to be executed concurrently by `node.js`. See `evloops.js`.

**Functions:**

* `ConditionalLoop(fun, args, conditions, delay):` Defines a loop (see **Loop Definition** below)
* `ConditionalLoop.start(callback):` Starts executing and call `callback` on termination
* `ConditionalLoop.stop():` Terminate the loop
* `LoopConditions.timeLimit(seconds)`, `LoopConditions.maxExecutions(numberOfTimes)`: useful ConditionalLoop conditions
* `LoopUtils.rpsLoop(rps, fun)`: Wrap a `function(loopFun, args)` so ConditionalLoop calls it a set rate
* `LoopUtils.funLoop(fun)`: Wrap a linearly executing `function(args)` so it can be used with a ConditionalLoop 

**Usage:**

Create a `ConditionalLoop` instance and call `ConditionalLoop.start()` to execute the loop. A function given to `ConditionalLoop` must be a `function(loopFun, args)` which ends by calling `loopFun()`.

The `conditions` parameter is a list of functions. When any function returns `false`, the loop terminates. For example, the functions `LoopConditions.timeLimit(seconds)` and `LoopConditions.maxExecutions(numberOfTimes)` are conditions that limit the duration and number of iterations of a loop respectively.

The loop also terminates if `ConditionalLoop.stop()` is called.

Example:

    var fun = function(loopFun, startTime) {
        console.log("It's been " + (new Date() - startTime) / 1000 + " seconds");
        loopFun();
    };
    var stopOnFriday = function() {
        return (new Date()).getDay() < 5;
    }
    var loop = new nl.ConditionalLoop(nl.LoopUtils.rpsLoop(1, fun), new Date(), [stopOnFriday, nl.LoopConditions.timeLimit(604800 /*1 week*/)], 1);
    loop.start(function() { console.log("It's Friday!") });

**Loop Definition:**

The `ConditionalLoop` constructor arguments are:

    fun: Function that takes parameters (loopFun, args) and calls loopFun() after each iteration
    args: The args parameter to pass to fun
    conditions: A list of functions representing termination conditions. Terminate when any function returns `false`.
    delay: Seconds to wait before starting the first iteration