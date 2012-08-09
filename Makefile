JSCOVERAGE="./node_modules/visionmedia-jscoverage/jscoverage"

test: clean
	@npm install
	@./node_modules/mocha/bin/mocha --reporter spec --timeout 5000 \
		$(MOCHA_OPTS) test/*.js

cov:
	@npm install
	-mv lib lib.bak && ${JSCOVERAGE} lib.bak lib
	-./node_modules/mocha/bin/mocha --reporter html-cov --timeout 5000 test/*.js > ./coverage.html
	-rm -rf lib && mv lib.bak lib

clean:
	-rm -rf ./coverage.html

.PHONY: test
