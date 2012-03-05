/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should	= require('should');
var ITier	= require(__dirname + '/../itier-client.js');

var QS		= require('querystring');

var HTTP	= require('http').createServer(function(req, res) {
	if (req.headers['x-app-name'] == 'denied') {
		res.writeHead(401, {'WWW-Authenticate' : 'Basic realm="."'});
		res.end();
		return;
	}

	var body	= '';
	req.on('data', function(buf) {
		body	+= buf.toString();
	});
	req.on('end', function() {
		var _me	= QS.parse(body);
		res.writeHead(200, {
			'Content-Type'	: 'text/plain',
			'X-App-Status'	: 0,
			'X-app-Message'	: 'OK',
		});
		res.end(_me.__SQL__);
	});
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

	/* {{{ should_right_package_works_fine() */
	it('should_right_package_works_fine', function(done) {
		var itier	= ITier.init();
		itier.removeAll().server('127.0.0.1', 33750).on('error', function(error) {
			error.should.eql('', 'Unexpected error occurred');
		});

		itier.on('complete', function(data, header) {
			data.toString().should.eql('SELECT * FROM myfox.table_info');
			header.should.eql({
				'status'	: '0',
				'message'	: 'OK',
			});
			done();
		});

		itier.query('SELECT * FROM myfox.table_info');
	});
	/* }}} */

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

