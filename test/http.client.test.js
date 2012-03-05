/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should	= require('should');
var Client	= require(__dirname + '/../http-client.js');

var HTTP	= require('http').createServer(function(req, res) {
	res.writeHead(200, {'Content-Type' : 'text/plain'});
	res.end(req.url);
}).listen(33750);

before(function(done) {
	setTimeout(done, 100);
});

describe('http-client-test', function() {
	it('should_throw_error_when_empty_server_list', function(done) {
		var obj	= Client.create();
		obj.on('error', function(error) {
			error.should.include('[1000] empty online server list');
			done();
		});
		obj.apply('/index?c=1', null);
	});

	it('should_string_url_apply_works_fine', function(done) {
		var obj	= Client.create();
		obj.add('127.0.0.1', 33750).on('error', function(error) {
			error.should.eql(null, 'Unexpected error occurred');
		});

		obj.on('complete', function(data, header) {
			console.log('aa');
			done();
		});

		obj.apply('/index?c=1');
	});
});

after(function() {
	HTTP.close();
});

