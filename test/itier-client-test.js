/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should	= require('should');
var itier	= require(__dirname + '/../itier-client.js').create();

var HTTP	= require('http').createServer(function(req, res) {
	res.writeHead(200, {'Content-Type' : 'text/plain'});
	res.end(req.url);
}).listen(33750);

before(function(done) {
	setTimeout(done, 100);
});

describe('itier-client-test', function() {

	it('should_throw_error_when_empty_online_server_list', function(done) {
		itier.removeAll().query('blabla', null, function(error, data) {
			error.should.eql('[1000] Empty online servers list for itier.');
			done();
		});
	});

	it('should_push_into_offline_when_connect_refused', function(done) {
		itier.removeAll().server('127.0.0.1').query('blabla', null, function(error, data) {
			console.log('a' + error);
			done();
		});
	});
});

after(function() {
	HTTP.close();
});

