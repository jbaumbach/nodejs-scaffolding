**This document is out-of-date. See [`lib/reporting.js`](https://github.com/benschmaus/nodeload/tree/master/lib/reporting.js).**

## Web-based Reports ##

Functions for manipulating the report that is available during the test at http://localhost:8000/ and that is written to `results-{timestamp}-summary.html`.

**Interface:**

* `REPORT_MANAGER.reports`: All of the reports that are displayed in the summary webpage.
* `REPORT_MANAGER.addReport(Report)`: Add a report object to the webpage.
* `Report(name, updater(Report))`: A report consists of a set of charts, displayed in the main body of the webpage, and a summary object displayed on the right side bar. A report has a name and an updater function. Calling `updater(Report)` should  update the report's chart and summary. When tests are running, REPORT_MANAGER calls each report's `updater` periodically.
* `Report.summary`: A JSON object displayed in table form in the summary webpage right side bar. 
* `Report.getChart(name)`: Gets or creates a chart with the title `name` to the report and returns a `Chart` object. See `Chart.put(data)` below.
* `Chart.put(data)`: Add the data, which is a map of { 'trend-1': value, 'trend-2': value, ... }, to the chart, which tracks the values for each trend over time.

**Usage:**

An HTTP server is started on port 8000 by default. Use:

    `var nl = require('./lib/nodeloadlib).disableServer()`

to disable the HTTP server, or

    `var nl = require('./lib/nodeloadlib).usePort(port)`

to change the port binding. The file `results-{timestamp}-summary.html` is written to the current directory. Use

    `var nl = require('./lib/nodeloadlib).disableLogs()`

to disable creation of this file.

A report is automatically added for each test created by `addTest()` or `runTest()`. To add additional charts to the summary webpage:

    var mycounter = 0;
    REPORT_MANAGER.addReport(new Report("My Report", function(report) {
        chart = report.getChart("My Chart");
        chart.put({ 'counter': mycounter++ });
        chart.summary = { 'Total increments': mycounter };
    }));

The webpage automatically issues an AJAX request to refresh the text and chart data every 2 seconds by default. Change the refresh period using:

    `var nl = require('./lib/nodeloadlib).setAjaxRefreshIntervalMs(milliseconds)`
