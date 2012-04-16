/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * itier-client : Library for client to co communicate with itier
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var Client  = require('./http-client.js');

/**
 * @缓存控制常量
 */
var CACHE  = {
  READ    : 1,
  WRITE   : 2,
};

/**
 * @数据返回格式
 */
var FETCH  = {
  ARRAY   : 1, // [[], [], ...]
  ASSOC   : 2, // [{}, {}, ...]
};

/**
 * @响应体头信息映射表
 */
var __HEADER_MAPS   = {
    'v'     : 'version',
    'c'     : 'status',
    'm'     : 'message',
    'n'     : 'row_num',
    'fn'    : 'column_num',
};

/* {{{ Itier constructor() */
function Itier(options) {
  if (!(this instanceof Itier)) {
    return new Itier(options);
  }

  /**
   * @配置参数
   */
  this.options = {
    timeout   : 25000,
    version   : '1.0',
    appname   : '',
    apppass   : '',
    fetchmode : FETCH.ASSOC,
  };

  for (var i in options) {
    this.options[i] = options[i];
  }

  /**
   * @Http Client Object
   */
  this.client = Client.create(this.options);
}
/* }}} */

/* {{{ Itier prototype connect() */
Itier.prototype.connect = function(host, port) {
  this.client.bind(host, port || 9999);
  return this;
}
/* }}} */

/* {{{ Itier prototype query() */
/**
 * Query ITier by SQL.
 * @param  {String}   sql, normal sql like `SELECT * from test.user where uid = : uid`.
 * @param  {Object}   data, sql params: { uid: 123 }.
 * @param  {Function(err, rows, infos)} callback
 * @param  {Object}   extra, extra request headers. 
 *  - {Number} expire, cache expire time, when set `0` for this, meaning no cache.
 * @return {ITierClient}
 * @public
 */
Itier.prototype.query = function(sql, data, callback, extra) {
  if (typeof sql === 'string') {
    sql = sql.trim();
  }
  var option  = {
    'x-app-name'    : this.options.appname,
    'x-app-pass'    : this.options.apppass,
    'x-app-timeout' : this.options.timeout - 20,
    'x-itier-format': 'json',
    'x_itier_format': 'json',
  };

  for (var i in extra) {
    option['x-itier-' + i] = extra[i];
  }

  var url = '/sql?version=' + this.options.version;
  var fetchmode = this.options.fetchmode
  var args = {
    sql   : sql,
    data  : data,
  };
  if (data) {
    // support WHERE id in (:id), should set `args.type = { id: 'array|string' }`.
    var type = null;
    for (var k in data) {
      var val = data[k];
      if (Array.isArray(val)) {
        if (!type) {
          type = {};
        }
        type[k] = 'array|string';
      }
    }
    if (type) {
      args.type = type;
    }
  }
  this.client.post(url, args, function(error, data, code, header) {
    var body = null;
    if (!error) {
      try {
        body = JSON.parse(data) || {};
        // TODO: need to remove "hbase status code error: 404" when ITier support hbase 404
        if (200 !== body.c && body.m !== 'hbase status code error: 404') {
          var msg = body.m || 'Itier error';
          if (typeof msg !== 'string') {
            msg = JSON.stringify(msg);
          }
          error = new Error(msg);
          error.name = 'ITierError';
          error.body = body;
        }
      } catch (e) {
        if (200 !== code) {
          error = new Error('HTTP ' + code + ' Response');
          error.name = 'ITierHttpError';
          error.body = data ? data.toString() : data;
        } else {
          error = e;
        }
      }
    }

    // TODO: need check version?
    if (!error && '1.0' !== body.v) {
      error = new Error('Unexpected version as ' + body.v);
      error.name = 'ItierError';
    }

    if (error) return callback(error);

    var msg = {
      version: '1.0',
      expire : -1,
    };

    for (var i in __HEADER_MAPS) {
      if (body[i]) {
        msg[__HEADER_MAPS[i]] = body[i];
      }
    }

    if (FETCH.ARRAY === fetchmode) {
      data = body.d;
      msg.columns = body.f;
    } else {
      data = build_itier_data(body.d, body.f);
    }
    callback(null, data, msg, []);
  }, option);

  return this;
}
/* }}} */

/* {{{ private function build_itier_data() */
function build_itier_data(val, col) {
  if (!val || !col || col.length === 0 || val.length === 0) {
    return [];
  }

  var ret = [];
  for (var i = 0, l = val.length; i < l; i++) {
    var obj = {};
    for (var j = 0, jl = col.length; j < jl; j++) {
      obj[col[j]] = val[i][j];
    }
    ret.push(obj);
  }

  return ret;
}
/* }}} */

exports.CACHE = CACHE;
exports.FETCH = FETCH;
exports.createClient = function(options) {
  return Itier(options);
}
exports.HttpClient = Client;
