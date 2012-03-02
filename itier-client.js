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
var server	= [];

/**
 * @可用机器列表
 */
var online	= [];

/**
 * @请求计数
 */
var request	= 0;

/**
 * @不可用机器
 */
var offline	= {};

/**
 * @请求参数
 */
var option	= {
	'uname'	: '',							/**<	请求用户名	*/
	'tmout'	: 30,							/**<	请求超时	*/
	'cache'	: CACHE.READ | CACHE.WRITE,		/**<	缓存控制	*/
};

function update_online_list() {
	var ok	= [];
	var tm	= (new Date()).getTime();
	for (var i = 0; i < server.length; i++) {
		var url	= server[i];
		if (!offline[url] || offline[url] < tm) {
			ok.push(server[i]);
			delete offline[url];
		}
	}

	online	= ok;
}

function select_one_host() {
	if (!online.length) {
		update_online_list();
	}

	if (!online.length) {
		return false;
	}

	return server[(request++) % online.length];
}

function post_http_request() {
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
		callback('[1000] EmptyOnlineHost', null, null);
		return;
	}

	post_http_request('http://' + server);
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
	server.push(host);
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
	option[key]	= val;
	return this;
}
/* }}} */

exports.CACHE	= CACHE;
exports.init	= ITier;

