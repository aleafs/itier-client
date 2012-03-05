/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * http-client : A simple http client library
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var HTTP	= require('http');
var URL		= require('url');
var Events	= require('events');
var Util	= require('util');

var Client	= function(config) {

	/**
	 * @配置属性
	 */
	this.config	= {
		'timeout'	: 20,
		'prefix'	: '',
	};

	for (var key in config) {
		this.config[key] = config[key];
	}

	/**
	 * @服务选择器
	 */
	this.online	= require(__dirname + '/livebox.js').instance();

	/**
	 * @集成事件
	 */
	Events.EventEmitter.call(this);
}

Util.inherits(Client, Events.EventEmitter);

/* {{{ public prototype add() */
/**
 * 添加机器
 */
Client.prototype.add	= function(host, port) {
	this.online.push({'host' : host, 'port' : port});
}
/* }}} */

/* {{{ public prototype apply() */
/**
 * 发起请求
 */
Client.prototype.apply	= function(url, post) {
	var obj	= this.online.fetch();
	if (!obj) {
		this.emit('error', '[1000] empty online server list');
		return;
	}

	if ('string' == (typeof url)) {
		url	= URL.parse(url);
	}

	console.log(url);
	var data	= null;
	var header	= null;

	this.emit('complete', data, header);
}
/* }}} */

/* {{{ public prototype get() */
/**
 * GET获取数据
 */
Client.prototype.get	= function(url, callback) {
	this.apply(url, null, callback);
}
/* }}} */

/* {{{ public prototype post() */
/**
 * POST获取数据
 */
Client.prototype.post	= function(url, data, callback) {
	this.apply(url, data, callback);
}
/* }}} */

exports.create	= function(config) {
	return new Client(config);
}

