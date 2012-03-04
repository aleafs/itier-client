/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * livebox : A simple load balance selector
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var LiveBox	= function(name) {

	/**
	 * @唯一标识
	 */
	this.identify	= name;

	/**
	 * @请求计数器
	 */
	this.request	= 0;

	/**
	 * @所有服务器
	 */
	this.servers	= [];

	/**
	 * @在线列表
	 */
	this.onlines	= [];

	/**
	 * @下线列表
	 */
	this.offline	= {};

}

/* {{{ private function update_online_list() */
/**
 * 更新online列表
 */
function update_online_list(obj) {
	var tmp	= [];
	var now	= (new Date()).getTime();
	for (var i = 0; i < obj.servers.length; i++) {
		var _me	= obj.servers[i];
		if (!obj.offline[_me.idx] || now >= obj.offline[_me.idx]) {
			tmp.push(_me.cfg);
			delete obj.offline[_me.idx];
		}
	}

	obj.onlines	= tmp;
}
/* }}} */

/* {{{ public prototype push() */
/**
 * 注册一个选择对象
 */
LiveBox.prototype.push	= function(idx, config) {
	this.onlines	= [];
	this.servers.push({
		'idx'	: idx,
		'cfg'	: config,
	});

	return this;
}
/* }}} */

/* {{{ public prototype fetch() */
/**
 * 选择一个对象
 */
LiveBox.prototype.fetch	= function() {
	if (!this.onlines || !this.onlines.length) {
		update_online_list(this);
	}

	if (!this.onlines.length) {
		return false;
	}

	return this.onlines[(this.request++) % this.onlines.length];
}
/* }}} */

/* {{{ public prototype pause() */
/**
 * 暂停某个对象的取出
 */
LiveBox.prototype.pause	= function(idx, off) {
	this.onlines	= [];
	this.offline[idx]	= (new Date()).getTime() + 1000 * (off ? parseInt(off) : 60);
	return this;
}
/* }}} */

/**
 * @单例模式，存放已经注册的对象
 */
var __livebox_instances	= {};

/**
 * @offline检查定时器
 */
var __timer_for_offline	= null;

exports.removeAll	= function() {
	__livebox_instances	= {};
	if (__timer_for_offline) {
		clearInterval(__timer_for_offline);
		__timer_for_offline	= null;
	}
}

exports.instance	= function(idx) {
	idx	= idx.toString().toLowerCase();
	if (!__livebox_instances[idx]) {
		__livebox_instances[idx] = new LiveBox(idx);
	}

	if (!__timer_for_offline) {
		__timer_for_offline	= setInterval(function() {
			for (var i in __livebox_instances) {
				update_online_list(__livebox_instances[i]);
			}
		}, 1000);
	}

	return __livebox_instances[idx];
}

