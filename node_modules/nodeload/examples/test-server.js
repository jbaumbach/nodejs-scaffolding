#!/usr/bin/env node
require('http').createServer(function (req, res) {
  var maxDelayMs = 500;
  var delay = Math.round(Math.random()*maxDelayMs) + 1000;
  setTimeout(function () {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write(delay+'\n');
    res.end();
  }, delay);
}).listen(9000);
console.log('Server running at http://127.0.0.1:9000/');
