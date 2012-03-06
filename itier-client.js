/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * itier-client : Library for client to co communicate with itier
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var HTTP  = require('http');
var QUERY  = require('querystring');
var Events  = require('events');
var Util  = require('util');

/**
 * @缓存控制常量
 */
var CACHE  = {
  READ  : 1,
  WRITE  : 2,
};

/**
 * @默认配置
 */
var CONFIG  = {
  'version'  : '1.0',
  'timeout'  : 30,
  'usecache'  : CACHE.READ | CACHE.WRITE,
};

/**
 * @完整机器列表
 */
var SERVERS  = [];

/**
 * @可用机器列表
 */
var ONLINES  = [];

/**
 * @备用机器列表
 */
var BACKEND  = [];

/**
 * @请求计数
 */
var REQUEST  = 0;

/**
 * @不可用机器
 */
var OFFLINE  = {};

/**
 * @检查在线机器的定时器
 */
var __timer  = null;

/* {{{ function get_server_string() */
/**
 * 构造请求host
 *
 * @access private
 * @return string
 */
function get_server_string(obj) {
  return obj.host + ':' + obj.port;
}
/* }}} */

/* {{{ function push_to_offline() */
/**
 * 投入OFFLINE列表
 *
 * @access private
 * @return void
 */
function push_to_offline(key, off) {
  OFFLINE[key] = (new Date()).getTime() + (off ? 1000 * parseInt(off) : 300000);
  ONLINES  = [];
}
/* }}} */

/* {{{ function update_online_list() */
/**
 * 更新在线机器列表
 *
 * @access private
 * @return void
 */
function update_online_list() {
  var now  = (new Date()).getTime();
  var end  = '/sql?' + QUERY.stringify(CONFIG);

  var run  = [];
  for (var i = 0; i < SERVERS.length; i++) {
    var cfg  = SERVERS[i];
    var idx  = get_server_string(cfg);
    var opt  = {
      'host'    : cfg.host,
      'port'    : cfg.port,
      'path'    : end,
      'method'  : 'POST',
      'headers'  : {'x-app-name' : __USER, 'x-app-pass' : __PASS},
    };
    if (!OFFLINE[idx] || OFFLINE[idx] < now) {
      run.push({
        'idx'  : idx,
        'url'  : 'http://' + idx + end,
        'opt'  : opt,
      });
      delete OFFLINE[idx];
    }
  }

  ONLINES  = run;
}
/* }}} */

/* {{{ function select_one_host() */
/**
 * 选择一台服务器
 *
 * @access private
 * @return Object
 */
function select_one_host() {
  if (!ONLINES.length) {
    update_online_list();
  }

  if (!ONLINES.length) {
    return false;
  }

  return ONLINES[(REQUEST++) % ONLINES.length];
}
/* }}} */

/* {{{ private parse_response_data() */
/**
 * 解析数据包
 */
function parse_response_data(buf) {
  return JSON.parse(buf);
}
/* }}} */

var __USER  = '';
var __PASS  = '';
var ITier	= function (config) {

  if (!(this instanceof ITier)) {
    return new ITier(config);
  }

  for (var key in config) {
    CONFIG[key] = config[key];
  }

  Events.EventEmitter.call(this);
  this.removeAll();
}

Util.inherits(ITier, Events.EventEmitter);

/* {{{ prototype query() */
/**
 * 执行query
 *
 * @access public
 * callback: error, data, header
 */
ITier.prototype.query  = function (sql, data) {
  
  var _me  = this;
  var who  = select_one_host(_me);
  if (!who || !who.url || !who.opt) {
    _me.emit('error', '[1000] Empty online server list for itier.');
    return;
  }

  var req  = HTTP.request(who.opt, function(res) {
    var buffer	= '';
    res.on('data', function(buf) {
      buffer += buf;
    });
    res.on('end', function() {
      var header  = {};
      for (var idx in res.headers) {
        var val = res.headers[idx];
        var idx = idx.toLowerCase();
        var pos	= idx.indexOf('x-app-');
        if (pos >= 0) {
          header[idx.slice(pos + 6)] = val;
        }
      }

      if (200 != res.statusCode || '0' != header['status']) {
        _me.emit('error', '[2000] ' + buffer);
        return;
      }

      var profile = null;
      if (header.datalen) {
        profile = buffer.slice(header.datalen);
        buffer	= buffer.slice(0, header.datalen);
      }

      _me.emit('complete', parse_response_data(buffer), header, parse_response_data(profile));
    })
  });

  req.setTimeout(1000 * (CONFIG.timeout + 1), function() {
    _me.emit('error', '[1100] Request timeout for ' + who.url);
  });

  req.on('error', function(err) {
    if ('ECONNREFUSED' == err.code) {
      push_to_offline(who.idx, 1);
    }
    _me.emit('error', '[1200] ' + err + ' for ' + who.url);
  });
  req.end(QUERY.stringify({
    '__SQL__' : sql,
    '__VAR__' : data,
  }));
}
/* }}} */

/* {{{ prototype connect() */
/**
 * 注册itier机器
 *
 * @access public
 * @return this
 */
ITier.prototype.connect  = function(host, user, pass) {
  host	= host.split(':');
  SERVERS.push({
    'host'  : host[0],
    'port'  : host.length > 1 ? parseInt(host[1]) : 9999,
  });

  if (user) {
    __USER  = user;
  }
  if (pass) {
    __PASS  = pass;
  }

  if (!__timer) {
    __timer  = setInterval(update_online_list, 1000);
  }

  return this;
}
/* }}} */

/* {{{ prototype removeAll() */
/**
 * 清理所有数据
 *
 * @access public
 * @return this
 */
ITier.prototype.removeAll  = function() {
  SERVERS  = [];
  ONLINES  = [];
  BACKEND  = [];
  OFFLINE  = {};
  REQUEST  = 0;

  if (__timer) {
    clearInterval(__timer);
    __timer  = null;
  }
  return this;
}
/* }}} */

exports.CACHE  = CACHE;
exports.init  = function(config) {
  return ITier(config);
}

