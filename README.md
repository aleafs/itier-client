[![Build Status](https://secure.travis-ci.org/aleafs/itier-client.png)](http://travis-ci.org/aleafs/itier-client)

itier-client is a client library for [ITier](https://github.com/xianbei/itier).

## Install
    
```bash
$ npm install itier
```

## Usage

```js
var itier = require('itier').createClient({
  appname: 'appname',
  password: 'password',
  timeout: 5000, // 5 seconds
});

// connect ITier servers
itier.connect('127.0.0.1', 9999).connect('127.0.0.2');

itier.query('SELECT * FROM table WHERE c1 = :c', { 
  'c' : 1211 
}, function (error, data, header, profile) {
  if (error) {
    throw new Error(error);
  }

  // write to cache
  cache.write(key, data, header.expire + now);
});

itier.status('lastdate', function (error, status) {
  console.log(status);
});
```

### how to use itier-client with iservice

```js
var itier = require('itier').createClient({
  appname: 'appname',
  password: 'password',
  timeout: 5000, // 5 seconds
});

// use iservice to create a service obj
var configClient = require('iservice-client').init({
  host : '127.0.0.1:12345', //iservice address
  cache : __dirname + '/run', //iservice cache address
}).createService().subscribe('itier');

// when ready event is emitted, add iservice object into itier client.
// then do anything you want
configClient.on('ready', function () {
  itier.useIservice(configClient);

  //do query
  itier.query('SELECT * FROM table WHERE c1 = :c', { 
    'c' : 1211 
  }, function(error, data, header, profile) {
    if (error) {
      throw new Error(error);
    }

    // write to cache
    cache.write(key, data, header.expire + now);
  });
});
```

## TODO

* Query options support, such as "usecache" and "debug" [done];
* Get itier service status and hosts list from config-server;

## TEST

unit test

```bash
$ make test
```

* jscoverage: [*92%*](http://fengmk2.github.com/coverage/itier.html)

```bash
$ make test-cov
```

## Authors

Below is the output from `git-summary`.

```bash
$ git summary 

project: itier-client
commits: 157
files  : 13
authors: 
105    aleafs                  66.9%
 33    fengmk2                 21.0%
 11    Jackson Tian            7.0%
  8    弈轩                  5.1%

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
