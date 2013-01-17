/*jslint sub: true */
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var url = require('url');
var util = require('../util');
var EventEmitter = require('events').EventEmitter;
}

/** Endpoint represents an a collection of functions that can be executed by POSTing parameters to an
HTTP server.

When Endpoint is started it adds the a unique route, /remote/{uid}/{method}, to server.
When a POST request is received, it calls method() with the request body as it's parameters.

The available methods for this endpoint are defined by calling defineMethod(...).

Endpoint emits the following events:
- 'start': A route has been installed on the HTTP server and setup(), if defined through defineMethod(),
    has been called
- 'end': The route has been removed. No more defined methods will be called.

Endpoint.state can be:
- 'initialized': This endpoint is ready to be started.
- 'started': This endpoint is listening for POST requests to dispatching to the corresponding methods
*/
var Endpoint = exports.Endpoint = function Endpoint(server, hostAndPort) {
    EventEmitter.call(this);

    var self = this, 
        parts = hostAndPort ? hostAndPort.split(':') : [];

    self.id = util.uid();
    self.server = server;
    self.methodNames = [];
    self.methods = {};
    self.setStaticParams([]);
    self.state = 'initialized';
    self.__defineGetter__('url', function() { return self.url_; });

    self.hostname_ = parts[0];
    self.port_ = parts[1];
    self.basepath_ = '/remote/' + self.id;
    self.handler_ = self.handle.bind(self);
};

util.inherits(Endpoint, EventEmitter);

/** Set values that are passed as the initial arguments to every handler method. For example, if you:

    var id = 123, name = 'myobject';
    endpoint.setStaticParams([id, name]);

You should define methods:

    endpoint.defineMethod('method_1', function(id, name, arg1, arg2...) {...});

which are called by:

    endpoint.method_1(arg1, arg2...)

*/
Endpoint.prototype.setStaticParams = function(params) {
    this.staticParams_ = params instanceof Array ? params : [params];
};

/** Define a method that can be executed by POSTing to /basepath/method-name. For example:

    endpoint.defineMethod('method_1', function(data) { return data; });

then POSTing '[123]' to /{basepath}/method_1 will respond with a message with body 123.

*/
Endpoint.prototype.defineMethod = function(name, fun) {
    this.methodNames.push(name);
    this.methods[name] = fun;
};

/** Start responding to requests to this endpoint by adding the proper route to the HTTP server*/
Endpoint.prototype.start = function() {
    if (this.state !== 'initialized') { return; }
    this.url_ = url.format({
        protocol: 'http', 
        hostname: this.hostname_ || this.server.hostname,
        port: this.port_ || this.server.port,
        pathname: this.basepath_
    });
    this.route_ = '^' + this.basepath_ + '/?';
    this.server.addRoute(this.route_, this.handler_);
    this.context = {};
    if (this.methods['setup']) {
        this.methods['setup'].apply(this.context, this.staticParams_);
    }
    this.state = 'started';
    this.emit('start');
};

/** Remove the HTTP server route and stop responding to requests */
Endpoint.prototype.end = function() {
    if (this.state !== 'started') { return; }
    this.server.removeRoute(this.route_, this.handler_);
    this.state = 'initialized';
    this.emit('end');
};

/** The main HTTP request handler. On DELETE /{basepath}, it will self-destruct this endpoint. POST 
requests are routed to the function set by defineMethod(), applying the HTTP request body as parameters,
and sending return value back in the HTTP response. */
Endpoint.prototype.handle = function(path, req, res) {
    var self = this;
    if (path === self.basepath_) {
        if (req.method === 'DELETE') {
            self.end();
            res.writeHead(204, {'Content-Length': 0});
            res.end();
        } else {
            res.writeHead(405);
            res.end();
        }
    } else if (req.method === 'POST') {
        var method = path.slice(this.basepath_.length+1);
        if (self.methods[method]) {
            util.readStream(req, function(params) {
                var status = 200, ret;
                
                try {
                    params = JSON.parse(params);
                } catch(e1) {
                    res.writeHead(400);
                    res.end();
                    return;
                }
                
                params = (params instanceof Array) ? params : [params];
                ret = self.methods[method].apply(self.context, self.staticParams_.concat(params));

                try {
                    ret = (ret === undefined) ? '' : JSON.stringify(ret);
                } catch(e2) {
                    ret = e2.toString();
                    status = 500;
                }

                res.writeHead(status, {'Content-Length': ret.length, 'Content-Type': 'application/json'});
                res.end(ret);
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    } else {
        res.writeHead(405);
        res.end();
    }
};