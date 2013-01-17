/*
 * Based off of:
 * - Chad Etzel - http://github.com/jazzychad/template.node.js/
 * - John Resig - http://ejohn.org/blog/javascript-micro-templating/
 */
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var fs = require('fs');
}

var template = {
    cache_: {},
    create: function(str, data, callback) {
        // Figure out if we're getting a template, or if we need to
        // load the template - and be sure to cache the result.
        var fn;

        if (!/[\t\r\n% ]/.test(str)) {
            if (!callback) {
                fn = this.create(fs.readFileSync(str).toString('utf8'));
            } else {
                fs.readFile(str, function(err, buffer) {
                    if (err) { throw err; }

                    this.create(buffer.toString('utf8'), data, callback);
                });
                return;
            }    
        } else {
            if (this.cache_[str]) {
                fn = this.cache_[str];
            } else {
                // Generate a reusable function that will serve as a template
                // generator (and which will be cached).
                fn = new Function("obj",
                    "var p=[],print=function(){p.push.apply(p,arguments);};" +
                    "obj=obj||{};" +
                    // Introduce the data as local variables using with(){}
                    "with(obj){p.push('" +

                    // Convert the template into pure JavaScript
                    str.split("'").join("\\'")
                        .split("\n").join("\\n")
                        .replace(/<%([\s\S]*?)%>/mg, function(m, t) { return '<%' + t.split("\\'").join("'").split("\\n").join("\n") + '%>'; })
                        .replace(/<%=(.+?)%>/g, "',$1,'")
                        .split("<%").join("');")
                        .split("%>").join("p.push('") + "');}return p.join('');");

                this.cache_[str] = fn;
            }
        }

        // Provide some "basic" currying to the user
        if (callback) { callback(data ? fn( data ) : fn); }
        else { return data ? fn( data ) : fn; }
    }
};

exports.create = template.create.bind(template);