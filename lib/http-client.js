/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * http-client : Simple http client for restful service
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var HTTP    = require('http');

/* {{{ Client constructor() */
var Client  = function (name, option) {

    /**
     * @配置信息
     */
    this.option = {
        'prefix'    : '',       /**<    request url prefix          */
        'timeout'   : 25,       /**<    request timeout (seconds)   */
    };

    /**
     * @机器列表
     */
    this.server = [];

    for (var idx in option) {
        this.option[idx] = option[idx];
    }
}
/* }}} */

/* {{{ Client prototype server() */
/**
 * Add a server to the servers' list
 *
 * @param host: String
 * @param port: Integer, optional
 * @return Object this
 */
Client.prototype.server = function (host, port) {
    this.server.push({
        'host'  : host, 'port' : port,
    });
    return this;
}
/* }}} */

/* {{{ Client prototype query() */
Client.prototype.query  = function (url, post, callback, method, server) {
}
/* }}} */

/* {{{ Client prototype walk() */
Client.prototype.walk   = function (url, post, callback, method) {
    for (var i = 0; i < this.server.length; i++) {
        this.query(url, post, callback, method, i);
    }
}
/* }}} */

/* {{{ Client prototype clean() */
Client.prototype.clean  = function () {
    this.server = [];
    return this;
}
/* }}} */

/* {{{ exports instance() */

/**
 * @sington objects list
 */
var __client_object = {};

/**
 * @count of objects
 */
var __client_number = 0;
exports.instance    = function (name, option) {
    if (!name) {
        name    = '__' + __client_number;
    } else {
        name    = name.toLowerCase();
    }
    if (!__client_object[name]) {
        __client_object[name]   = new Client(name, option || {});
        __client_number++;
    }

    return __client_object[name];
}
/* }}} */

