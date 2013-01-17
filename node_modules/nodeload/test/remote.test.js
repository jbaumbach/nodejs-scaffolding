var assert = require('assert'),
    http = require('http'),
    remote = require('../lib/remote'),
    nlconfig = require('../lib/config').disableServer(),
    HttpServer = require('../lib/http').HttpServer,
    Cluster = remote.Cluster;

module.exports = {
    'basic end-to-end cluster test': function(beforeExit) {
        var testTimeout, cluster,
            masterSetupCalled, slaveSetupCalled = [], slaveFunCalled = [],
            master = new HttpServer().start(9030), 
            slave1 = new HttpServer().start(9031), 
            slave2 = new HttpServer().start(9032),
            stopAll = function() {
                cluster.on('end', function() {
                    master.stop();
                    slave1.stop();
                    slave2.stop();
                });
                cluster.end();
            };
        
        remote.installRemoteHandler(master);
        remote.installRemoteHandler(slave1);
        remote.installRemoteHandler(slave2);
        
        cluster = new Cluster({
                master: {
                    setup: function(slaves) {
                        assert.ok(slaves);
                        masterSetupCalled = true;
                    },
                    slaveSetupCalled: function(slaves, slaveId) {
                        assert.ok(slaves);
                        assert.ok(slaveId);
                        slaveSetupCalled.push(slaveId);
                    },
                    slaveFunCalled: function(slaves, slaveId, data) { 
                        assert.ok(slaves);
                        assert.ok(slaveId);
                        assert.equal(data, 'data for master');
                        slaveFunCalled.push(slaveId);
                    },
                },
                slaves: {
                    hosts: ['localhost:9031', 'localhost:9032'],
                    setup: function(master) {
                        this.assert = require('assert');
                        this.assert.ok(master);
                        master.slaveSetupCalled();
                    },
                    slaveFun: function(master, data) {
                        this.assert.ok(master);
                        this.assert.equal(data, 'data for slaves');
                        master.slaveFunCalled('data for master');
                    }
                },
                pingInterval: 250,
                server: master
            });

        cluster.on('init', function() {
            cluster.on('start', function() {
                cluster.slaveFun('data for slaves');
            });
            cluster.start();
        });
        
        testTimeout = setTimeout(stopAll, 500);
        
        beforeExit(function() {
            assert.ok(masterSetupCalled);
            assert.equal(slaveSetupCalled.length, 2);
            assert.ok(slaveSetupCalled.indexOf('localhost:9031') > -1);
            assert.ok(slaveSetupCalled.indexOf('localhost:9032') > -1);
            assert.equal(slaveFunCalled.length, 2);
            assert.ok(slaveFunCalled.indexOf('localhost:9031') > -1);
            assert.ok(slaveFunCalled.indexOf('localhost:9032') > -1);
        });
    },
};