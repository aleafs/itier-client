/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * http-client : A simple http client library
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var HTTP	= require('http');

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
}

Client.prototype.add	= function() {
}

Client.prototype.req	= function() {
}

Client.prototype.get	= function() {
}

Client.prototype.post	= function() {
}

exports.create	= function(config) {
	return new Client(config);
}

