/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should	= require('should');
var LiveBox	= require(__dirname + '/../livebox.js');

describe('livebox-test', function() {
	it('should_livebox_instance_works_fine', function() {
		LiveBox.removeAll();
		var box	= LiveBox.instance('id1');
		box.request	= 121313345;

		LiveBox.instance('iD1').request.should.eql(121313345);
		LiveBox.instance('id2').request.should.eql(0);

		LiveBox.removeAll();
		LiveBox.instance('id1').request.should.eql(0);
	});

	it('should_load_balance_works_fine', function(done) {
		LiveBox.removeAll();

		var box	= LiveBox.instance('aa');
		box.fetch().should.eql(false);

		box.push(1, 'c1').push('k2', {c2: 'c2'}).fetch().should.eql('c1');
		box.fetch().should.eql({c2: 'c2'});
		box.fetch().should.eql('c1');

		box.pause('i_am_not_exists').pause('k2', 1);
		box.fetch().should.eql('c1');
		box.fetch().should.eql('c1');

		setTimeout(function() {
			box.fetch().should.eql({c2 :'c2'});
			done();
		}, 1100);
	});

	it('shoud_livebox_walk_works_fine', function(done) {
		LiveBox.removeAll();

		var map	= [1, 2, 3, 4];
		var box	= LiveBox.instance('aa');
		for (var i = 0; i < map.length; i++) {
			box.push(i, map[i]);
		}

		var max	= 3;
		box.pause(1).walk(function(cfg, idx) {
			cfg.should.eql(idx + 1);
			if (!(--max)) {
				done();
			}
		}, 1);
	});
});
