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
  appname: 'username',
  apppass: 'password',
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
```

# TODO

* Query options support, such as "usecache" and "debug" [done];
* Get itier service status and hosts list from config-server;

# Authors

Below is the output from `git-summary`.

```
 project: itier-client
 commits: 53
 files  : 10
 authors: 
    52  aleafs                  98.1%
     1  fengmk2                 1.9%
```