/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should	= require('should');
var Client	= require(__dirname + '/../http-client.js');

var HTTP	= require('http').createServer(function(req, res) {
	res.writeHead(200, {'Content-Type' : 'text/plain'});
	res.end(req.url);
}).listen(33750);

describe('http-client-test', function() {
	it('should_apply_from_an_url_works_fine', function(done) {
		var obj	= Client.create();

		obj.on('error', function(error) {
			error.should.include('[1000] empty online server list');
			done();
		});

		obj.apply('/index?c=1', null);

		obj.on('complete', function(data, header) {
			done();
		});

	});
});

after(function() {
	HTTP.close();
});

