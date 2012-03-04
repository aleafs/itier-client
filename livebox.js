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
	this.requests	= 0;

	/**
	 * @所有服务器
	 */
	this.servers	= [];

	/**
	 * @在线列表
	 */
	this.onlines	= [];

	/**
	 * @备用列表
	 */
	this.backend	= [];
	
	/**
	 * @下线列表
	 */
	this.offline	= {};

}

LiveBox.prototype.push	= function() {
}

LiveBox.prototype.fetch	= function() {
}

LiveBox.prototype.pause	= function() {
}

/**
 * @单例模式，存放已经注册的对象
 */
var __livebox_instances	= {};
exports.instance	= function(idx) {
	idx	= idx.toString().toLowerCase();
	if (!__livebox_instances[idx]) {
		__livebox_instances[idx] = new LiveBox(idx);
	}

	return __livebox_instances[idx];
}

