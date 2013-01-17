# Connect Heroku Redis

Connect Heroku Redis is a wrapper for [connect-redis](https://github.com/visionmedia/connect-redis) using Heroku Redis to Go.

See: http://devcenter.heroku.com/articles/redistogo      
      
## Installation

    $ npm install connect-heroku-redis
    
## Features

  * Detects Heroku Redis to Go url on the environment and defaults it onto the RedisStore options.
  * Defaults to local store if Heroku Redis to Go environment variable is not detected.
    
## Examples

    var connect = require('connect'), 
        HerokuRedisStore = require('connect-heroku-redis')(connect);

    connect.createServer(
      connect.cookieParser(),
      // 5 minutes
      connect.session({ store: new HerokuRedisStore, secret: 'keyboard cat' })
    );
    
## License

Copyright (C) 2011 by Michael Hemesath <mike.hemesath@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.