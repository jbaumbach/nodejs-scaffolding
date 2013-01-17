// -----------------
// StatsLogger
// -----------------
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var START = require('../config').NODELOAD_CONFIG.START;
var LogFile = require('../stats').LogFile;
}

/** StatsLogger writes interval stats from a Monitor or MonitorGroup to disk each time it emits 'update' */
var StatsLogger = exports.StatsLogger = function StatsLogger(monitor, logNameOrObject) {
    this.logNameOrObject = logNameOrObject || ('results-' + START.toISOString() + '-stats.log');
    this.monitor = monitor;
    this.logger_ = this.log_.bind(this);
};
StatsLogger.prototype.start = function() {
    this.createdLog = (typeof this.logNameOrObject === 'string');
    this.log = this.createdLog ? new LogFile(this.logNameOrObject) : this.logNameOrObject;
    this.monitor.on('update', this.logger_);
    return this;
};
StatsLogger.prototype.stop = function() {
    if (this.createdLog) {
        this.log.close();
        this.log = null;
    }
    this.monitor.removeListener('update', this.logger_);
    return this;
};
StatsLogger.prototype.log_ = function() {
    var summary = this.monitor.interval.summary();
    this.log.put(JSON.stringify(summary) + ',\n');
};