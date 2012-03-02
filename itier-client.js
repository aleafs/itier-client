/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

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
	'username'	: '',
	'timeout'	: 30,
};

/* {{{ function update_online_list() */
/**
 * 更新可用机器列表
 */
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
/* }}} */

/* {{{ function select_one_host() */
function select_one_host() {
	if (!online.length) {
		update_online_list();
	}

	if (!online.length) {
		return false;
	}

	return server[(request++) % online.length];
}
/* }}} */

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
 */
ITier.prototype.query	= function (sql, data, callback) {
	var server	= select_one_host();
	if (!server) {
		callback('[1000] ', null);
		return;
	}


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

exports.instance	= function () {
	return new ITier;
}

