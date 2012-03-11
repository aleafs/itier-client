/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * http-client : Simple http client for restful service
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var Events  = require('events');
var HTTP    = require('http');
var Util	= require('util');
var Query   = require('querystring');

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
        __client_object[name]   = new Client(option || {});
        __client_number++;
    }

    return __client_object[name];
}
/* }}} */

/* {{{ Client constructor() */
var Client  = function (option) {

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

    /**
     * @请求计数
     */
    this.reqnum = 0;  

    for (var idx in option) {
        this.option[idx] = option[idx];
    }
}

Util.inherits(Client, Events.EventEmitter);

/* }}} */

/* {{{ Client prototype bind() */
/**
 * Add a server to the servers' list
 *
 * @param host: String
 * @param port: Integer, optional
 * @return Object this
 */
Client.prototype.bind   = function (host, port) {
    this.server.push({
        'host'  : host, 'port' : port,
    });
    return this;
}
/* }}} */

/* {{{ Client prototype get() */
Client.prototype.get    = function (url, header) {
    run_http_query(this, url, 'GET', null, header);
}
/* }}} */

/* {{{ Client prototype post() */
Client.prototype.post   = function (url, data, header)
{
    run_http_query(this, url, 'POST', data, header);
}
/* }}} */

/* {{{ Client prototype walk() */
Client.prototype.walk   = function (method, url, data, header) {
    for (var i = 0; i < this.server.length; i++) {
        run_http_query(this, url, method, data, header);
    }
}
/* }}} */

/* {{{ Client prototype clean() */
Client.prototype.clean  = function () {
    this.server = [];
    return this;
}
/* }}} */

/* {{{ private function select_one_host() */
function select_one_host(obj)
{
    if (obj.server.length < 1) {
        return false;
    }

    return (obj.reqnum++) % obj.server.length;
}
/* }}} */

/* {{{ private function run_http_query() */
function run_http_query(_self, url, method, post, header, host)
{
    host    = host || select_one_host(_self);
    if ('number' != (typeof host) || !_self.server[host]) {
        _self.emit('error', 'Empty server list or bad server id.');
        return;
    }

    var client  = HTTP.request({
        'host'      : _self.server[host].host,
        'port'      : _self.server[host].port,
        'path'      : _self.option.prefix + '/' + url,
        'method'    : method,
        'headers'   : header,
    }, function(res) {
        var buffer  = '';
        res.on('data', function(buf) {
            buffer += buf;
        });
        res.on('end', function() {
            _self.emit('data', buffer, res.statusCode, res.headers);
            buffer  = '';
        });
    });
    client.setTimeout(1000 * _self.option.timeout, function() {
        _self.emit('error', 'Request timeout after ' + _self.option.timeout + ' seconds.');
    });
    client.on('error', function(err) {
        _self.emit('error', err);
    });

    if (post && 1) {
        post = Query.stringify(post);
    } else {
        post = '';
    }

    client.end(post);
}
/* }}} */

