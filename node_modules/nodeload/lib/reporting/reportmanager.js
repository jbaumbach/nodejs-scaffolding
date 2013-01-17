// This file defines REPORT_MANAGER
//
// Reports added to the global REPORT_MANAGER are served by the global HTTP_SERVER instance (defaults to
// http://localhost:8000/) and written to disk at regular intervals.

var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var ReportGroup = require('./report').ReportGroup;
var config = require('../config');

var NODELOAD_CONFIG = config.NODELOAD_CONFIG;
var HTTP_SERVER = require('../http').HTTP_SERVER;
}

/** A global report manager used by nodeload to keep the summary webpage up to date during a load test */
var REPORT_MANAGER = exports.REPORT_MANAGER = new ReportGroup();
NODELOAD_CONFIG.on('apply', function() { 
    REPORT_MANAGER.refreshIntervalMs = REPORT_MANAGER.refreshIntervalMs || NODELOAD_CONFIG.AJAX_REFRESH_INTERVAL_MS;
    REPORT_MANAGER.setLoggingEnabled(NODELOAD_CONFIG.LOGS_ENABLED);
});

HTTP_SERVER.addRoute('^/$', function(url, req, res) {
    var html = REPORT_MANAGER.getHtml();
    res.writeHead(200, {"Content-Type": "text/html", "Content-Length": html.length});
    res.write(html);
    res.end();
});
HTTP_SERVER.addRoute('^/reports$', function(url, req, res) {
    var json = JSON.stringify(REPORT_MANAGER.reports); 
    res.writeHead(200, {"Content-Type": "application/json", "Content-Length": json.length});
    res.write(json);
    res.end();
});