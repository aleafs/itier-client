/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should  = require('should');
var Client  = require(__dirname + '/../lib/http-client.js');

/* {{{ http service demo for unittest */
var HTTP    = require('http').createServer(function(req, res) {
    var body    = '';
    req.on('data', function(buf) {
        body    += buf.toString();
    });
    req.on('end', function() {
        if (req.url.indexOf('/timeout') >= 0) {
            res.writeHead(502, {});
            setTimeout(function() {
                res.end('200');
            }, 1000);
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
        body    = '';
    });
}).listen(33749);
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
            data.post.should.eql('');

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
            error.toString().should.include('empty server list or bad server id');
            client.bind('127.0.0.1', 11).get('/a', function(error, data) {
                error.number.should.eql(1200);
                error.toString().should.include('connect ECONNREFUSE');
                done();
            });
        });
    });
    /* }}} */

    /* {{{ should_http_request_timeout_works_fine() */
    it('should_http_request_timeout_works_fine', function(done) {
        var client  = Client.create({'timeout' : 200});
        client.bind('127.0.0.1', 33749);
        client.get('/timeout', function(error, data, code, header) {
            error.toString().should.include('socket hang up');
            error.code.should.eql('ECONNRESET');
            //error.toString().should.include('Request timeout after 200 millisecond(s)');
            done();
        });
    });
    /* }}} */

    /* {{{ should_http_walk_works_fine() */
    it('should_http_walk_works_fine', function(done) {
        var client  = Client.create();

        var count   = 2;
        client.bind('127.0.0.1', 33749).bind('127.0.0.1', 33749);
        client.walk('/walk', null, function(error, data, code, header) {
            should.ok(!error);
            if ((--count) < 1) {
                done();
            }
        });
    });
    /* }}} */

});

after(function() {
    HTTP.close();
});

