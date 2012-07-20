/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * http-client : Simple http client for restful service
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var http = require('http');
var spawn = require('child_process').spawn;

// change Agent.maxSockets to 1000
exports.agent = new http.Agent();
exports.agent.maxSockets = 1000;

exports.create = function (options) {
  return new Client(options || {});
};

/* {{{ Client constructor() */
var Client  = function (options) {

  /**
   * @配置信息
   */
  this.options = {
    'prefix'    : '',       /**<    request url prefix          */
    'timeout'   : 25000,    /**<    request timeout (ms)        */
    'heartbeat' : 60000,    /**<    heartbeat interval(ms)      */
    'pingurl'   : ''        /**<    心跳地址                    */
  };
  for (var idx in options) {
    this.options[idx] = options[idx];
  }

  /**
   * @备用机器列表
   */
  this.backup = [];

  /**
   * @在线机器列表
   */
  this.online = [];

  /**
   * @请求计数
   */
  this.reqnum = 0;

  /**
   * @心跳标记
   */
  this._heart = false;

}
/* }}} */

/* {{{ Client prototype bind() */
/**
 * Add a server to the servers' list
 *
 * @param host: String
 * @param port: Integer, optional
 * @return Object this
 */
Client.prototype.bind = function (host, port) {
  var item  = {
    host    : host,
    port    : port,
  };
  this.backup.push(item);
  if (true !== this._heart && this.options.pingurl) {
    var _self   = this;
    var _check  = function () {
      _self.backup.forEach(function (item) {
      });
    };

    this._heart = true;
  }

  return this;
}
/* }}} */

/* {{{ Client prototype get() */
Client.prototype.get = function (url, callback, header) {
  call_http_query(this, url, 'GET', null, header, callback);
  return this;
}
/* }}} */

/* {{{ Client prototype post() */
Client.prototype.post = function (url, data, callback, header) {
  call_http_query(this, url, 'POST', data, header, callback);
  return this;
}
/* }}} */

/* {{{ Client prototype walk() */
Client.prototype.walk = function (url, data, callback, method, header) {
  for (var i = 0; i < this.backup.length; i++) {
    call_http_query(this, url, method, data, header, callback, i);
  }
  return this;
}
/* }}} */

/* {{{ private function select_one_host() */
function select_one_host(obj) {
  var _list = [];
  if (obj.online.length < 1) {
    if (obj.backup.length < 1) {
      return false;
    }
    _list   = obj.backup;
  } else {
    _list   = obj.online;
  }

  return _list[obj.reqnum++ % _list.length];
}
/* }}} */

/* {{{ private function call_http_query() */
function call_http_query(_self, url, method, post, headers, callback, index) {
  var server = select_one_host(_self);
  if (!server || !server.host) {
    var error   = new Error('Empty online list or bad server id.');
    error.number    = 1000;
    error.name      = 'BadServer';
    return callback(error);
  }
  post = build_post_data(post);
  headers = headers || {};
  if (post) {
    headers['Content-Length'] = post.length;
  }
  var urlpath = _self.options.prefix + url;
  var params = {
    host      : server.host,
    port      : server.port,
    path      : urlpath,
    method    : method,
    headers   : headers,
    agent     : _self.options.agent || exports.agent,
  };
  var timeout = _self.options.timeout + 100;
  var timer = null;
  var client = http.request(params, function(res) {
    var chunks = [], size = 0;
    res.on('data', function(chunk) {
      size += chunk.length;
      chunks.push(chunk);
    });
    res.on('end', function() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      client.removeAllListeners('timeout');
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
      callback(null, data, res.statusCode, res.headers);
    });
  });
  timer = setTimeout(function() {
    timer = null;
    client.__isTimeout = true;
    client.abort();
  }, timeout);

  client.on('error', function(err) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    err.number = 1200;
    if (client.__isTimeout) {
      err.name = 'RequestTimeout';
      err.message = 'Request Timeout ' + timeout + 'ms.';
    }
    if (err.message) {
      err.message += ' (' + server.host + ':' + server.port + ')';
    }
    callback(err);
  });
  client.end(post);
}
/* }}} */

/* {{{ private function build_post_data() */
/**
 * Build http post data
 *
 * @param {Buffer|String|Object} data
 * @return {Buffer}
 * @private
 */
function build_post_data(data) {
  if (!data || Buffer.isBuffer(data)) return data;
  if (typeof data === 'string') {
    data = new Buffer(data);
  } else {
    data = new Buffer(JSON.stringify(data));
  }
  return data;
}
/* }}} */

