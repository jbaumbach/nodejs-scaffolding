// UI builders and event handlers
// ----------------------------------
/*jslint forin:true */
/*globals window document $ */
var getIdFromString, getNodeObject, deleteNodeObject, refreshReportsData, selectedNode; // for jslint. defined in console.data.js.
var Dygraph;

// ---------------
// UI creation
// ---------------
var CHART_LEGEND_WIDTH = 120;

var doc, optNodes, frmAddNode, cmdAddNode, cmdAdd, txtNewHost, 
    pnlCharts, pnlRightColumn, pnlSummary;

function initVars() {
    doc = $(document);
    optNodes = $('#optNodes');
    frmAddNode = $('#frmAddNode');
    cmdAddNode = $('#cmdAddNode');
    cmdAdd = $('#cmdAdd');
    txtNewHost = $('#txtNewHost');
    pnlCharts = $('#pnlCharts');
    pnlRightColumn = $('#pnlRightColumn');
    pnlSummary = $('#pnlSummary');
}

// ---------------
// UI Control
// ---------------
var refreshReportGraphs, resizeReportGraphs, addNodeButton, addNodeTabs, jsonToTable;
function toggleAddNodeDialog() {
    frmAddNode.toggle();
    if (frmAddNode.is(':visible')) {
        txtNewHost.val('').focus();
    } else {
        cmdAdd.focus();
    }
}
function hideAddNodeDialog() {
    cmdAdd.focus();
    frmAddNode.hide();
}
function addNode(name) {
    var node = getNodeObject(name);

    if (!node.uiloaded) {
        node.uiloaded = true;
        node.button = addNodeButton(node);
        node.tabs = addNodeTabs(node);
        node.graphs = {};
        node.selectNode = function() {
            node.button.click();
            optNodes.buttonset('refresh');
        };
        node.selectReportGraph = function(index) {
            node.tabs.tabs('select', index);
        };

        $.getJSON('http://' + node.name + '/remote/hosts', function(hosts, status) {
            if (hosts) { hosts.forEach(function(name) { addNode(name); }); }
        });
    }

    refreshReportsData(node);
    setTimeout(function() { refreshReportGraphs(node); }, 200);

    node.selectNode();
    node.selectReportGraph(0);
}
function removeNode(node) {
    var button = $('#cmd-' + node.id);
    if (node === selectedNode) {
        var next = button.next();
        if (!next.exists()) { next = button.prev(); }
        if (next) { next.find('input').button().click(); }
    }
    button.hide();
    button.remove();
    optNodes.buttonset();
    node.tabs.remove();
    deleteNodeObject(node);
}
function selectNode(node) {
    if (selectedNode === node) { return; }
    if (selectedNode) { selectedNode.tabs.hide(); }
    selectedNode = node;
    selectedNode.tabs.show();
    refreshReportGraphs(node);
    resizeReportGraphs();
}
function addNodeButton(node) {
    optNodes.append([
            '<span id="cmd-', node.id, '">',
            '   <input type="radio" id="', node.id, '" name="optNodes" checked="true"/>',
            '   <label for="', node.id, '">', node.name, '</label>',
            '</span>'
        ].join(''));
    $('#' + node.id ).button({
        icons: { secondary: 'ui-icon-squaresmall-close' }
    }).click(function() {
        selectNode(node);
    });
    $('#cmd-' + node.id + ' span.ui-icon-squaresmall-close').click(function(){
        removeNode(node);
    });
    optNodes.buttonset();
    return $('#' + node.id);
}
function addNodeTabs(node) {
    var tabs = $(['<div id="tab-charts-', node.id, '">',
                  '  <div class="clsShortcutKeys">&lt; k &nbsp;&nbsp; j &gt;</div>',
                  '  <ul></ul>',
                  '</div>'
                  ].join(''));
    tabs.appendTo(pnlCharts).tabs();
    tabs.tabs('add', '#tab-console-' + node.id, 'Console: ' + node.name);
    tabs.hide();
    return tabs;
}
function getTabForReport(node, reportName, reportId) {
    var tabId = '#tab-' + node.id + '-' + reportId,
        tab = $(tabId);

    if (!tab.exists()) {
        node.tabs.tabs('add', tabId, reportName, node.tabs.tabs('length')-1);
        node.tabs.bind('tabsshow', function(event, ui) {
            resizeReportGraphs();
        });
        tab = $(tabId).attr('report-name', reportName);
    }
    return tab;
}
function resizeReportGraphs() {
    for (var i in selectedNode.graphs) {
        if (selectedNode.graphs[i].container.is(':visible')) {
            selectedNode.graphs[i].resize(selectedNode.graphs[i].container.width() - CHART_LEGEND_WIDTH - 5, selectedNode.graphs[i].container.height());
        }
    }
}
function refreshReportGraphs(node) {
    var reports = node.reports,
        summary = {};
    for (var i in reports) {
        // Add tabs for any new reports
        var reportId = getIdFromString(reports[i].name),
            tab = getTabForReport(node, reports[i].name, reportId);

        // Add charts from report
        var charts = reports[i].charts;
        for (var j in charts) {
            var chartId = 'chart-' + node.id + '-' + reportId + '-' + getIdFromString(j),
                chartContainerId = chartId + '-container',
                chartLegendId = chartId + '-legend',
                rows = charts[j].rows.map(function(x) { return [new Date(x[0])].concat(x.slice(1)); });

            if (!node.graphs[chartId]) {
                tab.append([
                        '<h2 class="clsChartTitle">', j, '</h2><div id="', chartContainerId, '" class="clsChartContainer"> ',
                        '    <div id="', chartId, '" class="clsChart" style="height:200px"/>',
                        '    <div id="', chartLegendId, '" class="clsChartLegend" style="min-width:', CHART_LEGEND_WIDTH, 'px"/>',
                        '</div>'
                    ].join(''));
                node.graphs[chartId] = new Dygraph(
                    document.getElementById(chartId),
                    rows,
                    {labelsDiv: $('#' + chartLegendId)[0],
                     labelsSeparateLines: true,
                     labels: charts[j].columns,
                     strokeWidth: 1.5,
                     xAxisLabelWidth: 80
                    });
                node.graphs[chartId].container = $('#' + chartContainerId);
            } else {
                node.graphs[chartId].updateOptions({"file": rows, labels: charts[j].columns});
            }
        }

        $.extend(summary, reports[i].summary);
    }
    
    pnlSummary.html(jsonToTable(summary));
    
    if (!node.graphsloaded && node.tabs.tabs('length') > 1) {
        node.graphsloaded = true;
        node.tabs.tabs('select', 0);
    }
}

// --------------------
// Keyboard navigation
// --------------------
function initShortcuts() {
    doc.bind('keydown', 'd', function() {
        if (!frmAddNode.is(':visible')) {
            cmdAddNode.click();
            return false;
        } else if (!txtNewHost.is(':focus')) {
            txtNewHost.focus();
            return false;
        }
    });
    doc.bind('keydown', 'shift+k', function() {
        var prev = optNodes.find('label.ui-state-active').parent().prev();
        if (!prev) { return; }

        prev.find('input').button().click();
        optNodes.buttonset('refresh');
    });
    doc.bind('keydown', 'shift+j', function() {
        var next = optNodes.find('label.ui-state-active').parent().next();
        if (!next) { return; }

        next.find('input').button().click();
        optNodes.buttonset('refresh');
    });
    doc.bind('keydown', 'k', function() {
        if (!selectedNode) { return; }
        var selected = selectedNode.tabs.tabs('option', 'selected');
        selectedNode.tabs.tabs('select', selected-1);
    });
    doc.bind('keydown', 'j', function() {
        if (!selectedNode) { return; }
        var selected = selectedNode.tabs.tabs('option', 'selected');
        selectedNode.tabs.tabs('select', selected+1);
    });
    
    txtNewHost.bind('keydown', 'esc', function() {
        hideAddNodeDialog();
        return false;
    });
    txtNewHost.bind('keydown', 'return', function() {
        cmdAdd.click();
        return false;
    });
}

// ---------------
// Utilities
// ---------------
function jsonToTable(json) {
    var txt = "";
    for (var i in json) {
        txt += "<tr><td class=label>" + i + "</td><td>" + json[i] + "</td></tr>";
    }
    return "<table>" + txt + "</table>";
}

// ---------------
// UI Construction
// ---------------
function initUI() {
    initVars();

    optNodes.buttonset();
    cmdAddNode.button({
        text: false,
        icons: {
            primary: "ui-icon-plusthick"
        }
    }).click(function(){
        toggleAddNodeDialog();
        return false;
    });
    cmdAdd.click(function() {
        if (frmAddNode.is(':visible') && txtNewHost.val().trim().length > 0) {
            var name = txtNewHost.val();
            hideAddNodeDialog();
            addNode(name);
        }
    });
    
    $(window).resize(function() {
        resizeReportGraphs();
    });

    pnlRightColumn.accordion({ 
        header: "h3",
        autoHeight: false,
    });

    initShortcuts();

    var refreshGraphs = function() {
        if (selectedNode) { refreshReportGraphs(selectedNode); }
        setTimeout(function() { refreshGraphs(); }, 2000);
    };
    refreshGraphs();
}