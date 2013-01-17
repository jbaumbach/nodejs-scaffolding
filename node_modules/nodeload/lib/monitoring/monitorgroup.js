// -----------------
// MonitorGroup
// -----------------
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var util = require('../util');
var Monitor = require('./monitor').Monitor;
var StatsLogger = require('./statslogger').StatsLogger;
var EventEmitter = require('events').EventEmitter;
}

/** MonitorGroup represents a group of Monitor instances. Calling MonitorGroup('runtime').start('myfunction')
is equivalent to creating a Monitor('runtime') for myfunction and and calling start(). MonitorGroup can 
also emit regular 'update' events as well as log the statistics from the interval to disk.

@param arguments contain names of the statistics to track. Register more statistics by extending
                 Monitor.StatsCollectors. */
var MonitorGroup = exports.MonitorGroup = function MonitorGroup(statsNames) {
    EventEmitter.call(this);
    util.PeriodicUpdater.call(this);

    var summarizeStats = function() {
        var summary = {ts: new Date()};
        util.forEach(this, function(monitorName, stats) {
            summary[monitorName] = {};
            util.forEach(stats, function(statName, stat) {
                summary[monitorName][statName] = stat.summary();
            });
        });
        return summary;
    };

    this.statsNames = (statsNames instanceof Array) ? statsNames : Array.prototype.slice.call(arguments);
    this.monitors = {};
    this.stats = {};
    this.interval = {};
    
    Object.defineProperty(this.stats, 'summary', {
        enumerable: false,
        value: summarizeStats
    });
    Object.defineProperty(this.interval, 'summary', {
        enumerable: false,
        value: summarizeStats
    });
};

util.inherits(MonitorGroup, EventEmitter);

/** Pre-initialize monitors with the given names. This allows construction overhead to take place all at 
once if desired. */
MonitorGroup.prototype.initMonitors = function(monitorNames) {
    var self = this;
    monitorNames = (monitorNames instanceof Array) ? monitorNames : Array.prototype.slice.call(arguments);
    monitorNames.forEach(function(name) { 
        self.monitors[name] = new Monitor(self.statsNames);
        self.stats[name] = self.monitors[name].stats;
        self.interval[name] = self.monitors[name].interval;
    });
    return self;
};

/** Call .start() for the named monitor */
MonitorGroup.prototype.start = function(monitorName, args) {
    monitorName = monitorName || '';
    if (!this.monitors[monitorName]) {
        this.initMonitors([monitorName]);
    }
    return this.monitors[monitorName].start(args);
};

/** Like Monitor.monitorObjects() except each object's 'start' event should include the monitor name as
its first argument. See monitoring.test.js for an example. */
MonitorGroup.prototype.monitorObjects = function(objs, startEvent, endEvent) {
    var self = this, ctxs = {};

    if (!(objs instanceof Array)) {
        objs = util.argarray(arguments);
        startEvent = endEvent = null;
    }

    startEvent = startEvent || 'start';
    endEvent = endEvent || 'end';

    objs.forEach(function(o) {
        o.on(startEvent, function(monitorName, args) {
            ctxs[monitorName] = self.start(monitorName, args);
        });
        o.on(endEvent, function(monitorName, result) {
            if (ctxs[monitorName]) { ctxs[monitorName].end(result); }
        });
    });
    return self;
};

/** Set the file name or stats.js#LogFile object that statistics are logged to; null for default */
MonitorGroup.prototype.setLogFile = function(logNameOrObject) {
    this.logNameOrObject = logNameOrObject;
};

/** Log statistics each time an 'update' event is emitted */
MonitorGroup.prototype.setLoggingEnabled = function(enabled) {
    if (enabled) {
        this.logger = this.logger || new StatsLogger(this, this.logNameOrObject).start();
    } else if (this.logger) {
        this.logger.stop();
        this.logger = null;
    }
    return this;
};

/** Emit the update event and reset the statistics for the next window */
MonitorGroup.prototype.update = function() {
    this.emit('update', this.interval, this.stats);
    util.forEach(this.monitors, function (name, m) { m.update(); });
};