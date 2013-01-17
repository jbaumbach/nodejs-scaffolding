/*

  Do some load testing on our application.  We should end up with a number of requests
  per second at the end that we can use as a baseline for future comparisons 
  as we add more functionality.
  
  On your dev box, probably you'll have all of the components running together, such as 
  the server, the database, the cache, and the load testing tool itself.  So, the actual
  throughput number probably won't be that meaningful.

  Load testing is useful as well to see if we're going to run out of DB connections, memory,
  or any other potential resource issues.
  
  Run the test from the command prompt with the app started:

    $ node loadtest.js
  
  
  Here's a sample test run:

   ** Load test complete **
  
     Seconds run:            120
     Concurrent connections: 5
     Total requests handled: 41985
     Throughput (reqs/sec):  349


 */

var nl = require('nodeload')
  , secondsToRun = 120
  , totalRequests = 0
  , concurrentConns = 5
  , knownUserId = '50f1ebc3dd71688aad448b62';
  ;

var loadtest = nl.run({
  name: 'theLoadTest',
  host: 'localhost',
  port: 3000,
  timeLimit: secondsToRun, 
  numClients: concurrentConns,   // Concurrent connections
  targetRps: 1000,  // Max limit of requests per second
  stats: ['latency', 'result-codes'],
  requestGenerator: function(client) {
    
    var numberOfRoutes = 7;
    var routeToRun = Math.floor((Math.random()*numberOfRoutes));
    var request;
    
    //
    // Make the appropriate calls to the application that may represent
    // reasonable real-world use.  The goal is to get as much coverage as possible
    // so we don't deploy code that could bring down the server.
    //
    switch (routeToRun) {
      case 0:
        request = client.request('GET', "/");
        break;
      case 1:
        request = client.request('GET', "/login");
        break;
      case 2:
        // todo: figure out how to pass a body to this call.  The body would contain
        // sample login credentials.
        request = client.request('POST', "/login", {'Content-Type': 'application/x-www-form-urlencoded'});
        break;
      case 3:
        request = client.request('GET', "/logout");
        break;
      case 4:
        request = client.request('GET', "/users/new");
        break;
      case 5:
        //
        // The id of an existant user in the database
        //
        request = client.request('GET', "/users/" + knownUserId);
        break;
      default:
        request = client.request('GET', '/users/' + Math.floor(Math.random()*10000));
        break;
    }
    request.end();
    return request;
  }
});

loadtest.on('update', function(interval, stats) { 
  totalRequests = stats.theLoadTest.latency.length;
});

loadtest.on('end', function() { 
  var result = 
    '\r\n** Load test complete **\r\n\r\n' + 
    '   Seconds run:            ' + secondsToRun + '\r\n' + 
    '   Concurrent connections: ' + concurrentConns + '\r\n' +
    '   Total requests handled: ' + totalRequests + '\r\n' + 
    '   Throughput (reqs/sec):  ' + Math.floor(totalRequests / secondsToRun) + '\r\n' 
  
  console.log(result);
  process.exit(0);
});