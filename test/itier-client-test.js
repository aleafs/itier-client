/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should  = require('should');
var ITier   = require(__dirname + '/../');
var pedding = require('./utils/pedding');

/* {{{ mock itier service on 33750 */
var HTTP    = require('http').createServer(function (req, res) {
  if (req.headers['x-itier-username'] === 'denied') {
    res.writeHead(401, {'WWW-Authenticate' : 'Basic realm="."'});
    res.end('Authenticate denied for "' + req.headers['x-itier-username'] + '"');
    return;
  }

  if (req.headers['x-itier-explain']) {
    res.end(JSON.stringify({
      'v'   : '1.0',
      'c'   : 200,
      'm'   : '',
      't'   : 2,
      'n'   : 2,
      'fn'  : 2,
      'f'   : ['db', 'sql'],
      'd'   : [['myfox', 'SELECT * FROM ...']],
    }));
    return;
  }

  if (req.url.indexOf('/status/') > -1) {
    res.end("key1\tval1\nkey2val2");
    return;
  }

  if (req.url.indexOf('/explain/') > -1) {
    res.end(JSON.stringify({
      'query'   : 'mysql query',
      'loops'   : 2,
      'score'   : 21.37,                /**<    SQL质量分   */
      'detail'  : [{
        'id'    : 1,
        'select_type' : 'SIMPLE',
        '...'   : '其他就不写了',
      }],
    }));
    return;
  }

  var data = '';
  req.on('data', function (buf) {
    data += buf.toString();
  });
  req.on('end', function () {
    var error, ret;
    if (data.indexOf('hbase.t404') > 0) {
      var hbase404 = '{"v":"1.0","c":400,"m":"hbase status code error: 404","t":0,"n":0,"fn":0,"f":[],"d":[]}';
      return res.end(hbase404);
    }

    if (data.indexOf('objectErrorMessage') > 0) {
      error = '{"v":"1.0","c":400,"m":{},"t":0,"n":0,"fn":0,"f":[],"d":[]}';
      return res.end(error);
    }

    if (data.indexOf('parseError') > 0) {
      error = '{"v":"1.0","c":200,"m":{},"t":0,"n":0,"fn":0,"f":[],"d":[]123}';
      return res.end(error);
    }

    if (data.indexOf('ItierVersionError') > 0) {
      error = '{"v":"102.0","c":200,"m":{},"t":0,"n":0,"fn":0,"f":[],"d":[]}';
      return res.end(error);
    }

    if (data.indexOf('mock.error') > 0) {
      error = '{"v":"1.0","c":500,"m":"Error: Query error #2003: Can\'t connect to MySQL server on \'10.232.132.78\' (4)","t":0,"n":0,"fn":0,"f":[],"d":[]}';
      return res.end(error);
    }

    if (data.indexOf('error.message') > 0) {
      error = '{"v":"1.0","c":500,"m":"OTSMetaNotMatch : Primary key from request not match with the schema","t":0,"n":0,"fn":0,"f":[],"d":[]}';
      return res.end(error);
    }

    if (data.indexOf('SomeServerError.message') > 0) {
      error = '{"v":"1.0","c":500,"m":"SomeServerError : some backend server down","t":0,"n":0,"fn":0,"f":[],"d":[]}';
      return res.end(error);
    }

    if (data.indexOf('error.nohostlist1') > 0) {
      error = '{"v":"1.0","c":500,"m":"no avaible host list for :ots","t":0,"n":0,"fn":0,"f":[],"d":[]}';
      res.writeHead(500, {
        'x-itier-realhost': '127.0.0.1'
      });
      return res.end(error);
    }

    if (data.indexOf('error.nohostlist2') > 0) {
      error = '{"v":"1.0","c":500,"m":"no available host list for :ots","t":0,"n":0,"fn":0,"f":[],"d":[]}';
      res.writeHead(500, {
        'x-itier-realhost': '127.0.0.1'
      });
      return res.end(error);
    }

    if (data.indexOf('RequestTimeout') > 0) {
      setTimeout(function () {
        res.end('{"v":"1.0","c":200,"m":{},"t":0,"n":0,"fn":0,"f":[],"d":[]}');
      }, 500);
      return;
    }

    if (data.indexOf('SocketError') > 0) {
      res.destroy();
      return;
    }

    if (data.indexOf('id in (:id)') > 0 || data.indexOf('hbase.number') > 0) {
      ret = {
        'v' : '1.0',
        'c' : 200,
        'm' : 'status ok',
        't' : 2,
        'n' : 2,
        'fn': 2,
        'f' : ['c1'],
        'd' : [[JSON.parse(data)]],
      };
      return res.end(JSON.stringify(ret));
    }

    ret = {
      'v' : '1.0',                /**<    数据格式版本号  */
      'c' : 200,                  /**<    请求返回码      */
      'm' : 'status ok',          /**<    响应消息        */
      't' : 2,                    /**<    数据总行数      */
      'n' : 2,                    /**<    此次请求返回总行数  */
      'fn': 2,                    /**<    字段数  */
    };
    if (req.url.indexOf('blackhole') > -1) {
      ret.f = ['get', 'post'];
      ret.d = [[1, 2], [req.url, data]];
    } else {
      ret.f = ['c1', 'c2'];
      ret.d = [[1, 2], [3, 4]];
    }

    var headers = {
      'Content-Type'    : 'text/plain',
      'x-itier-agent'   : req.headers['user-agent'],
      'x-itier-realhost': '127.0.0.1'
    };
    if ('x-itier-expire' in req.headers) {
      ret.d.push([100, req.headers['x-itier-expire']]);
    }
    res.writeHead(200, headers);
    res.end(JSON.stringify(ret));
  });
}).listen(33750);
/* }}} */

describe('itier-client-test', function () {
  var client = null;
  before(function () {
    client = ITier.createClient({
      'appname' : 'test',
    });
    client.connect('127.0.0.1', 33750);
  });

  after(function () {
    HTTP.close();
  });

  /* {{{ should_select_data_from_itier_works_fine() */
  it('should_select_data_from_itier_works_fine', function (done) {
    client.query('SELECT * FROM myfox.table_info', null, function (error, data, header, profile) {
      data.should.eql([{'c1': 1, 'c2': 2}, {'c1': 3, 'c2': 4}]);
      profile.should.eql([]);
      header.should.eql({
        'version'   : '1.0',
        'status'    : 200,
        'expire'    : -1,
        'message'   : 'status ok',
        'row_num'   : 2,
        'column_num': 2,
        host        : '127.0.0.1'
      });
      done();
    });
  });
  /* }}} */

  /* {{{ should_fetch_mode_equal_array_works_fine() */
  it('should_fetch_mode_equal_array_works_fine', function (done) {
    var itier   = ITier.createClient({
      'fetchmode' : ITier.FETCH.ARRAY,
    });
    itier.connect('127.0.0.1', 33750);
    itier.query('SELECT * FROM myfox.table_info', null, function (error, data, header, profile) {
      data.should.eql([[1, 2], [3, 4]]);
      header.columns.should.eql(['c1', 'c2']);
      header.should.have.property('host', '127.0.0.1');
      done();
    });
  });
  /* }}} */

  /* {{{ should_username_authorize_works_fine() */
  it('should_username_authorize_works_fine', function (done) {
    var itier   = ITier.createClient({
      'username'  : 'denied',
      'password'  : ' Iam2123llerm3l',
    });
    itier.connect('127.0.0.1', 33750);
    itier.query('SHOW TABLES', null, function (error, data, header, profile) {
      error.message.should.equal('HTTP 401 Response');
      error.body.should.equal('Authenticate denied for "denied"');
      done();
    });
  });
  /* }}} */

  /* {{{ should_return_[]_when_hbase_404() */
  it('should return [] when hbase 404', function (done) {
    client.query('select * from hbase.t404 where row = :r', {r: 123}, function (err, rows) {
      should.not.exist(err);
      rows.should.length(0);
      done();
    });
  });
  /* }}} */

  /* {{{ should_error_message_tobe_{}_not_object() */
  it('error.message should be {} not [object Object]', function (done) {
    client.query('select * from objectErrorMessage', null, function (err, rows) {
      should.exist(err);
      err.message.should.equal('{}');
      err.name.should.equal('ITierError');
      should.not.exist(rows);
      done();
    });
  });
  /* }}} */

  /* {{{ should_mock_error_message() */
  it('error.message should be {} not [object Object]', function (done) {
    client.query('select * from mock.error', null, function (err, rows, msg) {
      should.exist(err);
      err.message.should.equal('Error: Query error #2003: Can\'t connect to MySQL server on \'10.232.132.78\' (4)');
      err.name.should.equal('ITierError');
      should.not.exist(rows);
      done();
    });
  });
  /* }}} */

  /* {{{ should_set_x-itier-expire_success() */
  it("should set `'x-itier-expire'` success", function (done) {
    client.query('select * from myfox.table_info', null, function (err, rows, headers) {
      should.not.exist(err);
      rows.should.length(3);
      rows[2].c2.should.equal('0');
      done();
    }, { expire: 0 });
  });
  /* }}} */

  /* {{{ should_support_number_type() */
  it('should support number type in data{user_id: 123}', function (done) {
    var param = {
      user_id: 123,
    };
    client.query('select * from hbase.number where user_id = :user_id', param, function (err, rows) {
      should.not.exist(err);
      rows.should.length(1);
      var row = rows[0];
      row.should.have.keys('c1');
      row.c1.should.have.keys('sql', 'data', 'type');
      row.c1.type.should.eql({
        user_id: 'int'
      });
      row.c1.data.should.eql({
        user_id: 123
      });
      done();
    });
  });
  /* }}} */
  
  /* {{{ should_support_where_id_in_array() */
  it('should support WHERE id in (:id)', function (done) {
    var param   = {
      'id'  : ['123', 123, 567],
    };
    client.query('select * from hbase.test where id in (:id)', param, function (err, rows) {
      should.not.exist(err);
      rows.should.length(1);
      var row = rows[0];
      row.should.have.keys('c1');
      row.c1.should.have.keys([ 'sql', 'data', 'type' ]);
      row.c1.type.should.eql({
        id: 'array|string'
      });
      done();
    });
  });
  /* }}} */

  /* {{{ should_itier_blackhole_works_fine() */
  it('should_itier_blackhole_works_fine', function (done) {
    var extra   = {
      'blackhole'   : 'garuda',
    };
    client.query('SELECT * FROM myfox.table_info', null, function (error, data, header, profile) {
      should.ok(!error);
      data  = data.pop();
      data.get.should.include('/blackhole/garuda?');
      data.post.should.eql(JSON.stringify({
        'sql'   : 'SELECT * FROM myfox.table_info',
        'data'  : null,
      }));
      done();
    }, extra);
  });
  /* }}} */

  /* {{{ should_itier_status_works_fine() */
  it('should_itier_status_works_fine', function (done) {
    client.status('lastdate', function (error, data) {
      JSON.stringify(data).should.eql(JSON.stringify([
        {'Variable_name' : 'key1', 'Value' : 'val1'},
        'key2val2',
      ]));
      done();
    });
  });
  /* }}} */

  /* {{{ should_itier_explain_works_fine() */
  it('should_itier_explain_works_fine', function (done) {
    client.explain('SELECT * FROM myfox.dim_category LIMIT 1', null, function (error, plans) {
      JSON.stringify(plans).should.eql(JSON.stringify([{
        'db'    : 'myfox',
        'sql'   : 'SELECT * FROM ...',
        '__subplan' : {
          'query'   : 'mysql query',
          'loops'     : 2,
          'score'     : 21.37,
          'detail'    : [{
            'id'  : 1,
            'select_type'   : 'SIMPLE',
            '...'   : '其他就不写了',
          }]
        }
      }]));
      done();
    });
  });
  /* }}} */

  it('should handle 500 with `SomeServerError.message`', function (done) {
    client.query('select * from SomeServerError.message', null, function (err, data) {
      should.exist(err);
      err.should.have.property('name', 'SomeServerError');
      err.should.have.property('message', 'some backend server down');
      should.not.exist(data);
      done();
    });
  });

  it('should handle 500 with error message', function (done) {
    client.query('select * from error.message', null, function (err, data) {
      should.exist(err);
      err.should.have.property('name', 'OTSMetaNotMatchError');
      err.should.have.property('message', 'Primary key from request not match with the schema');
      should.not.exist(data);
      done();
    });
  });

  it('should return NoAvailableServerError', function (done) {
    done = pedding(2, done);
    client.query('select * from error.nohostlist1', null, function (err, data) {
      should.exist(err);
      err.should.have.property('name', 'NoAvailableServerError');
      err.should.have.property('message', 'no avaible host list for :ots');
      err.should.have.property('host', '127.0.0.1');
      should.not.exist(data);
      done();
    });
    client.query('select * from error.nohostlist2', null, function (err, data) {
      should.exist(err);
      err.should.have.property('name', 'NoAvailableServerError');
      err.should.have.property('message', 'no available host list for :ots');
      err.should.have.property('host', '127.0.0.1');
      should.not.exist(data);
      done();
    });
  });

  it('should return json parse error:SyntaxError', function (done) {
    client.query('select * from parseError', null, function (err, data) {
      should.exist(err);
      err.should.have.property('name', 'SyntaxError');
      err.should.have.property('message', 'Unexpected number');
      err.should.have.property('body', '{"v":"1.0","c":200,"m":{},"t":0,"n":0,"fn":0,"f":[],"d":[]123}');
      should.not.exist(data);
      done();
    });
  });

  it('should return ItierVersionError', function (done) {
    client.query('select * from ItierVersionError', null, function (err, data) {
      should.exist(err);
      err.should.have.property('name', 'ItierVersionError');
      err.should.have.property('message', 'Unexpected version as 102.0');
      err.should.have.property('body');
      err.body.should.eql({v: '102.0', c: 200, m: {}, t: 0, n: 0, fn: 0, f: [], d: []});
      should.not.exist(data);
      done();
    });
  });

  it('should return RequestTimeoutError', function (done) {
    var cacheTimeout = client.client.options.timeout;
    client.client.options.timeout = 200;
    client.query('select * from RequestTimeout', null, function (err, data) {
      client.client.options.timeout = cacheTimeout;
      should.exist(err);
      err.should.have.property('name', 'RequestTimeoutError');
      err.should.have.property('message');
      err.message.should.include('Request Timeout after 210ms');
      should.not.exist(data);
      done();
    });
  });

  it('should return RequestError', function (done) {
    client.query('select * from SocketError', null, function (err, data) {
      should.exist(err);
      err.should.have.property('name', 'RequestError');
      err.should.have.property('message');
      err.message.should.include('socket hang up');
      should.not.exist(data);
      done();
    });
  });
});
