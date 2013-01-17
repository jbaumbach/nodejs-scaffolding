// ------------------------------------
// Statistics
// ------------------------------------
//
// Defines various statistics classes and function. The classes implement the same consistent interface. 
// See NODELOADLIB.md for a complete description of the classes and functions.
//
/*jslint forin:true */
var BUILD_AS_SINGLE_FILE, stats = {};
if (BUILD_AS_SINGLE_FILE === undefined) {
var fs = require('fs');
}

var Histogram = stats.Histogram = function Histogram(params) {
    // default histogram size of 3000: when tracking latency at ms resolution, this
    // lets us store latencies up to 3 seconds in the main array
    this.type = 'Histogram';
    this.params = params;
    this.size = params && params.buckets || 3000;
    this.percentiles = params && params.percentiles || [0.95, 0.99];
    this.clear();
};
Histogram.prototype =  {
    clear: function() {
        this.start = new Date();
        this.length = 0;
        this.sum = 0;
        this.min = -1;
        this.max = -1;
        this.items = new Array(this.size);      // The main histogram buckets
        this.extra = [];                        // Any items falling outside of the buckets
        this.sorted = true;                     // Is extra[] currently sorted?
    },
    put: function(item) {
        this.length++;
        this.sum += item;
        if (item < this.min || this.min === -1) { this.min = item; }
        if (item > this.max || this.max === -1) { this.max = item; }
        
        if (item < this.items.length) {
            if (this.items[item] !== undefined) {
                this.items[item]++;
            } else {
                this.items[item] = 1;
            }
        } else {
            this.sorted = false;
            this.extra.push(item);
        }
    },
    get: function(item) {
        if (item < this.items.length) {
            return this.items[item];
        } else {
            var count = 0;
            for (var i in this.extra) {
                if (this.extra[i] === item) {
                    count++;
                }
            }
            return count;
        }
    },
    mean: function() {
        return this.sum / this.length;
    },
    percentile: function(percentile) {
        var target = Math.floor(this.length * (1 - percentile));
        
        if (this.extra.length > target) {
            var idx = this.extra.length - target - 1;
            if (!this.sorted) {
                this.extra = this.extra.sort(function(a, b) { return a - b; });
                this.sorted = true;
            }
            return this.extra[idx];
        } else {
            var sum = this.extra.length;
            for (var i = this.items.length - 1; i >= 0; i--) {
                if (this.items[i] > 0) {
                    sum += this.items[i];
                    if (sum >= target) {
                        return i;
                    }
                }
            }
            return 0;
        }
    },
    stddev: function() {
        var mean = this.mean();
        var s = 0;
        
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i] !== undefined) {
                s += this.items[i] * Math.pow(i - mean, 2);
            }
        }
        this.extra.forEach(function (val) {
            s += Math.pow(val - mean, 2);
        });
        return Math.sqrt(s / this.length);
    },
    summary: function() {
        var self = this,
            s = {
                min: self.min,
                max: self.max,
                avg: Number(self.mean().toFixed(1)),
                median: self.percentile(0.5)
            };
        self.percentiles.forEach(function(percentile) {
            s[percentile * 100 + "%"] = self.percentile(percentile);
        });
        return s;
    },
    merge: function(other) {
        if (this.items.length !== other.items.length) {
            throw "Incompatible histograms";
        }

        this.length += other.length;
        this.sum += other.sum;
        this.min = (other.min !== -1 && (other.min < this.min || this.min === -1)) ? other.min : this.min;
        this.max = (other.max > this.max || this.max === -1) ? other.max : this.max;
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i] !== undefined) {
                this.items[i] += other.items[i];
            } else {
                this.items[i] = other.items[i];
            }
        }
        this.extra = this.extra.concat(other.extra);
        this.sorted = false;
    }
};

var Accumulator = stats.Accumulator = function Accumulator() {
    this.type = 'Accumulator';
    this.total = 0;
    this.length = 0;
};
Accumulator.prototype = {
    put: function(stat) {
        this.total += stat;
        this.length++;
    },
    get: function() {
        return this.total;
    },
    clear: function() {
        this.total = 0;
        this.length = 0;
    },
    summary: function() {
        return { total: this.total };
    },
    merge: function(other) {
        this.total += other.total;
        this.length += other.length;
    }
};

var ResultsCounter = stats.ResultsCounter = function ResultsCounter() {
    this.type = 'ResultsCounter';
    this.start = new Date();
    this.items = {};
    this.length = 0;
};
ResultsCounter.prototype = {
    put: function(item) {
        if (this.items[item] !== undefined) {
            this.items[item]++;
        } else {
            this.items[item] = 1;
        }
        this.length++;
    },
    get: function(item) {
        if (item.length > 0) {
            var total = 0;
            for (var i in item) {
                total += this.items[i];
            }
            return total;
        } else {
            return this.items[item];
        }
    },
    clear: function() {
        this.start = new Date();
        this.items = {};
        this.length = 0;
    },
    summary: function() {
        var items = {};
        for (var i in this.items) {
            items[i] = this.items[i];
        }
        items.total = this.length;
        return items;
    },
    merge: function(other) {
        for (var i in other.items) {
            if (this.items[i] !== undefined) {
                this.items[i] += other.items[i];
            } else {
                this.items[i] = other.items[i];
            }
        }
        this.length += other.length;
    }
};

var Uniques = stats.Uniques = function Uniques() {
    this.type = 'Uniques';
    this.start = new Date();
    this.items = {};
    this.uniques = 0;
    this.length = 0;
};
Uniques.prototype = {
    put: function(item) {
        if (this.items[item] !== undefined) {
            this.items[item]++;
        } else {
            this.items[item] = 1;
            this.uniques++;
        }
        this.length++;
    },
    get: function() {
        return this.uniques;
    },
    clear: function() {
        this.items = {};
        this.uniques = 0;
        this.length = 0;
    },
    summary: function() {
        return {total: this.length, uniqs: this.uniques};
    },
    merge: function(other) {
        for (var i in other.items) {
            if (this.items[i] !== undefined) {
                this.items[i] += other.items[i];
            } else {
                this.items[i] = other.items[i];
                this.uniques++;
            }
        }
        this.length += other.length;
    }
};

var Peak = stats.Peak = function Peak() {
    this.type = 'Peak';
    this.peak = 0;
    this.length = 0;
};
Peak.prototype = {
    put: function(item) {
        if (this.peak < item) {
            this.peak = item;
        }
        this.length++;
    },
    get: function(item) {
        return this.peak;
    },
    clear: function() {
        this.peak = 0;
    },
    summary: function() {
        return { max: this.peak };
    },
    merge: function(other) {
        if (this.peak < other.peak) {
            this.peak = other.peak;
        }
        this.length += other.length;
    }
};

var Rate = stats.Rate = function Rate() {
    this.type = 'Rate';
    this.start = new Date();
    this.length = 0;
};
Rate.prototype = {
    put: function() {
        this.length++;
    },
    get: function() {
        return Number((this.length / ((new Date() - this.start) / 1000)).toFixed(1));
    },
    clear: function() {
        this.start = new Date();
        this.length = 0;
    },
    summary: function() {
        return { rps: this.get() };
    },
    merge: function(other) {
        this.length += other.length;
    }
};

var LogFile = stats.LogFile = function LogFile(filename) {
    this.type = 'LogFile';
    this.writepos = null;
    this.length = 0;
    this.filename = filename;
    this.open();
};
LogFile.prototype = {
    put: function(item) {
        var buf = new Buffer(item);
        fs.write(this.fd, buf, 0, buf.length, this.writepos);
        this.writepos = null;
        this.length += item.length;
    },
    get: function(item) {
        fs.statSync(this.filename, function(err, stats) {
            if (!err) { item = stats; }
        });
        return item;
    },
    clear: function(text) {
        var self = this;
        self.writepos = 0;
        fs.truncate(self.fd, 0, function(err) {
            if (text !== undefined) { self.put(text); }
        });
    },
    open: function() {
        this.fd = fs.openSync(this.filename, "a");
    },
    close: function() {
        fs.closeSync(this.fd);
        this.fd = null;
    },
    summary: function() {
        return { file: this.filename, written: this.length };
    }
};

var NullLog = stats.NullLog = function NullLog() { 
    this.type = 'NullLog';
    this.length = 0;
};
NullLog.prototype = {
    put: function(item) { /* nop */ },
    get: function(item) { return null; },
    clear: function() { /* nop */ }, 
    open: function() { /* nop */ },
    close: function() { /* nop */ },
    summary: function() { return { file: 'null', written: 0 }; }
};

var Reportable = stats.Reportable = function Reportable(name, Backend, backendparams) {
    this.type = 'Reportable';
    this.name = name || '';
    this.length = 0;
    this.interval = new Backend(backendparams);
    this.cumulative = new Backend(backendparams);
    this.lastSummary = null;
};
Reportable.prototype = {
    put: function(stat) {
        if (!this.disableIntervalReporting) {
            this.interval.put(stat);
        }
        this.cumulative.put(stat);
        this.length++;
        this.lastSummary = null;
    },
    get: function() { 
        return null; 
    },
    clear: function() {
        this.interval.clear();
        this.cumulative.clear();
    }, 
    next: function() {
        if (this.interval.length > 0) {
            this.interval.clear();
        }
        this.lastSummary = null;
    },
    summary: function() {
        if (this.lastSummary) { return this.lastSummary; }
        return { interval: this.interval.summary(), cumulative: this.cumulative.summary() };
    },
    merge: function(other) {
        // other should be an instance of backend, NOT Reportable.
        this.interval.merge(other);
        this.cumulative.merge(other);
    }
};

var StatsGroup = stats.StatsGroup = function StatsGroup() {
    Object.defineProperty(this, 'name', {
        enumerable: false,
        writable: true,
    });
    Object.defineProperty(this, 'put', {
        enumerable: false,
        value: function(statNameOrVal, val) {
            if (arguments.length < 2) {
                for (var i in this) { this[i].put(statNameOrVal); }
            } else {
                if (this[statNameOrVal]) { this[statNameOrVal].put(val); }
            }
        }
    });
    Object.defineProperty(this, 'get', {
        enumerable: false,
        value: function(statName) {
            if (arguments.length === 1) {
                var val = {};
                for (var i in this) { 
                    val[i] = this[i].get.apply(this[i], arguments);
                }
                return val;
            }
            if (!this[statName]) { 
                return undefined; 
            }
            console.log(this[statName]);
            var getArgs = Array.prototype.slice.call(arguments, 1);
            return this[statName].get.apply(this[statName], getArgs);
        }
    });
    Object.defineProperty(this, 'clear', {
        enumerable: false,
        value: function(statName) {
            if (statName) {
                this[statName].clear();
            } else {
                for (var i in this) { this[i].clear(); }
            }
        }
    });
    Object.defineProperty(this, 'summary', {
        enumerable: false,
        value: function(statName) {
            if (statName) {
                return this[statName].summary();
            }

            var summary = {ts: new Date()};
            if (this.name) { summary.name = this.name; }
            for (var i in this) {
                summary[i] = this[i].summary();
            }
            return summary;
        }
    });
};

/** Merge all the stats from one group of stats, {"statistic-name": StatsObject, ...} */
var mergeStatsGroups = stats.mergeStatsGroups = function(sourceGroup, targetGroup) {
    for (var statName in sourceGroup) {
        var sourceStats = sourceGroup[statName];
        if (targetGroup[statName] === undefined) {
            targetGroup[statName] = new stats[sourceStats.type](sourceStats.params);
        }
        targetGroup[statName].merge(sourceStats);
    }
};

var roundRobin = stats.roundRobin = function(list) {
    var r = list.slice();
    r.rridx = -1;
    r.get = function() {
        r.rridx = (r.rridx+1) % r.length;
        return r[r.rridx];
    };
    return r;
};

var randomString = stats.randomString = function(length) {
    var s = "";
    for (var i = 0; i < length; i++) {
        s += '\\' + (Math.floor(Math.random() * 95) + 32).toString(8); // ascii chars between 32 and 126
    }
    return eval("'" + s + "'");
};

var nextGaussian = stats.nextGaussian = function(mean, stddev) {
    mean = mean || 0;
    stddev = stddev || 1;
    var s = 0, z0, z1;
    while (s === 0 || s >= 1) {
        z0 = 2 * Math.random() - 1;
        z1 = 2 * Math.random() - 1;
        s = z0*z0 + z1*z1;
    }
    return z0 * Math.sqrt(-2 * Math.log(s) / s) * stddev + mean;
};

var nextPareto = stats.nextPareto = function(min, max, shape) {
    shape = shape || 0.1;
    var l = 1, h = Math.pow(1+max-min, shape), rnd = Math.random();
    while (rnd === 0) { rnd = Math.random(); }
    return Math.pow((rnd*(h-l)-h) / -(h*l), -1/shape)-1+min;
};

// Export everything in stats namespace
for (var i in stats) { exports[i] = stats[i]; }