TESTS = test/*.js
REPORTER = spec
TIMEOUT = 5000
JSCOVERAGE = ./node_modules/jscover/bin/jscover
MOCHA = ./node_modules/mocha/bin/mocha

install:
	@npm install

test: install
	@NODE_ENV=test $(MOCHA) \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(TESTS)

test-cov: install lib-cov
	@ITIER_CLIENT_COV=1 $(MAKE) test REPORTER=dot
	@ITIER_CLIENT_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@rm -rf $@
	@$(JSCOVERAGE) lib $@

.PHONY: install test test-cov lib-cov
