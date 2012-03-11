/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * http-client : Simple http client for restful service
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var HTTP    = require('http');

/* {{{ exports instance() */

/**
 * @sington objects list
 */
var __client_object = {};

/**
 * @count of objects
 */
var __client_number = 0;
exports.create  = function (option, name) {
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
        'timeout'   : 25000,    /**<    request timeout (ms)        */
    };

    /**
     * @机器列表
     */
    this.server = [];

    /**
     * @请求计数
     */
    this.reqnum = 0;

    /**
     * @错误处理
     */
    this.errorHandle    = function(msg, code) {
        throw new Error(code, msg);
    };

    for (var idx in option) {
        this.option[idx] = option[idx];
    }
}

/* }}} */

/* {{{ Client prototype setErrorHandle() */
/**
 * Set Error Handle
 *
 * @access public
 * @param  Function
 */
Client.prototype.setErrorHandle = function(call) {
    this.errorHandle    = call;
    return this;
}
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
Client.prototype.get    = function (url, callback, header) {
    call_http_query(this, url, 'GET', null, header, callback);
    return this;
}
/* }}} */

/* {{{ Client prototype post() */
Client.prototype.post   = function (url, data, callback, header)
{
    call_http_query(this, url, 'POST', data, header, callback);
    return this;
}
/* }}} */

/* {{{ Client prototype walk() */
Client.prototype.walk   = function (url, data, callback, method, header) {
    for (var i = 0; i < this.server.length; i++) {
        call_http_query(this, url, method, data, header, callback, i);
    }
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

/* {{{ private function call_http_query() */
function call_http_query(_self, url, method, post, header, callback, host)
{
    host    = host || select_one_host(_self);
    if ('number' != (typeof host) || !_self.server[host]) {
        call_error_handle(_self, 'Empty server list or bad server id.', 1000);
        return;
    }

    var client  = HTTP.request({
        'host'      : _self.server[host].host,
        'port'      : _self.server[host].port,
        'path'      : _self.option.prefix + url,
        'method'    : method,
        'headers'   : header,
    }, function(res) {
        var buffer  = '';
        res.on('data', function(buf) {
            buffer += buf;
        });
        res.on('end', function() {
            callback(buffer, res.statusCode, res.headers);
            buffer  = '';
        });
    });
    client.setTimeout(_self.option.timeout + 100, function() {
        call_error_handle(_self, 'Request timeout after ' + _self.option.timeout + ' millisecond(s).', 1100);
    });
    client.on('error', function(err) {
        call_error_handle(_self, err, 1200);
    });

    client.end(build_post_data(post));
}
/* }}} */

/* {{{ private function build_post_data() */
/**
 * Build http post data
 *
 * @access private
 * @param  Object / String / ...
 * @return String
 */
function build_post_data(data)
{
    if (data instanceof Buffer) {
        return data;
    }

    if (null == data || undefined == data) {
        return '';
    }

    return ('object' == (typeof data)) ? JSON.stringify(data) : data;
}
/* }}} */

/* {{{ private function call_error_handle() */
function call_error_handle(obj, msg, code)
{
    if ('function' == (typeof obj.errorHandle)) {
        obj.errorHandle(msg, code);
    }
}
/* }}} */

