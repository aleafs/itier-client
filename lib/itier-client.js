/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/**
 * itier-client : Library for client to co communicate with itier
 * Copyright(c) 2003 - 2012 Taobao.com
 * @author: zhangxc83@gmail.com
 */

var Client  = require(__dirname + '/http-client.js');

/**
 * @缓存控制常量
 */
var CACHE  = {
    READ    : 1,
    WRITE   : 2,
};

/**
 * @响应体头信息映射表
 */
var __HEADER_MAPS   = {
    'v'     : 'version',
    'c'     : 'status',
    'm'     : 'message',
    'n'     : 'row_num',
    'fn'    : 'column_num',
};

/* {{{ Itier constructor() */
var Itier   = function(option) {
    if (!(this instanceof Itier)) {
        return new Itier(option);
    }

    /**
     * @配置参数
     */
    this.options    = {
        'timeout'   : 25000,
        'version'   : '1.0',
        'appname'   : '',
        'apppass'   : '',
    };

    for (var i in option) {
        this.options[i] = option[i];
    }

    /**
     * @Http Client Object
     */
    this.httpclient = Client.create(this.options);

}
/* }}} */

/* {{{ Itier prototype connect() */
Itier.prototype.connect = function(host, port) {
    this.httpclient.bind(host, port || 9999);
    return this;
}
/* }}} */

/* {{{ Itier prototype query() */
Itier.prototype.query   = function(sql, data, callback, option) {
    var _me = this;
    var opt = {
        'x-app-name'    : _me.options.appname,
        'x-app-pass'    : _me.options.apppass,
        'x-app-timeout' : _me.options.timeout - 20,
        'x-itier-format': 'json',
        'x_itier_format': 'json',
    };

    for (var i in option) {
        opt['x-app-' + i] = option[i];
    }

    _me.httpclient.post('/sql?version=' + _me.options.version, {
        'sql'   : sql,
        'data'  : data,
    }, function(data, code, header) {
        if (200 != code) {
            callback(data.toString(), null, {
                'errno' : 2000,
                'error' : 'http response error.'
            });

            return;
        }

        var body    = JSON.parse(data);
        if (!body) {
            callback(data.toString(), null, {
                'errno' : 2001,
                'error' : 'response parse failed.'
            });
            return;
        }

        if ('200' != body.c && 200 != body.c) {
            callback(data.toString(), null, {
                'errno' : 2002,
                'error' : body.m,
            });
            return;
        }

        var msg = {
            'version'   : '1.0',
            'expire'    : -1,
        };

        for (var i in __HEADER_MAPS) {
            if (body[i]) {
                msg[__HEADER_MAPS[i]] = body[i];
            }
        }

        callback(null, build_itier_data(body.d, body.f), msg, []);
    }, opt);

    return this;
}
/* }}} */

/* {{{ private function build_itier_data() */
/**
 * 构造二维数据
 */
function build_itier_data(val, col)
{
    var ret = [];
    if (!col.length || !val.length) {
        return false;
    }

    for (var i = 0; i < val.length; i++) {
        var obj = {};
        for (var j = 0; j < col.length; j++) {
            obj[col[j]] = val[i][j];
        }
        ret.push(obj);
    }

    return ret;
}
/* }}} */

exports.CACHE   = CACHE;
exports.createClient = function(option) {
    return Itier(option);
}

