var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var util = require('../util');
var Endpoint = require('./endpoint').Endpoint;
var EventEmitter = require('events').EventEmitter;
var SlaveNode = require('./slavenode').SlaveNode;
var Slaves = require('./slaves').Slaves;
var qputs = util.qputs;
var HTTP_SERVER = require('../http').HTTP_SERVER;
var NODELOAD_CONFIG = require('../config').NODELOAD_CONFIG;
}

/** Main interface for creating a distributed nodeload cluster. Spec:
{ 
    master: {
        host: 'host' or 'host:port' or undefined to extract from HttpServer
        master_remote_function_1: function(slaves, slaveId, args...) { ... },
    },
    slaves: {
        host: ['host:port', ...],
        setup: function(master) { ... }
        slave_remote_function_1: function(master, args...) { ... }
    },
    pingInterval: 2000,
    server: HttpServer instance (defaults to global HTTP_SERVER)
}

Calling cluster.start() will register a master handler on the provided http.js#HttpServer. It will
connect to every slave, asking each slave to 1) execute the setup() function, 2) report its current
state to this host every pingInterval milliseconds. Calling cluster.slave_remote_function_1(), will
execute slave_remote_function_1 on every slave.

Cluster emits the following events:

- 'init': emitted when the cluster.start() can be called (the underlying HTTP server has been started).
- 'start': when connections to all the slave instances have been established
- 'end': when all the slaves have been terminated (e.g. by calling cluster.end()). The endpoint
    installed in the underlying HTTP server has been removed.
- 'slaveError', slave, Error: The connection to the slave experienced an error. If error is null, the
    slave has failed to send its state in the last 4 pingInterval periods. It should be considered
    unresponsive.
- 'slaveError', slave, http.ClientResponse: A method call to this slave returned this non-200 response.
- 'running', 'done': when all the slaves that are not in an error state (haven't responded in the last 4
    pingIntervals) report that they are in a 'running' or 'done' state. To set a slave's the state,
    install a slave function:
    
        cluster = new Cluster({ 
            slaves: {
                slave_remote_function: function(master) { this.state = 'running'; }
            },
            ...
        });
    
    and call it
    
        cluster.slave_remote_function();
        
Cluster.state can be:
- 'initializing': The cluster cannot be started yet -- it is waiting for the HTTP server to start.
- 'initialized': The cluster can be started.
- 'started': Connections to all the slaves have been established and the master endpoint is created.
- 'stopping': Attempting to terminate all slaves.
- 'stopped': All of the slaves have been properly shutdown and the master endpoint removed.
*/
var Cluster = exports.Cluster = function Cluster(spec) {
    EventEmitter.call(this);
    util.PeriodicUpdater.call(this);
    
    var self = this,
        masterSpec = spec.master || {},
        slavesSpec = spec.slaves || { hosts:[] },
        masterHost = spec.master && spec.master.host || 'localhost';
    
    self.pingInterval = spec.pingInterval || NODELOAD_CONFIG.SLAVE_UPDATE_INTERVAL_MS;
    self.server = spec.server || HTTP_SERVER;
    self.masterEndpoint = new Endpoint(self.server, masterHost);
    self.slaves = new Slaves(self.masterEndpoint, self.pingInterval);
    self.slaveState_ = {};

    // Define all master methods on the local endpoint
    self.masterEndpoint.setStaticParams([self.slaves]); // 1st param to all master functions is slaves. 2nd will be slave id, which SlaveNode prepends to all requests.
    self.masterEndpoint.defineMethod('updateSlaveState_', self.updateSlaveState_.bind(self)); // updateSlaveState_ is on every master and called by SlaveNode.update() to periodically send its state to the master.
    util.forEach(masterSpec, function(method, val) {
        if (typeof val === 'function') {
            self.masterEndpoint.defineMethod(method, val);
        }
    });

    // Send all slave methods definitions to the remote instances
    slavesSpec.hosts.forEach(function(h) { self.slaves.add(h); });
    util.forEach(spec.slaves, function(method, val) {
        if (typeof val === 'function') {
            self.slaves.defineMethod(method, val);
            self[method] = function() { self.slaves[method].apply(self.slaves, arguments); };
        }
    });
    
    // Store some other extra state for each slave so we can detect state changes and unresponsiveness
    self.slaves.slaves.forEach(function(s) {
        if (!self.slaveState_[s.id]) {
            self.slaveState_[s.id] = { alive: true, aliveSinceLastCheck: false };
        }
    });

    // Cluster is started when slaves are alive, and ends when slaves are all shutdown
    self.slaves.on('start', function() { 
        self.state = 'started';
        self.emit('start'); 
    });
    self.slaves.on('end', function() { 
        self.masterEndpoint.end();
        self.state = 'stopped';
        self.emit('end'); 
    });
    self.slaves.on('slaveError', function(slave, err) {
        self.emit('slaveError', slave, err);
    });

    // Cluster is initialized (can be started) once server is started
    if (self.server.running) {
        self.state = 'initialized';
        process.nextTick(function() { self.emit('init'); });
    } else {
        self.state = 'initializing';
        self.server.on('start', function() {
            self.state = 'initialized';
            self.emit('init');
        });
    }
};
util.inherits(Cluster, EventEmitter);
Cluster.prototype.started = function() { return this.state === 'started'; };
/** Start cluster; install a route on the local HTTP server and send the slave definition to all the
slave instances. */
Cluster.prototype.start = function() {
    if (!this.server.running) { 
        throw new Error('A Cluster can only be started after it has emitted \'init\'.'); 
    }
    this.masterEndpoint.start();
    this.slaves.start();
    this.updateInterval = this.pingInterval * 4; // call update() every 4 ping intervals to check for slave aliveness
    // this.slaves 'start' event handler emits 'start' and updates state
};
/** Stop the cluster; remove the route from the local HTTP server and uninstall and disconnect from all
the slave instances */
Cluster.prototype.end = function() {
    this.state = 'stopping';
    this.updateInterval = 0;
    this.slaves.end();
    // this.slaves 'end' event handler emits 'end', destroys masterEndpoint & updates state
};
/** Check for unresponsive slaves that haven't called updateSlaveState_ in the last 4 update intervals */
Cluster.prototype.update = function() {
    var self = this;
    util.forEach(self.slaveState_, function(id, s) {
        if (!s.aliveSinceLastCheck && s.alive) {
            // this node has not sent us its state in the last four spec.pingInterval intervals -- mark as dead
            s.alive = false;
            self.emit('slaveError', self.slaves[id], null);
        } else if (s.aliveSinceLastCheck) {
            s.aliveSinceLastCheck = false;
            s.alive = true;
        }
    });
};
/** Receive a periodic state update message from a slave. When all slaves enter the 'running' or 'done'
states, emit an event. */
Cluster.prototype.updateSlaveState_ = function(slaves, slaveId, state) {
    var slave = slaves[slaveId];
    if (slave) {
        var previousState = this.slaveState_[slaveId].state;
        this.slaveState_[slaveId].state = state;
        this.slaveState_[slaveId].aliveSinceLastCheck = true;
        if (previousState !== state) {
            this.emit('slaveState', slave, state);

            if (state === 'running' || state === 'done') {
                this.emitWhenAllSlavesInState_(state); 
            }
        }
    } else {
        qputs('WARN: ignoring message from unexpected slave instance ' + slaveId);
    }
};
Cluster.prototype.emitWhenAllSlavesInState_ = function(state) {
    var allSlavesInSameState = true;
    util.forEach(this.slaveState_, function(id, s) {
        if (s.state !== state && s.alive) {
            allSlavesInSameState = false;
        }
    });
    if (allSlavesInSameState) {
        this.emit(state);
    }
};