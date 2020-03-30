const assert = require('assert');
const Instafeed = require('../src/instafeed');

function optionsFixture(overrides) {
  const values = {
    accessToken: 'test_token',
    accessTokenTimeout: 5000,
    debug: false,
    target: 'instafeed'
  };

  if (overrides) {
    for (const key in values) {
      if (typeof overrides[key] !== 'undefined') {
        values[key] = overrides[key];
      }
    }
  }

  return values;
}

function browserOnly(func) {
  if (global.instafeed_browser_test === true) {
    func();
  }
}

describe('Instafeed', function() {
  browserOnly(function() {
    beforeEach(function() {
      const opts = optionsFixture();
      const targetNode = document.getElementById(opts.target);
      if (targetNode) {
        targetNode.remove();
      }
      const newNode = document.createElement('div');
      newNode.id = opts.target;
      document.body.appendChild(newNode);
    });
  });

  describe('constructor', function() {
    it('should return an instance', function() {
      const val = new Instafeed(optionsFixture());
      assert.ok(val instanceof Instafeed);
    });

    it('should throw if "accessToken" is non-string and non-function', function() {
      const options = optionsFixture({ accessToken: 0 });
      assert.throws(() => {
        new Instafeed(options);
      }, /accessToken/);
    });

    it('should throw if "accessTokenTimeout" is non-number', function() {
      const options = optionsFixture({ accessTokenTimeout: '10' });
      assert.throws(() => {
        new Instafeed(options);
        console.log('here');
      }, /accessTokenTimeout/);
    });

    it('should throw if "debug" is non-boolean', function() {
      const options = optionsFixture({ debug: 'true' });
      assert.throws(() => {
        new Instafeed(options);
      }, /debug/);
    });

    it('should throw if "target" is non-object and non-string', function() {
      const options = optionsFixture({ target: 0 });
      assert.throws(() => {
        new Instafeed(options);
      }, /target/);
    });
  });

  describe('#_getAccessToken', function() {
    describe('when "accessToken" is a string', function() {
      it('should pass token as callback arguments', function(done) {
        const testToken = 'test_access_token_value';
        const callback = (err, token) => {
          assert.equal(err, null);
          assert.equal(token, testToken);
          done();
        };
        const options = optionsFixture({ accessToken: testToken });
        const instance = new Instafeed(options);
        instance._getAccessToken(callback);
      });
    });

    describe.only('when "accessToken" is function', function() {
      it('should pass instance as argument', function(done) {
        let value = null;
        const getToken = (feed, callback) => {
          value = feed;
          callback(null, null);
        };
        const options = optionsFixture({ accessToken: getToken });
        const instance = new Instafeed(options);
        instance._getAccessToken(() => {
          assert.ok(value instanceof Instafeed);
          assert.strictEqual(value, instance);
          done();
        });
      });

      it('should pass callback as argument', function(done) {
        let type = null;
        const getToken = (feed, callback) => {
          type = typeof callback;
          callback(null, null);
        };
        const options = optionsFixture({ accessToken: getToken });
        const instance = new Instafeed(options);
        instance._getAccessToken(() => {
          assert.equal(type, 'function');
          done();
        });
      });

      describe('when "accessToken" function throws', function() {
        it('should pass error as callback argument', function(done) {
          const testError = new Error('test_token_error');
          const getTokenWithThrow = () => { throw testError; };
          const options = optionsFixture({ accessToken: getTokenWithThrow });
          const instance = new Instafeed(options);
          instance._getAccessToken((err, value) => {
            assert.strictEqual(err, testError);
            done();
          });
        });
      });

      describe('when "accessToken" function calls callback', function() {
        describe('with an error argument', function() {
          it('should pass the error to callback', function(done) {
            const testError = new Error('test_token_error');
            const getTokenWithError = (feed, callback) => {
              callback(testError, null);
            };
            const options = optionsFixture({ accessToken: getTokenWithError });
            const instance = new Instafeed(options);
            instance._getAccessToken((err, value) => {
              assert.strictEqual(err, testError);
              done();
            });
          });
        });

        describe('with an value argument', function() {
          it('should pass the value to callback', function(done) {
            const testToken = 'test_token_from_callback';
            const getTokenWithError = (feed, callback) => {
              callback(null, testToken);
            };
            const options = optionsFixture({ accessToken: getTokenWithError });
            const instance = new Instafeed(options);
            instance._getAccessToken((err, value) => {
              assert.equal(err, null);
              assert.equal(value, testToken);
              done();
            });
          });
        });
      });
    });
  });

  browserOnly(function() {
    describe('#run', function() {
      it('should return true', function() {
        const feed = new Instafeed(optionsFixture());
        assert.equal(feed.run(), true);
      });
    });
  });

  browserOnly(function() {
    describe('#_initDomNode', function() {
      describe('when "target" is a string', function() {
        it('should throw if element is not found', function() {
          const options = optionsFixture({ target: 'some_id_that_should_not_be_in_dom' });
          const instance = new Instafeed(options);
          assert.throws(() => {
            instance._initDomNode();
          }, /some_id_that_should_not_be_in_dom/);
        });
      });
    });
  });
});
