JSCOVERAGE="./node_modules/visionmedia-jscoverage/jscoverage"

test: clean
	@npm install
	@./node_modules/mocha/bin/mocha --reporter spec --timeout 5000 \
		$(MOCHA_OPTS) test/*.js

test-cov: lib-cov
	@npm install
	@ITIER_CLIENT_COV=1 ./node_modules/mocha/bin/mocha \
		--reporter html-cov --timeout 5000 test/*.js > ./coverage.html

lib-cov:
	@rm -rf lib-cov
	@${JSCOVERAGE} lib lib-cov

clean:
	@rm -rf lib-cov
	@rm -f coverage.html

.PHONY: test test-cov lib-cov clean
