/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should	= require('should');
var itier	= require(__dirname + '/../itier-client.js').init();

describe('itier-client', function() {

	before(function(done) {
	
	});

	describe('itier query works fine', function() {
		itier.query('blabla', null, function(error, data, option) {
			console.log(error);
		
		});
	});

	after(function() {
	
	});
});

