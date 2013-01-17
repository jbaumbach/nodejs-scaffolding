NAME
----

    nl - Load test tool for HTTP APIs.  Generates result charts and has hooks
    for generating requests.

SYNOPSIS
--------

    nl.js [options] <host>:<port>[<path>]

DESCRIPTION
-----------

    nl is for generating lots of requests to send to an HTTP API. It is
    inspired by Apache's ab benchmark tool and is designed to let programmers
    develop load tests and get informative reports without having to learn a
    big and complicated framework.

OPTIONS
-------

    -n, --number NUMBER              Number of requests to make. Defaults to 
                                     value of --concurrency unless a time limit is specified.
    -c, --concurrency NUMBER         Concurrent number of connections. Defaults to 1.
    -t, --time-limit NUMBER          Number of seconds to spend running test. No timelimit by default.
    -e, --request-rate NUMBER        Target number of requests per seconds. Infinite by default
    -m, --method STRING              HTTP method to use.
    -d, --data STRING                Data to send along with PUT or POST request.
    -r, --request-generator STRING   Path to module that exports getRequest function
    -i, --report-interval NUMBER     Frequency in seconds to report statistics. Default is 10.
    -q, --quiet                      Supress display of progress count info.
    -h, --help                       Show usage info


ENVIRONMENT
-----------

    nl requires node to be installed somewhere on your path. Get it
    from http://nodejs.org/#download.

    To get a known working combination of nodeload + node, be sure
    to install using npm:

        $ curl http://npmjs.org/install.sh | sh     # installs npm
        $ npm install nodeload
        
QUICKSTART
----------

    nodeload contains a toy server that you can use for a quick demo.
    Try the following:

        $ examples/test-server.js &
        [1] 2756
        $ Server running at http://127.0.0.1:9000/
        $ nl.js -f -c 10 -n 10000 -i 1 -r examples/test-generator.js localhost:9000

    You should now see some test output in your console.  The generated HTML
    report contains a graphical chart of test results.

THANKS
------

Thanks to Orlando Vazquez <ovazquez@gmail.com> for the original proof of concept app.

SEE ALSO
--------

`ab(1)`, [NODELOADLIB.md](http://github.com/benschmaus/nodeload/blob/master/NODELOADLIB.md)
