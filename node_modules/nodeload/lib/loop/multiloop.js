// -----------------------------------------
// MultiLoop 
// -----------------------------------------
//
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var util = require('../util');
var loop = require('./loop');
var EventEmitter = require('events').EventEmitter;
var Loop = loop.Loop;
var LOOP_OPTIONS = loop.LOOP_OPTIONS;
}

/** MultiLoop accepts a single loop specification, but allows it to be executed concurrently by creating
multiple Loop instances. The execution rate and concurrency are changed over time using profiles. 
LOOP_OPTIONS lists the supported specification parameters. */ 
var MultiLoop = exports.MultiLoop = function MultiLoop(spec) {
    EventEmitter.call(this);

    this.spec = util.extend({}, util.defaults(spec, LOOP_OPTIONS));
    this.loops = [];
    this.concurrencyProfile = spec.concurrencyProfile || [[0, spec.concurrency]];
    this.rpsProfile = spec.rpsProfile || [[0, spec.rps]];
    this.updater_ = this.update_.bind(this);
    this.finishedChecker_ = this.checkFinished_.bind(this);
};

util.inherits(MultiLoop, EventEmitter);

/** Start all scheduled Loops. When the loops complete, 'end' event is emitted. */
MultiLoop.prototype.start = function() {
    if (this.running) { return; }
    this.running = true;
    this.startTime = new Date();
    this.rps = 0;
    this.concurrency = 0;
    this.loops = [];
    this.loopConditions_ = [];

    if (this.spec.numberOfTimes > 0 && this.spec.numberOfTimes < Infinity) {
        this.loopConditions_.push(Loop.maxExecutions(this.spec.numberOfTimes));
    }
    
    if (this.spec.duration > 0 && this.spec.duration < Infinity) {
        this.endTimeoutId = setTimeout(this.stop.bind(this), this.spec.duration * 1000);
    }

    process.nextTick(this.emit.bind(this, 'start'));
    this.update_();
    return this;
};

/** Force all loops to finish */
MultiLoop.prototype.stop = function() {
    if (!this.running) { return; }
    clearTimeout(this.endTimeoutId);
    clearTimeout(this.updateTimeoutId);
    this.running = false;
    this.loops.forEach(function(l) { l.stop(); });
    this.emit('remove', this.loops);
    this.emit('end');
    this.loops = [];
};

/** Given a profile in the format [[time, value], [time, value], ...], return the value corresponding
to the given time. Transitions between points are currently assumed to be linear, and value=0 at time=0
unless otherwise specified in the profile. */
MultiLoop.prototype.getProfileValue_ = function(profile, time) {
    if (!profile || profile.length === 0) { return 0; }
    if (time < 0) { return profile[0][0]; }

    var lastval = [0,0];
    for (var i = 0; i < profile.length; i++) {
        if (profile[i][0] === time) { 
            return profile[i][1]; 
        } else if (profile[i][0] > time) {
            var dx = profile[i][0]-lastval[0], dy = profile[i][1]-lastval[1];
            return Math.floor((time-lastval[0]) / dx * dy + lastval[1]);
        }
        lastval = profile[i];
    }
    return profile[profile.length-1][1];
};

/** Given a profile in the format [[time, value], [time, value], ...], and the current time, return the
time (rounded up to the nearest whole unit) before the profile value will change by 1. */
MultiLoop.prototype.getProfileTimeToNextValue_ = function(profile, time) {
    if (!profile || profile.length === 0) { return Infinity; }
    if (time < 0) { return -time; }

    var MIN_TIMEOUT = 1, lastval = [0,0];
    for (var i = 0; i < profile.length; i++) {
        if (profile[i][0] > time) {
            var dt = (profile[i][0]-time),
                timePerUnitChange = dt / Math.abs(profile[i][1]-lastval[1]);
            return Math.ceil(Math.max(MIN_TIMEOUT, Math.min(dt, timePerUnitChange)));
        }
        lastval = profile[i];
    }
    return Infinity;
};

MultiLoop.prototype.update_ = function() {
    var i, now = Math.floor((new Date() - this.startTime) / 1000),
        concurrency = this.getProfileValue_(this.concurrencyProfile, now),
        rps = this.getProfileValue_(this.rpsProfile, now),
        timeout = Math.min(
          this.getProfileTimeToNextValue_(this.concurrencyProfile, now), 
          this.getProfileTimeToNextValue_(this.rpsProfile, now)) * 1000;
    
    if (concurrency < this.concurrency) {
        var removed = this.loops.splice(concurrency);
        removed.forEach(function(l) { l.stop(); });
        this.emit('remove', removed);
    } else if (concurrency > this.concurrency) {
        var loops = [];
        for (i = 0; i < concurrency-this.concurrency; i++) {
            var args = this.spec.argGenerator ? this.spec.argGenerator() : this.spec.args,
                loop = new Loop(this.spec.fun, args, this.loopConditions_, 0).start();
            loop.on('end', this.finishedChecker_);
            loops.push(loop);
        }
        this.loops = this.loops.concat(loops);
        this.emit('add', loops);
    }
    
    if (concurrency !== this.concurrency || rps !== this.rps) {
        var rpsPerLoop = (rps / concurrency);
        this.loops.forEach(function(l) { l.rps = rpsPerLoop; });
        this.emit('rps', rps);
    }
    
    this.concurrency = concurrency;
    this.rps = rps;

    if (timeout < Infinity) {
        this.updateTimeoutId = setTimeout(this.updater_, timeout);
    }
};

MultiLoop.prototype.checkFinished_ = function() {
    if (!this.running) { return true; }
    if (this.loops.some(function (l) { return l.running; })) { return false; }
    this.running = false;
    this.emit('end');
    return true;
};
