[![Build Status](https://secure.travis-ci.org/aleafs/itier-client.png)](http://travis-ci.org/aleafs/itier-client)

#About

itier-client is a client library for itier

# Usage

		var itier	= require('itier-client').init({
                'appname'   : 'username',
                'apppass'   : 'password',
        });

		itier.connect('127.0.0.1', 9999).connect('127.0.0.2');
        itier.query('SELECT * FROM table WHERE c1 = :c', {
                'c' : 1211
        }, function(data, header, profile) {
			console.log(data);

			/**
			  * @write to cache
			  */
			// cache.write(key, data, header.expire + now);
        });

# TODO

* Get itier service status and hosts list from config-server;
* Query options support, such as "usecache" and "debugmode";
