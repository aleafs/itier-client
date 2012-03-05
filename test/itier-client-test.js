/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should	= require('should');
var ITier	= require(__dirname + '/../itier-client.js');

var HTTP	= require('http').createServer(function(req, res) {
	req.on('data', function(buf) {
		console.log(buf.toString());
	});

	res.writeHead(200, {'Content-Type' : 'text/plain'});
	res.end(req.url);
}).listen(33750);

describe('itier-client-test', function() {

	/* {{{ should_throw_error_when_empty_online_server_list() */
	it('should_throw_error_when_empty_online_server_list', function(done) {
		var itier	= ITier.init();
		itier.removeAll().on('error', function(error) {
			error.should.include('[1000] Empty online server list for itier');
			done();
		});
		itier.query('blabla');
	});
	/* }}} */

	it('should__', function(done) {
		var itier	= ITier.init();
		itier.removeAll().server('127.0.0.1', 33750).on('error', function(error) {
			error.should.eql('', 'Unexpected error occurred');
		});

		itier.on('complete', function(data, header) {
			done();
		});

		itier.query('blabla');
	});

	/* {{{ should_push_into_offline_and_relive_works_fine() */
	it('should_push_into_offline_and_relive_works_fine', function(done) {
		var itier	= ITier.init();
		itier.removeAll().server('127.0.0.1').on('error', function(error) {
			error.should.include('1200] Error: connect ECONNREFUSED for http://127.0.0.1:80');
			itier.removeAllListeners('error');
			itier.on('error', function(error){
				error.should.include('[1000] Empty online server list for itier');
				itier.removeAllListeners('error');

				/**
				 * offline 1s
				 */
				setTimeout(function() {
					itier.on('error', function(error) {
						error.should.include('1200] Error: connect ECONNREFUSED for http://127.0.0.1:80');
						done();
					});
				
					itier.query('test for offline relive');
				}, 1100);
			});
			itier.query('test for offline');
		});
		itier.query('blabla');
	});
	/* }}} */

});

after(function() {
	HTTP.close();
});

