/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should  = require('should');
var ITier   = require(__dirname + '/../');

/* {{{ mock itier service on 33750 */
var HTTP    = require('http').createServer(function(req, res) {
    if (req.headers['x-app-name'] == 'denied') {
        res.writeHead(401, {'WWW-Authenticate' : 'Basic realm="."'});
        res.end('Authenticate denied for "' + req.headers['x-app-name'] + '"');
        return;
    }

    req.on('data', function(buf) {
    });
    req.on('end', function() {
        var ret = JSON.stringify({
            'v' : '1.0',                /**<    数据格式版本号  */
            'c' : 200,                  /**<    请求返回码      */
            'm' : 'status ok',          /**<    响应消息        */
            't' : 2,                    /**<    数据总行数      */
            'n' : 2,                    /**<    此次请求返回总行数  */
            'fn': 2,                    /**<    字段数  */
            'f' : ['c1', 'c2'],         /**<    字段名  */
            'd' : [[1,2],[3,4]],        /**<    数据体  */
        });

        res.writeHead(200, {
            'Content-Type'  : 'text/plain',
        });

        res.end(ret);
    });
}).listen(33750);
/* }}} */

describe('itier-client-test', function() {

    /* {{{ should_select_data_from_itier_works_fine() */
    it('should_select_data_from_itier_works_fine', function(done) {
        var itier   = ITier.createClient();
        itier.connect('127.0.0.1', 33750);
        itier.query('SELECT * FROM myfox.table_info', null, function(error, data, header, profile) {
            data.should.eql([{'c1':1,'c2':2},{'c1':3,'c2':4}]);
            profile.should.eql([]);
            header.should.eql({
                'version'   : '1.0',
                'status'    : 200,
                'expire'    : -1,
                'message'   : 'status ok',
                'row_num'   : 2,
                'column_num': 2,
            });
            done();
        });
    });
    /* }}} */

    /* {{{ should_fetch_mode_equal_array_works_fine() */
    it('should_fetch_mode_equal_array_works_fine', function(done) {
        var itier   = ITier.createClient({
            'fetchmode' : ITier.FETCH.ARRAY,
        });
        itier.connect('127.0.0.1', 33750);
        itier.query('SELECT * FROM myfox.table_info', null, function(error, data, header, profile) {
            data.should.eql([[1,2],[3,4]]);
            header.columns.should.eql(['c1','c2']);
            done();
        });
    });
    /* }}} */

    /* {{{ should_appname_authorize_works_fine() */
    it('should_appname_authorize_works_fine', function(done) {
        var itier   = ITier.createClient({
            'appname'   : 'denied',
        });
        itier.connect('127.0.0.1', 33750);
        itier.query('SHOW TABLES', null, function(error, data, header, profile) {
            error.toString().should.include('Authenticate denied for "denied"');
            done();
        });
    });
    /* }}} */

});

after(function() {
    HTTP.close();
});

