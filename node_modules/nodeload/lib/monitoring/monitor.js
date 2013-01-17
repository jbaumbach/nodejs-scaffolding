// -----------------
// Monitor
// -----------------
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var util = require('../util');
var StatsCollectors = require('./collectors');
var StatsLogger = require('./statslogger').StatsLogger;
var EventEmitter = require('events').EventEmitter;
}

/** Monitor is used to track code statistics of code that is run multiple times or concurrently:

     var monitor = new Monitor('runtime');
     function f() {
         var m = monitor.start();
         doSomethingAsynchronous(..., function() {
             m.end();
         });
     }
     ...
     console.log('f() median runtime (ms): ' + monitor.stats['runtime'].percentile(.5));

Look at monitoring.test.js for more examples.

Monitor can also emits periodic 'update' events with overall and statistics since the last 'update'. This
allows the statistics to be introspected at regular intervals for things like logging and reporting. Set
Monitor.updateInterval to enable 'update' events.

@param arguments contain names of the statistics to track. Add additional statistics to collectors.js.
*/
var Monitor = exports.Monitor = function Monitor() { // arguments 
    EventEmitter.call(this);
    util.PeriodicUpdater.call(this); // adds updateInterval property and calls update()
    this.targets = [];
    this.setStats.apply(this, arguments);
};

util.inherits(Monitor, EventEmitter);

/** Set the statistics this monitor should gather. */
Monitor.prototype.setStats = function(stats) { // arguments contains stats names
    var self = this,
        summarizeStats = function() {
            var summary = {ts: new Date()};
            if (self.name) { summary.name = self.name; }
            util.forEach(this, function(statName, stats) {
                summary[statName] = stats.summary();
            });
            return summary;
        };

    self.collectors = [];
    self.stats = {};
    self.interval = {};
    stats = (stats instanceof Array) ? stats : Array.prototype.slice.call(arguments);
    stats.forEach(function(stat) {
        var name = stat, params;
        if (typeof stat === 'object') {
            name = stat.name;
            params = stat;
        }
        var Collector = StatsCollectors[name];
        if (!Collector) { 
            throw new Error('No collector for statistic: ' + name); 
        }
        if (!Collector.disableIntervalCollection) {
            var intervalCollector = new Collector(params);
            self.collectors.push(intervalCollector);
            self.interval[name] = intervalCollector.stats;
        }
        if (!Collector.disableCumulativeCollection) {
            var cumulativeCollector = new Collector(params);
            self.collectors.push(cumulativeCollector);
            self.stats[name] = cumulativeCollector.stats;
        }
    });
    
    Object.defineProperty(this.stats, 'summary', {
        enumerable: false,
        value: summarizeStats
    });
    Object.defineProperty(this.interval, 'summary', {
        enumerable: false,
        value: summarizeStats
    });
};

/** Called by the instrumented code when it begins executing. Returns a monitoring context. Call 
context.end() when the instrumented code completes. */
Monitor.prototype.start = function(args) {
    var self = this, 
        endFuns = [],
        doStart = function(m, context) {
            if (m.start) { m.start(context, args); }
            if (m.end) { 
                endFuns.push(function(result) { return m.end(context, result); }); 
            }
        },
        monitoringContext = {
            end: function(result) {
                endFuns.forEach(function(f) { f(result); });
            }
        };
    
    self.collectors.forEach(function(m) { doStart(m, {}); });
    return monitoringContext;
};

/** Monitor a set of EventEmitter objects, where each object is analogous to a thread. The objects
should emit 'start' and 'end' when they begin doing the operation being instrumented. This is useful
for monitoring concurrently executing instances of loop.js#Loop. 

Call either as monitorObjects(obj1, obj2, ...) or monitorObjects([obj1, obj2, ...], 'start', 'end') */
Monitor.prototype.monitorObjects = function(objs, startEvent, endEvent) {
    var self = this;
    
    if (!(objs instanceof Array)) {
        objs = util.argarray(arguments);
        startEvent = endEvent = null;
    }

    startEvent = startEvent || 'start';
    endEvent = endEvent || 'end';

    objs.forEach(function(o) {
        var mon;
        o.on(startEvent, function(args) {
            mon = self.start(args);
        });
        o.on(endEvent, function(result) {
            mon.end(result);
        });
    });

    return self;
};

/** Set the file name or stats.js#LogFile object that statistics are logged to; null for default */
Monitor.prototype.setLogFile = function(logNameOrObject) {
    this.logNameOrObject = logNameOrObject;
};

/** Log statistics each time an 'update' event is emitted? */
Monitor.prototype.setLoggingEnabled = function(enabled) {
    if (enabled) {
        this.logger = this.logger || new StatsLogger(this, this.logNameOrObject).start();
    } else if (this.logger) {
        this.logger.stop();
        this.logger = null;
    }
    return this;
};

/** Emit the 'update' event and reset the statistics for the next window */
Monitor.prototype.update = function() {
    this.emit('update', this.interval, this.stats);
    util.forEach(this.interval, function(name, stats) {
        if (stats.length > 0) {
            stats.clear();
        }
    });
};