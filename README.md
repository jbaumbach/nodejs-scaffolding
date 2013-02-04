## Node.js Scaffolding

  Hello, and welcome!  This repository is a full-stack node.js sample application that demonstrates an 
  architecture for building a complete production
  website with node.js.  It features an architectural demonstration of these features:

  See the working demo [live on heroku](https://fast-stream-1638.herokuapp.com/).

   * Built with Node.js and Express
   * Fully commented for people coming from a Microsoft .NET/RDBMS background
   * Data layer demonstrating connecting to and storing data in MongoDb
   * Data layer decoupled from application layer for easily changing databases
   * Defined classes (well, Javascript's version of a class) for application object models
   * User account create/edit, demonstrating password hashing and salting
   * User login with sessions stored in Redis
   * Presentation layer using layouts (e.g. "master pages" in .NET Webforms) and includes (e.g. "user controls")
   * HTML generated using Jade rendering engine, also demonstrating conditionals
   * CSS generated using Stylus rendering engine (with Nib plugin for abstracting away CSS hacks, thank you http://clock.co.uk/tech-blogs/a-simple-website-in-nodejs-with-express-jade-and-stylus)
   * Unit and integration testing architecture with Mocha
   * HTML black box testing demonstration with Supertest
   * Load testing your application with Nodeload
   * Deploy your app to production at Heroku
  
## Quick Start

 The quickest way to download and start digging through code is to:

 Create a folder on your system to hold the files:

    $ mkdir scaffolding-sample
    $ cd scaffolding-sample

 Download the source code:

    $ git clone git://github.com/jbaumbach/nodejs-scaffolding.git

 Install dependencies:

    $ npm install

 Start your MongoDb and Redis servers (assuming these are in your path):
 
    $ mongod -v
    $ ./redis-server --loglevel verbose
    
 Finally, fire up the application server:

    $ node app

 If all goes well, the startup message will show the url to copy to your browser to see the app in action.

## Running Tests

 To run the test suite, execute this command.  Note that the integration tests depend on an existing test 
 user, so be sure to create that and update the source code values.  Otherwise, some of these will bomb out:

    $ mocha --recursive --reporter spec

 To run the load test (runs for 2 minutes):

    $ node loadtest.js

## Todo

 Here are future additions to the framework.  Any help would be appreciated!
 
  * Converting the HTML to a responsive design with comments
  * Adding a REST API (with signed urls) with auto-generated developer documentation
  * iOS, Android, and Windows Phone sample apps demonstrating usage of the API
  * Sign in with Facebook, Google and Linked In
  * Rounding out the test suite
  * Bug fixes / architectural improvements
  * Better support for environment variables to connect to servers
  * Add friendly 404 and 500 pages
  * Continuous integration build server

## License 

(The MIT License)

Copyright (c) 2013 John Baumbach &lt;john.j.baumbach@gmail.com&gt;

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