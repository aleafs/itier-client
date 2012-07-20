/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should  = require('should');
var Client  = require(__dirname + '/../lib/http-client.js');
var http = require('http');

/* {{{ http server handle() */
function handle(req, res) {
  var body = '';
  req.on('data', function(buf) {
    body += buf.toString();
  });
  req.on('end', function() {
    if (req.url.indexOf('/timeout') >= 0) {
      setTimeout(function() {
        res.writeHead(502, {});
        res.end('200');
      }, 300);
    } else {
      res.writeHead(200, {
        'x-header-1'    : 'a',
        'X-header-2'    : 'B',
      });
      res.end(JSON.stringify({
        'url'   : req.url,
        'header': req.headers,
        'method': req.method,
        'post'  : body,
      }));
    }
  });
}
/* }}} */

/* {{{ http service demo for unittest */
var server1 = http.createServer(handle).listen(33749);
var server2 = http.createServer(handle).listen(33748);
var server3 = http.createServer(handle).listen(33747);
/* }}} */

describe('http-client-test', function() {

  /* {{{ should_http_client_get_and_post_works_fine() */
  it('should_http_client_get_and_post_works_fine', function(done) {
    var client  = Client.create({
      'prefix'    : '/a',
    });
    var count   = 2;

    client.bind('127.0.0.1', 33749);
    client.get('/status?a=1.23456&b=B', function(error, data, code, header) {
      code.should.eql(200);
      header['x-header-1'].should.eql('a');
      header['x-header-2'].should.eql('B');

      data    = JSON.parse(data);

      data.url.should.include('/a/status?a=1.23456&b=B');
      data.method.should.eql('GET');
      data.header['x-my-header'].should.eql('asdf');
      data.header.should.not.have.property('post');
      data.header.should.not.have.property('content-length');

      if ((--count) == 0) {
        done();
      }
    }, {'x-my-hEader' : 'asdf'}).post('/status?a=1.23456&b=B', {
      'c1'    : 'C...1',
      'c2'    : [1, 2, 3]
    }, function(error, data, code, header) {
      data    = JSON.parse(data);

      data.url.should.include('/a/status?a=1.23456&b=B');
      data.method.should.eql('POST');
      data.post.should.eql(JSON.stringify({
        'c1'    : 'C...1',
        'c2'    : [1, 2, 3]
      }));
      if ((--count) == 0) {
        done();
      }
    });
  });
  /* }}} */

  /* {{{ should_set_error_handle_works_fine() */
  it('should_set_error_handle_works_fine', function(done) {
    var client  = Client.create();
    client.get('/a', function(error, data, code, header) {
      error.number.should.eql(1000);
      error.name.should.equal('BadServer');
      error.toString().should.include('Empty online list or bad server id');
      client.bind('127.0.0.1', 11).get('/a', function(error, data) {
        error.number.should.eql(1200);
        error.toString().should.include('connect ECONNREFUSE');
        error.message.should.equal('connect ECONNREFUSED (127.0.0.1:11)');
        done();
      });
    });
  });
  /* }}} */

  /* {{{ should_http_request_timeout_works_fine() */
  it('should_http_request_timeout_works_fine', function(done) {
    var client  = Client.create({ timeout: 200 });
    client.bind('127.0.0.1', 33748);
    client.get('/timeout', function(err, data, code, header) {
      should.exist(err);
      err.name.should.equal('RequestTimeout');
      err.message.should.equal('Request Timeout 300ms. (127.0.0.1:33748)');
      err.code.should.equal('ECONNRESET');
      setTimeout(function() {
        done();
      }, 500)
    });
  });
  /* }}} */

  /* {{{ should_http_walk_works_fine() */
  it('should_http_walk_works_fine', function(done) {
    var client  = Client.create();
    var count   = 2;
    client.bind('127.0.0.1', 33748).bind('127.0.0.1', 33749);
    client.walk('/walk', null, function(error, data, code, header) {
      should.not.exist(error);
      if ((--count) < 1) {
        done();
      }
    });
  });
  /* }}} */

  /* {{{ should_post_with_content_length_works_fine() */
  it('should post with Content-Length', function(done) {
    var client  = Client.create();
    client.bind('127.0.0.1', 33748).bind('127.0.0.1', 33749);
    var post = {"a":"b"};
    client.post('/post', post, function(err, data, code, header) {
      should.not.exist(err);
      code.should.equal(200);
      data = JSON.parse(data);
      data.header['content-length'].should.equal(''+JSON.stringify(post).length);
      done();
    });
  });
  /* }}} */

  /* {{{ should_http_heartbeat_by_ping_works_fine() */
  xit('should_http_heartbeat_by_ping_works_fine', function(done) {
    var client  = Client.create({
      'heartbeat'   : 5,
    });
    client.bind('127.0.0.1', 33748).bind('1.1.1.1', 33749);

    setTimeout(function() {
      var num = 5;
      for (var i = 0; i < num; i++) {
        client.get('/heartbeat', function(error, data, code, header) {
          JSON.parse(data.toString()).header.should.have.property('host', '127.0.0.1:33748');
          num = num - 1;
          if (num <= 0) {
            done();
          }
        });
      }
    }, 100);
  });
  /* }}} */

});

after(function() {
  server1.close();
  server2.close();
  server3.close();
});

