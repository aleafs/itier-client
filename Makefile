TESTS = test/*.js
TESTTIMEOUT = 10000
REPORTER = spec
VERSION = $(shell date +%Y%m%d%H%M%S)

test:
	@NODE_ENV=test /usr/local/bin/mocha \
		--reporter $(REPORTER) --timeout $(TESTTIMEOUT) $(TESTS)

.PHONY: test
