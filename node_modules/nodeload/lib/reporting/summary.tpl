<html>
    <head>
        <title>Test Results</title>
        <script language="javascript" type="text/javascript"><!--
            <%=DYGRAPH_SOURCE%>
            function jsonToTable(json) {
                var txt = "";
                for (var i in json)
                    txt += "<tr><td class=label>" + i + "</td><td>" + json[i] + "</td></tr>";
                return "<table>" + txt + "</table>";
            };
        --></script>
        <style><!--
            body { margin: 0px; font: 13px Arial, Helvetica, sans-serif; }
            h1 { font-size: 2.4em; }
            p, ol, ul { line-height: 30%; }
            a:hover { text-decoration: none; }
            #main { float:left; width: 740px; }
            #sidebar { float:right; width: 260px; height: 100%; border-left: #BFC9AE solid 1px; margin-left: 10px; padding-left: 10px;}
            #header { width: 100%; height: 120px; margin: 0px auto; color: #FFFFFF; background: #699C4D; border: 3px solid darkgreen; border-style: none none solid none;}
            #header h1 { width: 1024; padding: 25px 0px 0px 0px; margin: 0px auto; font-weight: normal; }
            #header p { width: 1024; padding: 15px 0px 0px 0px; margin: 0px auto; }
            #chkPause { float: right; margin-right: 10px; }
            #page { width: 1024px; margin: 0px auto; padding: 30px 0px; }
            .post { margin: 0px 0px 30px 0px; }
            .post h1, .post h2 { margin: 0px; padding: 0px 0px 5px 0px; border-bottom: #BFC9AE solid 1px; color: #232F01; }
            .entry { margin: 10px 0px 20px 0px; }
            #footer { clear: both; width: 1024px; height: 50px; margin: 0px auto 30px auto; color: #FFFFFF; background: #699C4D; }
            #footer p { padding: 19px 0px 0px 0px; text-align: center; line-height: normal; font-size: smaller; }
            #footer a { color: #FFFFFF; }
            .statsTable table { font-size: small; font-variant: small-caps; border-spacing: 10px 1px; }
            .statsTable .label { text-align:right; }
        --></style>
    </head>

    <body>
        <div id="header">
            <h1>Test Results</h1>
            <p id="timestamp"><%=new Date()%></p>
            <p><input type="checkbox" id="chkAutoRefresh" checked="true"><label for="chkAutoRefresh">Auto-refresh</label></input><p>
        </div>
        <div id="page">
            <div id="main"></div>
            <div id="sidebar">
                <div class="post">
                    <h2>Cumulative</h2>
                    <div id="summaries" class="entry"></div>
                </div>
            </div>
        </div>
        <div id="footer"><p>generated with <a href="http://github.com/benschmaus/nodeload">nodeload</a></p></div>
    </body>

    <script id="source" language="javascript" type="text/javascript">
        var raw_reports;
        function updateDate(date) {
            document.getElementById("timestamp").innerHTML = date || new Date();
        }
        function update(reports) {
            var main = document.getElementById("main"), summaries = document.getElementById("summaries");
            raw_reports = reports;
            reports.forEach(function(report) {
                
                var summary = document.getElementById("reportSummary" + report.uid);
                if (!summary) {
                    var summary = document.createElement("p");
                    summary.setAttribute("id", "reportSummary" + report.uid);
                    summary.setAttribute("class", "statsTable");
                    summaries.appendChild(summary);
                }
                summary.innerHTML = jsonToTable(report.summary);
                
                for (var j in report.charts) {
                    var chart = report.charts[j];
                    var rows = chart.rows.map(function(x) { return [new Date(x[0])].concat(x.slice(1)) });
                    if (graphs[chart.uid]) {
                        graphs[chart.uid].updateOptions({"file": rows, labels: chart.columns});
                    } else {
                        var newchart = document.createElement("div");
                        newchart.setAttribute("class", "post");
                        newchart.innerHTML = [].concat(
                            '<h2>', report.name, ': ', chart.name, '</h2>',
                            '<div class="entry" style="width:100%;float:left">',
                                '<div id="chart', chart.uid, '" style="float:left;width:660px;height:200px;"></div>',
                                '<div id="chartlegend', chart.uid, '" style="float:left;width:80px;height:200px;"></div>',
                            '</div>'
                        ).join('');
                        main.appendChild(newchart);
                        graphs[chart.uid] = new Dygraph(
                            document.getElementById("chart" + chart.uid),
                            rows,
                            {
                                labelsDiv: document.getElementById("chartlegend" + chart.uid),
                                labelsSeparateLines: true,
                                labels: chart.columns,
                                xAxisLabelWidth: 80
                            });
                    }
                }
            });
        }

        if(navigator.appName == "Microsoft Internet Explorer") { http = new ActiveXObject("Microsoft.XMLHTTP"); } else { http = new XMLHttpRequest(); }

        setInterval(function() {
            if (document.getElementById("chkAutoRefresh").checked) {
                http.open("GET", "/reports");
                http.onreadystatechange=function() { 
                    if (http.readyState == 4 && http.status == 200) {
                        updateDate();
                        update(JSON.parse(http.responseText));
                    }
                }
                http.send(null);
            }
        }, <%=refreshPeriodMs%>);
        
        graphs = {};
        update(<%=JSON.stringify(reports)%>);
    </script>
</html>