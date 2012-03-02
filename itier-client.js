/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * itier-client : Library for client to co communicate with itier
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

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
 * @请求计数
 */
var REQUEST	= 0;

/**
 * @不可用机器
 */
var OFFLINE	= {};

/**
 * @请求参数
 */
var OPTIONS	= {
	'uname'	: '',							/**<	请求用户名	*/
	'tmout'	: 30,							/**<	请求超时	*/
	'cache'	: CACHE.READ | CACHE.WRITE,		/**<	缓存控制	*/
};

function update_online_list() {
	var ok	= [];
	var tm	= (new Date()).getTime();
	for (var i = 0; i < SERVERS.length; i++) {
		var url	= SERVERS[i];
		if (!OFFLINE[url] || OFFLINE[url] < tm) {
			ok.push(SERVERS[i]);
			delete OFFLINE[url];
		}
	}

	ONLINES	= ok;
}

function select_one_host() {
	if (!ONLINES.length) {
		update_online_list();
	}

	if (!ONLINES.length) {
		return false;
	}

	return ONLINES[(REQUEST++) % ONLINES.length];
}

var ITier	= function () {
	if (!(this instanceof ITier)) {
		return new ITier;
	}
}

/* {{{ prototype query() */
/**
 * 执行query
 *
 * @access public
 * callback: error, data, option
 */
ITier.prototype.query	= function (sql, data, callback) {
	var server	= select_one_host();
	if (!server) {
		callback('[1000] Empty Online Host', null, null);
		return;
	}

	var http	= require('http');
	var itier	= http.request({
		'host'		: '127.0.0.1',
		'port'		: 33750,
		'path'		: '',
		'method'	: 'POST',
	}, function(res) {
		console.log(itier);
	});

	itier.setTimeout(OPTIONS.tmout, function() {
		callback('[1100] Request timeout after ' + OPTIONS.tmout + ' second(s)', null, null);
	});

	itier.on('error', function(err) {
		callback('[2100] server throw error as "' + err + '"', null, null);
	});

	itier.end();
}
/* }}} */

/* {{{ prototype server() */
/**
 * 注册itier机器
 *
 * @access public
 * @return this
 */
ITier.prototype.server	= function (host) {
	SERVERS.push(host);
	return this;
}
/* }}} */

/* {{{ prototype option() */
/**
 * 设置请求参数
 *
 * @access public
 * @return this
 */
ITier.prototype.option	= function (key, val) {
	OPTIONS[key] = val;
	return this;
}
/* }}} */

exports.CACHE	= CACHE;
exports.init	= ITier;

