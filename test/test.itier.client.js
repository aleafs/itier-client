/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var itier	= require(__dirname + '/../itier-client.js').instance();

console.log(itier);
itier.query('i am bad', null, function (error, data) {
	console.log(error);
});

