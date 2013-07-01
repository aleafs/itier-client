/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * itier-client : Library for client to co communicate with itier
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var EventEmitter = require('events').EventEmitter;
var Client  = require(__dirname + '/http-client.js');
var VERSION = require(__dirname + '/../package.json').version;

/**
 * @缓存控制常量
 */
var CACHE = {
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

// like: `OTSMetaNotMatch : Primary key from request not match with the schema`
var ERROR_MESSAGE_RE = /^(\w+?)(?:Error)? : (.+)$/;
// `Error: DataSource : myfox, RequestTimeout`
var ERROR_MESSAGE_SPLIT_RE = /^Error: (.+)$/;
// no available|avaible host list for :ots
// Error: No Checked OK Hosts Now
var ERROR_NO_AVAILABLE_SERVER_RE = /(?:^no (?:available|avaible) host list for|No Checked OK Hosts Now)/i;
// DataSource : myfox,
// DataSource : auction,
var DATA_SOURCE_RE = /DataSource : ([^\s,]+)/;
var REQUEST_TIMEOUT_RE = /RequestTimeout/i;
var QUEUE_TIMEOUT_RE = /QueueTimeout/i;

/* {{{ Itier constructor() */
function Itier(options) {
  if (!(this instanceof Itier)) {
    return new Itier(options);
  }

  /**
   * @配置参数
   */
  this.options = {
    'timeout'   : 25000,
    'version'   : '1.0',
    'appname'   : '',
    'username'  : '',
    'password'  : '',
    'fetchmode' : FETCH.ASSOC,
    'heartbeat' : 10000,
    'pingurl'   : '/status.taobao'
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

/*{{{ Itier prototype connectIservice() */
Itier.prototype.useIservice = function (service) {
  this.service = service;
};
/*}}}*/

/* {{{ Itier prototype connect() */
Itier.prototype.connect = function (host, port) {
  this.client.bind(host, port || 80);
  return this;
};
/* }}} */

Itier.prototype._formatError = function (body) {
  var msg = body.m || 'Itier error';
  if (typeof msg !== 'string') {
    msg = JSON.stringify(msg);
  }
  var name = 'Error';
  // format error message
  var m = ERROR_MESSAGE_RE.exec(msg);
  if (m) {
    name = m[1] + 'Error';
    msg = m[2];
  } else if (ERROR_NO_AVAILABLE_SERVER_RE.test(msg)) {
    name = 'NoAvailableServerError';
  }

  m = ERROR_MESSAGE_SPLIT_RE.exec(msg);
  if (m) {
    msg = m[1];
  }

  var datasource = DATA_SOURCE_RE.exec(msg);
  if (datasource) {
    datasource = datasource[1];
    if (name.indexOf(datasource) < 0) {
      name = datasource[0].toUpperCase() + datasource.substring(1) + name;
    }
  }
  if (REQUEST_TIMEOUT_RE.test(msg) && !REQUEST_TIMEOUT_RE.test(name)) {
    name = name.replace(/Error$/, 'RequestTimeoutError');
  }
  if (QUEUE_TIMEOUT_RE.test(msg) && !QUEUE_TIMEOUT_RE.test(name)) {
    name = name.replace(/Error$/, 'QueueTimeoutError');
  }
  if (name === 'Error') {
    name = 'ITierError';
  }
  var err = new Error(msg);
  err.name = name;
  err.body = body;
  return err;
};

/* {{{ Itier prototype query() */
/**
 * Query ITier by SQL.
 * @param  {String}   sql, normal sql like `SELECT * from test.user where uid = : uid`.
 * @param  {Object}   data, sql params: { uid: 123 }.
 * @param  {Function(err, rows, infos)} callback
 * @param  {Object}   extra, extra request headers.
 * @param  {Number} fetchmode switch default fetchmode,
 *  - {Number} expire, cache expire time, when set `0` for this, meaning no cache.
 *  - {String} blackhole, name of blackhole
 * @return {ITierClient}
 * @public
 */
Itier.prototype.query = function (sql, data, callback, extra, fetchmode) {
  if (typeof sql === 'string') {
    sql = sql.trim();
  }
  var options = {
    'User-Agent'        : 'itier-client@' + VERSION,
    'x-itier-appname'   : this.options.appname,
    'x-itier-username'  : this.options.username || this.options.appname,
    'x-itier-password'  : this.options.password,
    'x-itier-timeout'   : this.options.timeout - 20,
    'x-itier-format'    : 'json',
  };

  for (var i in extra) {
    options['x-itier-' + i] = extra[i];
  }

  var url  = (extra && extra.blackhole ? '/blackhole/' + extra.blackhole : '/sql') + '?me=' + this.options.appname;
  var args = {
    sql   : sql,
    data  : data,
  };
  fetchmode = fetchmode ? fetchmode : this.options.fetchmode;
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
      } else if (typeof val === 'number') {
        if (!type) {
          type = {};
        }
        type[k] = 'int';
      }
    }
    if (type) {
      args.type = type;
    }
  }
  var self = this;
  this.client.post(url, args, function (error, data, code, header) {
    var realhost = header && header['x-itier-realhost'];
    var body = null;
    if (!error) {
      try {
        body = JSON.parse(data) || {};
        if (200 !== body.c) {
          error = self._formatError(body);
        }
      } catch (e) {
        if (200 !== code) {
          error = new Error('HTTP ' + code + ' Response');
          error.name = 'ITierHttpError';
        } else {
          error = e;
        }
        error.body = data ? data.toString() : data;
      }
    }

    // TODO: need check version?
    if (!error && '1.0' !== body.v) {
      error = new Error('Unexpected version as ' + body.v);
      error.name = 'ItierVersionError';
      error.body = body;
    }

    if (error) {
      if (realhost) {
        error.host = realhost;
      }
      if (error.name === 'RequestTimeoutError' || error.name === 'RequestError') {
        error.name = 'ITierClient' + error.name;
      }
      return callback(error);
    }

    var infos = {
      version: '1.0',
      expire : -1,
    };
    if (realhost) {
      infos.host = realhost;
    }

    for (var i in __HEADER_MAPS) {
      if (body[i]) {
        infos[__HEADER_MAPS[i]] = body[i];
      }
    }
    if (FETCH.ARRAY === fetchmode) {
      data = body.d;
      infos.columns = body.f;
    } else {
      data = build_itier_data(body.d, body.f);
    }
    callback(null, data, infos, []);
  }, options, this.service ? this.service.get() : null);

  return this;
};
/* }}} */

/* {{{ Itier prototype status() */
Itier.prototype.status = function (name, callback) {
  this.client.get('/status/' + name.trim(), function (error, data, code) {
    if (Buffer.isBuffer(data)) {
      data = data.toString();
    }

    var rows = null;
    if (!error) {
      if (200 === code) {
        rows = [];
        data.split("\n").forEach(function (item) {
          var row = item.split("\t");
          switch (row.length) {
            case 0:
              break;
            case 1:
              rows.push(row[0]);
              break;
            default:
              rows.push({'Variable_name': row[0], 'Value': row[1]});
              break;
          }
        });
      } else {
        error = new Error('code ' + code + ', ' + data);
        error.name = 'ITierStatusError';
        error.url = '/status/' + name;
      }
    }
    callback(error, rows);
  }, null, this.service ? this.service.get() : null);
};
/* }}} */

/* {{{ Itier prototype explain() */
Itier.prototype.explain = function (sql, data, callback) {
  var _self = this;
  this.query(sql, data, function (error, plans) {
    if (error || !Array.isArray(plans)) {
      callback(error, plans);
      return;
    }

    var _waits  = 0;
    plans.forEach(function (plan, index) {
      if ('myfox' !== plan.db) {
        return;
      }

      _waits++;
      var _body = {'query' : plan.sql};
      _self.client.post('/explain/myfox', _body, function (error, data, code) {
        if (!error && data) {
          try {
            plans[index].__subplan = JSON.parse(data.toString().trim()); 
          } catch (e) {
          }
        }
        if ((--_waits) === 0) {
          callback(null, plans);
        }
      }, null, this.service ? this.service.get() : null);
    });

    if (!_waits) {
      callback(error, data);
    }
  }, {'explain'   : 1});
};
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
exports.createClient = function (options) {
  return new Itier(options);
};

exports.HttpClient = Client;
