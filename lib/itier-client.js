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
 * @数据返回格式
 */
var FETCH  = {
    ARRAY   : 1,
    ASSOC   : 2,
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
        'fetchmode' : FETCH.ASSOC,
    };

    for (var i in option) {
        this.options[i] = option[i];
    }

    /**
     * @Http Client Object
     */
    this.client = Client.create(this.options);

}
/* }}} */

/* {{{ Itier prototype connect() */
Itier.prototype.connect = function(host, port) {
    this.client.bind(host, port || 9999);
    return this;
}
/* }}} */

/* {{{ Itier prototype query() */
Itier.prototype.query   = function(sql, data, callback, extra) {
    var option  = {
        'x-app-name'    : this.options.appname,
        'x-app-pass'    : this.options.apppass,
        'x-app-timeout' : this.options.timeout - 20,
        'x-itier-format': 'json',
        'x_itier_format': 'json',
    };

    for (var i in extra) {
        option['x-app-' + i] = extra[i];
    }

    var _me = this;
    _me.client.post('/sql?version=' + _me.options.version, {
        'sql'   : sql,
        'data'  : data,
    }, function(error, data, code, header) {
        if (error instanceof Error) {
            callback(error);
            return;
        }

        try {
            var body    = JSON.parse(data);
            if (200 != body.c && '200' != body.c) {
                var error   = new Error(body.m ? body.m : data);
                error.code  = 'ItierError';
            }
        } catch (e) {
            if (200 != code && '200' != code) {
                var error   = new Error(data);
                error.code  = 'HttpError';
            } else {
                var error   = e;
            }
        }

        if (!error && '1.0' != body.v) {
            var error   = new Error('Unexpected version as ' + body.v);
            error.code  = 'ItierError';
        }

        if (error instanceof Error) {
            callback(error);
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

        if (FETCH.ARRAY == _me.options.fetchmode) {
            data    = body.d;
            msg.columns = body.f;
        } else {
            data    = build_itier_data(body.d, body.f);
        }

        callback(null, data, msg, []);
    }, option);

    return this;
}
/* }}} */

/* {{{ private function parse_itier_response() */
/**
 * Parse Itier response body
 * @param error, Error Object
 * @param data : http response body, maybe a json string
 * @param code : Http response code
 * @param extra: Http response header
 */
function parse_itier_response(error, data, code, extra)
{
}
/* }}} */

/* {{{ private function build_itier_data() */
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
exports.FETCH   = FETCH;
exports.createClient = function(option) {
    return Itier(option);
}

