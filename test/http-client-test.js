/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should	= require('should');
var Client	= require(__dirname + '/../lib/http-client.js');

/* {{{ http service demo for unittest */
var HTTP    = require('http').createServer(function(req, res) {
    var body    = '';
    req.on('data', function(buf) {
        body    += buf.toString();
    });
    req.on('end', function() {
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
        body    = '';
    });
}).listen(33749);
/* }}} */

describe('http-client-test', function() {

    /* {{{ should_http_client_get_works_fine() */
    it('should_http_client_get_works_fine', function(done) {
        var client  = Client.instance();
        client.bind('127.0.0.1', 33749);
        client.on('error', function(err) {
            error.should.eql('', 'Unexpected error occurred.');
        });
        client.on('data', function(data, code, header) {
            code.should.eql(200);
            header['x-header-1'].should.eql('a');
            header['x-header-2'].should.eql('B');

            data    = JSON.parse(data);

            data.url.should.include('/status?a=1.23456&b=B');
            data.method.should.eql('GET');
            data.header['x-my-header'].should.eql('asdf');
            data.post.should.eql('');

            done();
        });
        client.get('/status?a=1.23456&b=B', {'x-my-hEader' : 'asdf'});
    });
    /* }}} */

    /* {{{ should_http_client_post_works_fine() */
    it('should_http_client_post_works_fine', function(done) {
        var client  = Client.instance();
        client.bind('127.0.0.1', 33749);
        client.on('error', function(err) {
            error.should.eql('', 'Unexpected error occurred.');
        });
        client.on('data', function(data, code, header) {
            code.should.eql(200);

            data    = JSON.parse(data);

            data.url.should.include('/status?a=1.23456&b=B');
            data.method.should.eql('POST');
            data.post.should.eql(JSON.stringify({
                'c1'    : 'C...1',
                'c2'    : [1, 2, 3]
            }));
            done();
        });
        client.post('/status?a=1.23456&b=B', {
            'c1'    : 'C...1',
            'c2'    : [1, 2, 3]
        });
    });
    /* }}} */

});

after(function() {
    HTTP.close();
});

