TESTS = test/*.js
TESTTIMEOUT = 10000
REPORTER = spec
VERSION = $(shell date +%Y%m%d%H%M%S)

test:
	@NODE_ENV=test /usr/local/bin/mocha \
		--reporter $(REPORTER) --timeout $(TESTTIMEOUT) $(TESTS)

test-cov: lib-cov
	@JSCOV=1 $(MAKE) test REPORTER=html-cov > coverage.html && open coverage.html

lib-cov:
	@jscoverage itier-client.js $@

clean:
	rm -rf lib-cov
	rm -f coverage.html

.PHONY: test test-cov
