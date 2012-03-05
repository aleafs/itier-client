# About

itier-client is a client library for itier

# Usage

		var itier	= require('itier-client').init('username', 'password');

		itier.server('127.0.0.1', 9999).server('127.0.0.1',9999);
		itier.on('error', function(error) {
			console.log(error);
		});
		itier.on('complete', function(data, header, profile) {
			console.log(data);

			/**
			  * @write to cache
			  */
			// cache.write(key, data, header.cache + now);
		
		});
		itier.query('SELECT * FROM table WHERE c1 = :c', {
			'c'	: 1211,
		});

# Error Message

