[![Build Status](https://secure.travis-ci.org/aleafs/itier-client.png)](http://travis-ci.org/aleafs/itier-client)

# About

itier-client is a client library for [ITier](https://github.com/xianbei/itier).

# Install
    
```bash
$ npm install itier
```

# Usage

```javascript
var itier = require('itier').createClient({
  appname: 'appname',
  password: 'password',
  timeout: 5000, // 5 seconds
});

// connect ITier servers
itier.connect('127.0.0.1', 9999).connect('127.0.0.2');

itier.query('SELECT * FROM table WHERE c1 = :c', { 
  'c' : 1211 
}, function(error, data, header, profile) {
  if (error) {
    throw new Error(error);
  }

  // write to cache
  cache.write(key, data, header.expire + now);
});

itier.status('lastdate', function(error, status) {
  console.log(status);
});
```

Use `agentkeepalive` on itier client:

```bash
# install agentkeepalive
$ npm install agentkeepalive
```

```js
var Agent = require('agentkeepalive');
var keepaliveAgent = new Agent({
  maxSockets: 100,
  maxKeepAliveTime: 60000 // keepalive for 60 seconds
});

var itier = require('itier').createClient({
  appname: 'appname',
  password: 'password',
  timeout: 5000, // 5 seconds
  agent: keepaliveAgent
});
```

# TODO

* Query options support, such as "usecache" and "debug" [done];
* Get itier service status and hosts list from config-server;

# TEST

unit test

```bash
$ make test
```

jscoverage: [*92%*](http://fengmk2.github.com/coverage/itier.html)

```bash
$ make test-cov
```

# Authors

Below is the output from `git-summary`.

```
 project: itier-client
 commits: 111
 active : 33 days
 files  : 14
 authors: 
    83  aleafs                  74.8%
    20  fengmk2                 18.0%
     8  Jackson Tian            7.2%
```

## License

(The MIT License)

Copyright &copy; 2012 aleafs <zhangxc83@gmail.com>

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