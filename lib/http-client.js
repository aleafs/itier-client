/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * http-client : Simple http client for restful service
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

//var http = require('http');
var iRequest = require('./irequest');
var KeepaliveAgent = require('agentkeepalive');

exports.agent = new KeepaliveAgent({
  maxSockets: 200,
  maxKeepAliveTime: 60000 // max keep alive time
});

exports.create = function (options) {
  return new Client(options || {});
};

var iError  = function (error, code) {
  if (!error) {
    return null;
  }

  if (!(error instanceof Error)) {
    error   = new Error(error);
  }
  error.code = code;

  return error;
};

/* {{{ Client constructor() */
var Client  = function (options) {

  /**
   * @配置信息
   */
  this.options = {
    'prefix'    : '',       /**<    request url prefix          */
    'timeout'   : 25000,    /**<    request timeout (ms)        */
    'heartbeat' : 30000,    /**<    heartbeat interval(ms)      */
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
    (function _check() {
      var l = [];
      var m = _self.backup.length;
      var h = {
        'timeout'   : _self.options.timeout / 10,
      };
      _self.backup.forEach(function (item) {
        _self._call(item, 'GET', _self.options.pingurl, null, h, function (error, data, code) {
          if (!error && code >= 200 && code < 300) {
            l.push(item);
            _self.online = l;
          }
          if ((--m) === 0) {
            setTimeout(_check, _self.options.heartbeat);
          }
        });
      });
    })();

    this._heart = true;
  }

  return this;
}
/* }}} */

/* {{{ Client prototype get() */
Client.prototype.get = function (url, callback, headers, hostObj) {
  this._call(hostObj || this._host(), 'GET', url, null, headers, callback);
  return this;
}
/* }}} */

/* {{{ Client prototype post() */
Client.prototype.post = function (url, data, callback, headers, hostObj) {
  this._call(hostObj || this._host(), 'POST', url, data, headers, callback);
  return this;
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

/* {{{ private prototype _call() */
/**
 * 访问给定的机器
 *
 * @access private
 */
Client.prototype._call = function (host, method, url, data, headers, callback) {
  if (!host) {
    return callback(iError(new Error('Empty online list or bad server'), 'BadServer'));
  }

  headers = headers || {};
  data  = build_post_data(data);
  if (data) {
    headers['Content-Length'] = data.length;
  }

  var _self = this;
  var param = {
    host      : host.host,
    port      : host.port,
    path      : _self.options.prefix + url,
    method    : method,
    headers   : headers,
    agent     : _self.options.agent || exports.agent,
  };
  var timeout = headers.timeout || (_self.options.timeout + 10);
  param.timeout = timeout;

  iRequest(param, data, function(err, status, header, buf) {
    if (err) {
      if (err.code == 'REQUESTTIMEOUT') {
        err.name = 'RequestTimeoutError';
        err.message = 'Request Timeout after ' + timeout + 'ms.';
      } else if (err.name === 'Error') {
        err.name = 'RequestError';
      }
      if (err.message) {
        err.message += ' (' + host.host + ':' + host.port + ')';
      }
      callback(iError(err, (err.code == 'REQUESTTIMEOUT') ? 'RequestTimeout' : 'Unknown'));
    } else {
      callback(null, buf, status, header)
    }
  });
};
/* }}} */

/* {{{ private prototype _host() */
/**
 * 选择一台服务器
 *
 * @access private
 * @return Object
 */
Client.prototype._host = function () {
  this.reqnum++;
  if (this.online.length) {
    return this.online[this.reqnum % this.online.length];
  }

  if (this.backup.length) {
    return this.backup[this.reqnum % this.backup.length];
  }

  return null;
};
/* }}} */

