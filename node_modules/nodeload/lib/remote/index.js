var slave = require('./slave');
var slavenode = require('./slavenode');
exports.Cluster = require('./cluster').Cluster;
exports.LoadTestCluster = require('./remotetesting').LoadTestCluster;
exports.Slaves = slave.Slaves;
exports.Slave = slave.Slave;
exports.SlaveNode = slavenode.SlaveNode;
exports.installRemoteHandler = slavenode.installRemoteHandler;
exports.Endpoint = require('./endpoint').Endpoint;
exports.EndpointClient = require('./endpointclient').EndpointClient;

require('./httphandler');