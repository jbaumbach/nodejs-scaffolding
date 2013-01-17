  A full-stack node.js sample application that demonstrates one possible architecture for building a complete website
  with node.js.  It features an architecture demonstration of these features:
  
   * Built with Node.js and Express
   * Fully commented for people coming from a Microsoft .NET/RDBMS background
   * Data layer demonstrating connecting to and storing data in MongoDb
   * Data layer decoupled from application layer for easily changing databases
   * User account create/edit, demonstrating password hashing and salting
   * User login with sessions stored in Reddis
   * Presentation layer using layouts (e.g. "master pages" in .NET Webforms) and includes (e.g. "user controls")
   * HTML generated using Jade rendering engine demonstrating conditionals
   * CSS generated using Stylus rendering engine (with Nib plugin for abstracting away CSS hacks)
   * Unit and integration testing architecture with Mocha
   * HTML black box testing demonstration with Supertest
   * Load testing your application with Nodeload
   * Deploy your app to production at Heroku
  
  See it live on [heroku](https://fast-stream-1638.herokuapp.com/) 

## Quick Start

 The quickest way to check out the application is to:

 Create a folder on your system to hold the files:

    $ mkdir scaffolding-sample
    $ cd scaffolding-sample

 Download the source code:

    $ git clone git://github.com/lavamantis/nodejs-scaffolding.git

 Install dependencies:

    $ npm install

 Start your MongoDb and Reddis servers:
 
    $ mongod -v
    $ ./redis-server --loglevel verbose
    
 Finally, start the application server:

    $ node app

 The startup message will show the url to copy to your browser to see the app in action.

## Running Tests

To run the test suite:

    $ mocha --recursive

To run the load test (runs for 2 minutes):

    $ node loadtest.js

## License 

(The MIT License)

Copyright (c) 2009-2013 John Baumbach &lt;john.j.baumbach@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.