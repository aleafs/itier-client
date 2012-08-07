[![Build Status](https://secure.travis-ci.org/aleafs/itier-client.png)](http://travis-ci.org/aleafs/itier-client)

[JS Coverage] /Users/aleafs/works/opensource/itier-client/lib/http-client.js:90.54%

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

# TODO

* Query options support, such as "usecache" and "debug" [done];
* Get itier service status and hosts list from config-server;

# Authors

Below is the output from `git-summary`.

```
 project: itier-client
  commits: 92
  files  : 10
  authors: 
    69  aleafs                  75.0%
    15  fengmk2                 16.3%
     8  Jackson Tian            8.7%
```
