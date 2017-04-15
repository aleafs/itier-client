/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
// +--------------------------------------------------------------------+
// | (C) 2011-2012 Alibaba Group Holding Limited.                       |
// | This program is free software; you can redistribute it and/or      |
// | modify it under the terms of the GNU General Public License        |
// | version 2 as published by the Free Software Foundation.            |
// +--------------------------------------------------------------------+

var http    = require('http');

function debug(str) {
  //console.log(str);  
}

/**
 * Build http post data
 *
 * @param {Buffer|String|Object} data
 * @return {Buffer}
 * @private
 */
function buildData(data) {
  if (Buffer.isBuffer(data)) {
    return data;
  } else if ((typeof data) === 'string') {
    return new Buffer(data);
  } else if (!data) {
    return '';
  }
  return new Buffer(JSON.stringify(data));
}

module.exports = function(options, body, cb) {
  request(options, body, function(err, sts, headers, buf){
    //debug('request callback here');
    if (err && err.code == 'ECONNRESET') {
      //debug('will retry again in 5ms ... ');
      setTimeout(function(){
        request(options, body, cb);
      }, 50);
    } else {
      cb(err, sts, headers, buf);  
    }
  })
}

function request(options, body, cb) {
  if (!options.headers) {
    options.headers = {};
  }
  body  = buildData(body);
  if (body.length) {
    options.headers['Content-Length'] = body.length;
  }

  var timer = null;
  var tmout = options.timeout || 15000;

  function onceCb() {
    if (timer) {
      clearTimeout(timer);
      timer = null;

      var args = arguments;
      process.nextTick(function(){
        cb.apply(null, args)
      });
    }
  }

  var req = http.request(options, function(res) {
    var chunks = [], size = 0;
    res.on('data', function(chunk) {
      size += chunk.length;
      chunks.push(chunk);
    });
    res.on('end', function() {
      var data = null;
      switch(chunks.length) {
        case 0:
          data = new Buffer(0);
          break;
        case 1:
          data = chunks[0];
          break;
        default:
          data = new Buffer(size);
          for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
            chunks[i].copy(data, pos);
            pos += chunks[i].length;
          }
          break;
      }
      onceCb(null, res.statusCode, res.headers, data);
    });

    res.on('error', function(err){
      onceCb(err);
    });
  });

  var toFlag = false;
  timer = setTimeout(function() {
    req.abort();
    toFlag = true;
  }, tmout);

  req.on('error', function(err){
    if (toFlag) {
      err = new Error('RequestTimeout After : ' + tmout);
      err.code = 'REQUESTTIMEOUT';
    }
    onceCb(err);
  });

  req.end(body);
}

