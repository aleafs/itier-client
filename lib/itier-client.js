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
    };

    for (var i in option) {
        opt['x-app-' + i] = option[i];
    }

    _me.httpclient.post('/sql?version=' + _me.options.version, {
        'sql'   : sql,
        'data'  : data,
    }, function(data, code, header) {
        var opt = {};
        for (var idx in header) {
            var val = header[idx];
            var idx = idx.toLowerCase();
            var pos = idx.indexOf('x-app-');
            if (pos > -1) {
                opt[idx.slice(6 + pos)] = val;
            }
        }

        if (200 != code || 200 != opt.status) {
            callback(data, null, {
                'errno' : 2000,
            });
            return;
        }

        var profile = null;
        if (opt.datalen) {
            profile = data.slice(opt.datalen);
            data    = data.slice(0, opt.datalen);
        }

        callback(null, JSON.parse(data), opt, JSON.parse(profile));
    }, opt);

    return this;
}
/* }}} */

exports.CACHE   = CACHE;
exports.createClient = function(option) {
    return Itier(option);
}

