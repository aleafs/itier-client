/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

if (process.env.JSCOV) {
    var jscover = require('jscoverage');
    require = jscover.require(module);
    process.on('exit', jscover.coverage);
}

var should  = require('should');
var ITier   = require(__dirname + '/../', true);

/* {{{ mock itier service on 33750 */
var HTTP    = require('http').createServer(function(req, res) {
    if (req.headers['x-app-name'] == 'denied') {
        res.writeHead(401, {'WWW-Authenticate' : 'Basic realm="."'});
        res.end('Authenticate denied for "' + req.headers['x-app-name'] + '"');
        return;
    }
    var data = '';
    req.on('data', function(buf) {
        data += buf.toString();
    });
    req.on('end', function() {
        if (data.indexOf('hbase.t404') > 0) {
            var hbase404 = '{"v":"1.0","c":400,"m":"hbase status code error: 404","t":0,"n":0,"fn":0,"f":[],"d":[]}';
            return res.end(hbase404);
        }

        if (data.indexOf('objectErrorMessage') > 0) {
            var hbase404 = '{"v":"1.0","c":400,"m":{},"t":0,"n":0,"fn":0,"f":[],"d":[]}';
            return res.end(hbase404);
        }

        var ret = {
            'v' : '1.0',                /**<    数据格式版本号  */
            'c' : 200,                  /**<    请求返回码      */
            'm' : 'status ok',          /**<    响应消息        */
            't' : 2,                    /**<    数据总行数      */
            'n' : 2,                    /**<    此次请求返回总行数  */
            'fn': 2,                    /**<    字段数  */
            'f' : ['c1', 'c2'],         /**<    字段名  */
            'd' : [[1,2],[3,4]],        /**<    数据体  */
        };

        var headers = {
            'Content-Type'  : 'text/plain',
        };
        if ('x-itier-expire' in req.headers) {
            ret.d.push([100, req.headers['x-itier-expire']]);
        }
        res.writeHead(200, headers);

        res.end(JSON.stringify(ret));
    });
}).listen(33750);
/* }}} */

describe('itier-client-test', function() {
    var client = null;
    before(function() {
        client = ITier.createClient();
        client.connect('127.0.0.1', 33750);
    });

    /* {{{ should_select_data_from_itier_works_fine() */
    it('should_select_data_from_itier_works_fine', function(done) {
        client.query('SELECT * FROM myfox.table_info', null, function(error, data, header, profile) {
            data.should.eql([{'c1':1,'c2':2},{'c1':3,'c2':4}]);
            profile.should.eql([]);
            header.should.eql({
                'version'   : '1.0',
                'status'    : 200,
                'expire'    : -1,
                'message'   : 'status ok',
                'row_num'   : 2,
                'column_num': 2
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
            error.message.should.equal('HTTP 401 Response');
            error.body.should.equal('Authenticate denied for "denied"');
            done();
        });
    });
    /* }}} */

    it('should return [] when hbase 404', function(done) {
        client.query('select * from hbase.t404 where row = :r', { r: 123 }, function(err, rows) {
            should.not.exist(err);
            rows.should.length(0);
            done();
        });
    });

    it('error.message should be {} not [object Object]', function(done) {
        client.query('select * from objectErrorMessage', null, function(err, rows) {
            should.exist(err);
            err.message.should.equal('{}');
            err.name.should.equal('ITierError');
            should.not.exist(rows);
            done();
        });
    });

    it("should set `'x-itier-expire'` success", function(done) {
        client.query('select * from myfox.table_info', null, function(err, rows, headers) {
            should.not.exist(err);
            rows.should.length(3);
            rows[2].c2.should.equal('0');
            done();
        }, { expire: 0 });
    });
});

after(function() {
    HTTP.close();
});

