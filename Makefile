TESTS = test/*.js
TESTTIMEOUT = 10000

JSCOVERAGE="./node_modules/visionmedia-jscoverage/jscoverage"

test:
	@ ./node_modules/mocha/bin/mocha \
		--reporter spec --timeout $(TESTTIMEOUT) $(TESTS)

cov:
	-mv lib lib.bak && $(JSCOVERAGE) lib.bak lib 
	-./node_modules/mocha/bin/mocha \
		--reporter html-cov --timeout ${TESTTIMEOUT} ${TESTS} > coverage.html
	-rm -rf lib && mv lib.bak lib

.PHONY: test
