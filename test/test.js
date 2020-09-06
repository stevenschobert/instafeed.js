"use strict";

const assert = require('assert');
const Instafeed = require('../');

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
        console.log(key, overrides[key]);
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
