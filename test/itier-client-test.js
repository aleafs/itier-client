/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should	= require('should');
var ITier	= require(__dirname + '/../itier-client.js');

var QS		= require('querystring');

var HTTP	= require('http').createServer(function(req, res) {
	if (req.headers['x-app-name'] == 'denied') {
		res.writeHead(401, {'WWW-Authenticate' : 'Basic realm="."'});
		res.end('Authenticate denied for "' + req.headers['x-app-name'] + '"');
		return;
	}

	var body	= '';
	req.on('data', function(buf) {
		body	+= buf.toString();
	});
	req.on('end', function() {
		var _me	= QS.parse(body);

		var ret	= JSON.stringify([{'c1':1,'c2':2},{'c1':3,'c2':4}]);
		var prf	= JSON.stringify([{'sql':_me.__SQL__,'title':'aa'}]);
		res.writeHead(200, {
			'Content-Type'	: 'text/plain',
			'X-App-Status'	: 0,
			'X-App-datalen'	: ret.length,
			'X-app-expire'	: 329,
		});

		res.end(ret + prf);
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

	/* {{{ should_select_data_from_itier_works_fine() */
	it('should_select_data_from_itier_works_fine', function(done) {
		var itier	= ITier.init();
		itier.removeAll().connect('127.0.0.1:33750').on('error', function(error) {
			error.should.eql('', 'Unexpected error occurred');
		});

		itier.on('complete', function(data, header, profile) {
			data.should.eql([{'c1':1,'c2':2},{'c1':3,'c2':4}]);
			profile.should.eql([{
				'sql'	: 'SELECT * FROM myfox.table_info',
				'title'	: 'aa',
			}]);

			header.expire.should.eql('329');
			header.should.have.property('status');
			header.should.have.property('datalen');
			done();
		});

		itier.query('SELECT * FROM myfox.table_info');
	});
	/* }}} */

	/* {{{ should_appname_authorize_works_fine() */
	it('should_appname_authorize_works_fine', function(done) {
		var itier	= ITier.init();
		itier.connect('127.0.0.1:33750', 'denied').on('error', function(error) {
			error.should.include('[2000] Authenticate denied for "denied"');
			done();
		});
		itier.query('SHOW TABLES');
	});
	/* }}} */

	/* {{{ should_push_into_offline_and_relive_works_fine() */
	it('should_push_into_offline_and_relive_works_fine', function(done) {
		var itier	= ITier.init();
		itier.removeAll().connect('127.0.0.1').on('error', function(error) {
			error.should.include('1200] Error: connect ECONNREFUSED for http://127.0.0.1:9999');
			itier.removeAllListeners('error');
			itier.on('error', function(error){
				error.should.include('[1000] Empty online server list for itier');
				itier.removeAllListeners('error');

				/**
				 * offline 1s
				 */
				setTimeout(function() {
					itier.on('error', function(error) {
						error.should.include('1200] Error: connect ECONNREFUSED for http://127.0.0.1:9999');
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

