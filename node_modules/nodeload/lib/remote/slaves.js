var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var util = require('../util');
var Slave = require('./slave').Slave;
var EventEmitter = require('events').EventEmitter;
}

/** A small wrapper for a collection of Slave instances. The instances are all started and stopped 
together and method calls are sent to all the instances.

Slaves emits the following events:
- 'slaveError', slave, error: The underlying HTTP connection for this slave returned an error.
- 'start': All of the slave instances are running.
- 'stopped': All of the slave instances have been stopped. */

var Slaves = exports.Slaves = function Slaves(masterEndpoint, pingInterval) {
    EventEmitter.call(this);
    this.masterEndpoint = masterEndpoint;
    this.slaves = [];
    this.pingInterval = pingInterval;
};
util.inherits(Slaves, EventEmitter);
/** Add a remote instance in the format 'host:port' as a slave in this collection */
Slaves.prototype.add = function(hostAndPort) {
    var self = this, 
        parts = hostAndPort.split(':'), 
        host = parts[0],
        port = Number(parts[1]) || 8000,
        id = host + ':' + port,
        slave = new Slave(id, host, port, self.masterEndpoint, self.pingInterval);

    self.slaves.push(slave);
    self[id] = slave;
    self[id].on('slaveError', function(err) {
        self.emit('slaveError', slave, err);
    });
    self[id].on('start', function() {
        var allStarted = util.every(self.slaves, function(id, s) { return s.state === 'started'; });
        if (!allStarted) { return; }
        self.emit('start');
    });
    self[id].on('end', function() {
        var allStopped = util.every(self.slaves, function(id, s) { return s.state !== 'started'; });
        if (!allStopped) { return; }
        self.emit('end');
    });
};
/** Define a method on all the slaves */
Slaves.prototype.defineMethod = function(name, fun) {
    var self = this;

    self.slaves.forEach(function(slave) {
        slave.defineMethod(name, fun);
    });

    self[name] = function() {
        var args = arguments;
        return self.slaves.map(function(s) { return s[name].apply(s, args); });
    };
};
/** Start all the slaves */
Slaves.prototype.start = function() {
    this.slaves.forEach(function(s) { s.start(); });
};
/** Terminate all the slaves */
Slaves.prototype.end = function() {
    this.slaves.forEach(function(s) { s.end(); });
};