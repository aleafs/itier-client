/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * http-client : Simple http client for restful service
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var http = require('http');

// change Agent.maxSockets to 1000
exports.agent = new http.Agent();
exports.agent.maxSockets = 1000;

/* {{{ exports instance() */

/**
 * @sington objects list
 */
var __client_object = {};

/**
 * @count of objects
 */
var __client_number = 0;
exports.create  = function (option, name) {
  if (!name) {
    name    = '__' + __client_number;
  } else {
    name    = name.toLowerCase();
  }
  if (!__client_object[name]) {
    __client_object[name]   = new Client(option || {});
    __client_number++;
  }

  return __client_object[name];
}
/* }}} */

/* {{{ Client constructor() */
var Client  = function (option) {

  /**
   * @配置信息
   */
  this.option = {
    prefix    : '',       /**<    request url prefix          */
    timeout   : 25000,    /**<    request timeout (ms)        */
  };

  /**
   * @机器列表
   */
  this.server = [];

  /**
   * @请求计数
   */
  this.reqnum = 0;

  for (var idx in option) {
    this.option[idx] = option[idx];
  }
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
Client.prototype.bind   = function (host, port) {
  this.server.push({
    'host': host, 
  'port': port,
  });
  return this;
}
/* }}} */

/* {{{ Client prototype get() */
Client.prototype.get    = function (url, callback, header) {
  call_http_query(this, url, 'GET', null, header, callback);
  return this;
}
/* }}} */

/* {{{ Client prototype post() */
Client.prototype.post   = function (url, data, callback, header)
{
  call_http_query(this, url, 'POST', data, header, callback);
  return this;
}
/* }}} */

/* {{{ Client prototype walk() */
Client.prototype.walk   = function (url, data, callback, method, header) {
  for (var i = 0; i < this.server.length; i++) {
    call_http_query(this, url, method, data, header, callback, i);
  }
  return this;
}
/* }}} */

/* {{{ private function select_one_host() */
function select_one_host(obj)
{
  if (obj.server.length < 1) {
    return false;
  }

  return obj.reqnum++ % obj.server.length;
}
/* }}} */

/* {{{ private function call_http_query() */
function call_http_query(_self, url, method, post, headers, callback, index) {
  index = index == null ? select_one_host(_self) : index;
  var server = _self.server[index];
  if (!server) {
    var error   = new Error('Empty server list or bad server id.');
    error.number    = 1000;
    error.name      = 'BadServer';
    return callback(error);
  }
  post = build_post_data(post);
  headers = headers || {};
  if (post) {
    headers['Content-Length'] = post.length;
  }
  var urlpath = _self.option.prefix + url;
  var params = {
    host      : server.host,
    port      : server.port,
    path      : urlpath,
    method    : method,
    headers   : headers,
    agent     : _self.option.agent || exports.agent,
  };
  var timeout = _self.option.timeout + 100;
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
        case 0: data = new Buffer(0); break;
        case 1: data = chunks[0]; break;
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
  // client.setTimeout(timeout, function() {
  //     client.__isTimeout = true;
  //     client.abort();
  // });
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

