// This file defines Report, Chart, and ReportGroup
//
// A Report contains a summary and a number of charts.
//
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var util = require('../util');
var querystring = require('querystring');
var LogFile = require('../stats').LogFile;
var template = require('./template');
var config = require('../config');

var REPORT_SUMMARY_TEMPLATE = require('./summary.tpl.js').REPORT_SUMMARY_TEMPLATE;
var NODELOAD_CONFIG = config.NODELOAD_CONFIG;
var START = NODELOAD_CONFIG.START;
var DYGRAPH_SOURCE = require('./dygraph.tpl.js').DYGRAPH_SOURCE;
}
var Chart;

/** A Report contains a summary object and set of charts. It can be easily updated using the stats from
a monitor.js#Monitor or monitor.js#MonitorGroup using updateFromMonitor()/updateFromMonitorGroup().

@param name A name for the report. Generally corresponds to the test name.
@param updater A function(report) that should update the summary and chart data. */
var Report = exports.Report = function(name) {
    this.name = name;
    this.uid = util.uid();
    this.summary = {};
    this.charts = {};
};
Report.prototype = {
    getChart: function(name) {
        if (!this.charts[name]) {
            this.charts[name] = new Chart(name);
        }
        return this.charts[name];
    },
    /** Update this report automatically each time the Monitor emits an 'update' event */
    updateFromMonitor: function(monitor) {
        monitor.on('update', this.doUpdateFromMonitor_.bind(this, monitor, ''));
        return this;
    },
    /** Update this report automatically each time the MonitorGroup emits an 'update' event */
    updateFromMonitorGroup: function(monitorGroup) {
        var self = this;
        monitorGroup.on('update', function() {
            util.forEach(monitorGroup.monitors, function(monitorname, monitor) {
                self.doUpdateFromMonitor_(monitor, monitorname);
            });
        });
        return self;
    },
    doUpdateFromMonitor_: function(monitor, monitorname) {
        var self = this;
        monitorname = monitorname ? monitorname + ' ' : '';
        util.forEach(monitor.stats, function(statname, stat) {
            util.forEach(stat.summary(), function(name, val) {
                self.summary[self.name + ' ' + monitorname + statname + ' ' + name] = val;
            });
            if (monitor.interval[statname]) {
                self.getChart(monitorname + statname)
                    .put(monitor.interval[statname].summary());
            }
        });
    }
};

/** A Chart represents a collection of lines over time represented as:

    columns: ["x values", "line 1", "line 2", "line 3", ...]
    rows:   [[timestamp1, line1[0], line2[0], line3[0], ...],
             [timestamp2, line1[1], line2[1], line3[1], ...],
             [timestamp3, line1[2], line2[2], line3[2], ...],
             ...
            ]

@param name A name for the chart */
var Chart = exports.Chart = function(name) {
    this.name = name;
    this.uid = util.uid();
    this.columns = ["time"];
    this.rows = [[Date.now()]];
};
Chart.prototype = {
    /** Put a row of data into the chart. The current time will be used as the x-value. The lines in the
    chart are extracted from the "data". New lines can be added to the chart at any time by including it
    in data.

    @param data An object representing one row of data: {
                    "line name 1": value1
                    "line name 2": value2
                    ...
                }
    */
    put: function(data) {
        var self = this, row = [Date.now()]; 
        util.forEach(data, function(column, val) {
            var col = self.columns.indexOf(column);
            if (col < 0) {
                col = self.columns.length;
                self.columns.push(column);
                self.rows[0].push(0);
            }
            row[col] = val;
        });
        self.rows.push(row);
    },
    /** Update chart using data from event emitter each time it emits an event. 'eventEmitter' should 
    emit the given 'event' (defaults to 'data') with a single object. 'fields' are read from the object
    and added to the chart. For example, a chart can track the output form a child process output using
      
      chart.updateFromEventEmitter(spawnAndMonitor('cmd', ['args'], /val: (.*)/, ['val']), ['val'])
      
    */
    updateFromEventEmitter: function(eventEmitter, fields, event) {
        var self = this;
        eventEmitter.on(event || 'data', function(data) {
            var row = {};
            fields.forEach(function(i) {
                if (data[i] !== undefined) { row[i] = data[i]; }
            });
            self.put(row);
        });
    }
};

var ReportGroup = exports.ReportGroup = function() {
    this.reports = [];
    this.logNameOrObject = 'results-' + START.toISOString() + '.html';
};
ReportGroup.prototype = {
    addReport: function(report) {
        report = (typeof report === 'string') ? new Report(report) : report;
        this.reports.push(report);
        return report;
    },
    getReport: function(report) {
        var reports = this.reports.filter(function(r) { return r.name === report; });
        return reports[0] || this.addReport(report);
    },
    setLogFile: function(logNameOrObject) {
        this.logNameOrObject = logNameOrObject;
    },
    setLoggingEnabled: function(enabled) {
        clearTimeout(this.loggingTimeoutId);
        if (enabled) {
            this.logger = this.logger || (typeof this.logNameOrObject === 'string') ? new LogFile(this.logNameOrObject) : this.logNameOrObject;
            this.loggingTimeoutId = setTimeout(this.writeToLog_.bind(this), this.refreshIntervalMs);
        } else if (this.logger) {
            this.logger.close();
            this.logger = null;
        }
        return this;
    },
    reset: function() {
        this.reports = {};
    },
    getHtml: function() {
        var self = this,
            t = template.create(REPORT_SUMMARY_TEMPLATE);
        return t({
            DYGRAPH_SOURCE: DYGRAPH_SOURCE,
            querystring: querystring,
            refreshPeriodMs: self.refreshIntervalMs, 
            reports: self.reports
        });
    },
    writeToLog_: function() {
        this.loggingTimeoutId = setTimeout(this.writeToLog_.bind(this), this.refreshIntervalMs);
        this.logger.clear(this.getHtml());
    }
};