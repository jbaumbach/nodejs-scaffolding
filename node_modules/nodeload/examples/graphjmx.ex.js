#!/usr/bin/env node

/*jslint forin:true */

var assert = require('assert'),
    child_process = require('child_process'),
    reporting = require('../lib/reporting'),
    REPORT_MANAGER = reporting.REPORT_MANAGER;

REPORT_MANAGER.setLogFile('.reporting.test-output.html');

var hostAndPort = 'localhost:9999',
    refreshInterval = 2;

var jmx = reporting.graphJmx({
    host: 'localhost:9999',
    reportName: 'Monitors',
    chartName: 'Heap',
    mbeans: {
        'Used': 'java.lang:type=Memory[HeapMemoryUsage.used]',
        'Committed': 'java.lang:type=Memory[HeapMemoryUsage.committed]'
    },
    dataFormatter: function(data) {
        return {
            Used: data.Used / 1024,
            Committed: data.Committed /= 1024
        };
    },
    interval: refreshInterval
});

reporting.graphProcess({
    reportName: 'Monitors',
    chartName: 'CPU (iostat)',
    command: 'iostat -C ' + refreshInterval,
    columns: [null, null, null, 'tps', 'MB/s'],
});

jmx.stderr.on('data', function(data) {
    console.log(data.toString());
});

jmx.on('exit', function(code) {
    if (code !== 0) {
        console.log('JMX monitor died with code ' + code);
    }
    process.exit(code);
});