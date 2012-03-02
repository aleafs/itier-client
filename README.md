# About

itier-client is a client library for itier

# Usage

		var itier	= require('itier-client');

		itier.init('username', 'password', timeout)
			.addserver('127.0.0.1', 9999)
			.addserver('127.0.0.1', 9998);

		itier.query('SELECT * FROM table WHERE c1 = :c', {
			'c'	: 1211,
		}, function (err, data) {
			if (err) {
				throw err;
			}

			console.log(data);
		});

# Error Message

