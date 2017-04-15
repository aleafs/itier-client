/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should = require('should');
var iRequest = require(__dirname + '/../lib/irequest');

var http = require('http');

var hServer;
var PORT = 6781;

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10));  
}

describe('irequest-test', function() {
  before(function(done){
    var count = 0;
    var server = http.createServer(function(req, res) {
       if (count < 3) {
         //console.log('res end');
         req.socket.destroy();
       } else {
        res.writeHead('200')
        res.end('OK');
       }
       count++;
    })
    server.listen(PORT);

    setTimeout(function(){
      done();
    }, 100);
  });

  it('test baidu.com', function(done) {
    var options = {
      'host' : 'baidu.com',
      'port' : 80,
      'path' : '/',
      'method' : 'GET'
    };
    iRequest(options, "", function(err, status, headers, buf){
      //console.log(err);
      //console.log(status);
      status.should.eql(200);
      headers.should.have.property('date');
      buf.length.should.eql(parseInt(headers['content-length']));
      done();
    });
  });

  it('test unkonwn.com', function(done){
    var options = {
      host : 'unkonwn.com',
      port : 80,
      path : '/'
    };
    iRequest(options, "", function(err, status, headers, buf){
      should.exist(err); 
      done();
    });
  });

  it('should_timeout_works_fine', function(done) {
    var options = {
      host : 'www.baidu.com',
      port : 80,
      path : '/',
      timeout   : 1,        // 1ms 超时
    };

    iRequest(options, "", function(err, status, headers, buf) {
      err.toString().should.include('RequestTimeout');
      done();
    });
  });

  it('test socket hangup retry', function(done){
    var options = {
      host : 'localhost',
      port : PORT,
      path : '/'
    };
    //request twice
    iRequest(options, '', function(err, status, headers, buf){
      err.code.should.eql('ECONNRESET')
      //request twice again
      iRequest(options, '', function(err, status, headers, buf){
        buf.toString().should.eql('OK');
        done();
      });
    });
  });

});
