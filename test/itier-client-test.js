/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should  = require('should');
var ITier   = require(__dirname + '/../');

var HTTP    = require('http').createServer(function(req, res) {
    if (req.headers['x-app-name'] == 'denied') {
        res.writeHead(401, {'WWW-Authenticate' : 'Basic realm="."'});
        res.end('Authenticate denied for "' + req.headers['x-app-name'] + '"');
        return;
    }

    var body    = '';
    req.on('data', function(buf) {
        body    += buf.toString();
    });
    req.on('end', function() {
        var _me = JSON.parse(body);

        var ret = JSON.stringify([{'c1':1,'c2':2},{'c1':3,'c2':4}]);
        var prf = JSON.stringify([{'sql':_me.__SQL__,'title':'aa'}]);
        res.writeHead(200, {
            'Content-Type'  : 'text/plain',
            'X-App-Status'  : 200,
            'X-App-datalen' : ret.length,
            'X-app-expire'  : 329,
        });

        res.end(ret + prf);
    });
}).listen(33750);

describe('itier-client-test', function() {

    /* {{{ should_select_data_from_itier_works_fine() */
    it('should_select_data_from_itier_works_fine', function(done) {
        var itier   = ITier.init();
        itier.connect('127.0.0.1', 33750).setErrorHandle(function(error) {
            error.should.eql('', 'Unexpected error occurred');
        }).query('SELECT * FROM myfox.table_info', null, function(data, header, profile) {
            data.should.eql([{'c1':1,'c2':2},{'c1':3,'c2':4}]);
            profile.should.eql([{
                'sql'   : 'SELECT * FROM myfox.table_info',
                'title' : 'aa',
            }]);

            header.expire.should.eql('329');
            header.should.have.property('status');
            header.should.have.property('datalen');
            done();
        });
    });
    /* }}} */

    /* {{{ should_appname_authorize_works_fine() */
    it('should_appname_authorize_works_fine', function(done) {
        var itier   = ITier.init({
            'appname'   : 'denied',
        });
        itier.connect('127.0.0.1', 33750).setErrorHandle(function(error, code) {
            error.should.include('Authenticate denied for "denied"');
            code.should.eql(2000);
            done();
        }).query('SHOW TABLES', null, function(data, header, profile) {

        });
    });
    /* }}} */

});

after(function() {
    HTTP.close();
});

