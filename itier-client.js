/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * itier-client : Library for client to co communicate with itier
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var HTTP	= require('http');
var QUERY	= require('querystring');
var Events	= require('events');
var Util	= require('util');

/**
 * @缓存控制常量
 */
var CACHE	= {
	READ	: 1,
	WRITE	: 2,
};

/**
 * @完整机器列表
 */
var SERVERS	= [];

/**
 * @可用机器列表
 */
var ONLINES	= [];

/**
 * @备用机器列表
 */
var BACKEND	= [];

/**
 * @请求计数
 */
var REQUEST	= 0;

/**
 * @不可用机器
 */
var OFFLINE	= {};

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
	OFFLINE[key]	= (new Date()).getTime() + (off ? 1000 * parseInt(off) : 300000);
}
/* }}} */

/* {{{ function update_online_list() */
/**
 * 更新在线机器列表
 *
 * @access private
 * @return void
 */
function update_online_list(obj) {
	var now	= (new Date()).getTime();
	var end	= '/sql?' + QUERY.stringify(obj.config);

	var run	= [];
	for (var i = 0; i < SERVERS.length; i++) {
		var cfg	= SERVERS[i];
		var idx	= get_server_string(cfg);
		if (!OFFLINE[idx] || OFFLINE[idx] < now) {
			run.push({
				'idx'	: idx,
				'url'	: 'http://' + idx + end,
				'opt'	: {
					'host'		: cfg.host,
					'port'		: cfg.port,
					'path'		: end,
					'method'	: 'POST',
				},
			});
			delete OFFLINE[idx];
		}
	}

	ONLINES	= run;
}
/* }}} */

/* {{{ function select_one_host() */
/**
 * 选择一台服务器
 *
 * @access private
 * @return Object
 */
function select_one_host(obj) {
	if (!ONLINES.length) {
		update_online_list(obj);
	}

	if (!ONLINES.length) {
		return false;
	}

	return ONLINES[(REQUEST++) % ONLINES.length];
}
/* }}} */

var ITier	= function (config) {

	this.config	= {
		'version'	: '1.0',
		'timeout'	: 30,
		'usecache'	: CACHE.READ | CACHE.WRITE,
	};

	for (var key in config) {
		this.config[key] = config[key];
	}
}
Util.inherits(ITier, Events.EventEmitter);

/* {{{ prototype query() */
/**
 * 执行query
 *
 * @access public
 * callback: error, data, header
 */
ITier.prototype.query	= function (sql, data, cache) {
	
	var _me	= this;
	var who	= select_one_host(_me);

	if (!who || !who.url || !who.opt) {
		_me.emit('error', '[1000] Empty online server list for itier.');
		return;
	}

	var req	= HTTP.request(who.opt, function(res) {
		//console.log(res.headers);
		//console.log(res.statusCode);
		res.on('data', function(chunk) {
			console.log(chunk.toString());
		});
	});

	req.setTimeout(1000 * (this.config.timeout + 1), function() {
		_me.emit('error', '[1100] Request timeout for ' + who.url);
	});

	req.on('error', function(err) {
		if ('ECONNREFUSED' == err.code) {
			push_to_offline(who.idx);
		}
		_me.emit('error', '[1200] ' + err + ' for ' + who.url);
	});
	req.end('aa'/* 写入SQL */);
}
/* }}} */

/* {{{ prototype server() */
/**
 * 注册itier机器
 *
 * @access public
 * @return this
 */
ITier.prototype.server	= function(host, port) {
	SERVERS.push({
		'host'	: host,
		'port'	: port ? parseInt(port) : 80,
	});
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
ITier.prototype.removeAll	= function() {
	SERVERS	= [];
	ONLINES	= [];
	BACKEND	= [];
	OFFLINE	= {};
	REQUEST	= 0;
	return this;
}
/* }}} */

exports.CACHE	= CACHE;
exports.create	= function(config) {
	return new ITier(config);
}

