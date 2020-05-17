(function exportInstafeed(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    module.exports = factory();
  } else {
    root.Instafeed = factory();
  }
}(this, function defineInstafeed() {
  function assert(val, msg) {
    if (!val) {
      throw new Error(msg);
    }
  }

  function Instafeed(options) {
    assert(!options || typeof options === 'object', 'options must be an object, got ' + options + ' ('+ typeof options +')');

    // default options
    var opts = {
      accessToken: null,
      accessTokenTimeout: 10000,
      after: null,
      apiTimeout: 10000,
      before: null,
      debug: false,
      error: null,
      filter: null,
      limit: null,
      mock: false,
      render: null,
      sort: null,
      success: null,
      target: 'instafeed',
      template: '<a href="{{link}}"><img title="{{caption}}" src="{{image}}" /></a>',
      templateBoundaries: ['{{','}}'],
      transform: null
    };

    // state holder
    var state = {
      running: false
    };

    // copy options over defaults
    if (options) {
      for (var optKey in opts) {
        if (typeof options[optKey] !== 'undefined') {
          opts[optKey] = options[optKey];
        }
      }
    }

    // validate options
    assert(typeof opts.target === 'string' || typeof opts.target === 'object', 'target must be a string or DOM node, got ' + opts.target + ' ('+ typeof opts.target +')');
    assert(typeof opts.accessToken === 'string' || typeof opts.accessToken === 'function', 'accessToken must be a string or function, got ' + opts.accessToken + ' ('+ typeof opts.accessToken +')');
    assert(typeof opts.accessTokenTimeout === 'number', 'accessTokenTimeout must be a number, got '+ opts.accessTokenTimeout + ' ('+ typeof opts.accessTokenTimeout +')');
    assert(typeof opts.apiTimeout === 'number', 'apiTimeout must be a number, got '+ opts.apiTimeout + ' ('+ typeof opts.apiTimeout +')');
    assert(typeof opts.debug === 'boolean', 'debug must be true or false, got ' + opts.debug + ' ('+ typeof opts.debug +')');
    assert(typeof opts.mock === 'boolean', 'mock must be true or false, got ' + opts.mock + ' ('+ typeof opts.mock +')');
    assert(typeof opts.templateBoundaries === 'object' && opts.templateBoundaries.length === 2 && typeof opts.templateBoundaries[0] === 'string' && typeof opts.templateBoundaries[1] === 'string', 'templateBoundaries must be an array of 2 strings, got ' + opts.templateBoundaries + ' ('+ typeof opts.templateBoundaries +')');
    assert(!opts.template || typeof opts.template === 'string', 'template must null or string, got ' + opts.template + ' ('+ typeof opts.template +')');
    assert(!opts.error || typeof opts.error === 'function', 'error must be null or function, got ' + opts.error + ' ('+ typeof opts.error +')');
    assert(!opts.before || typeof opts.before === 'function', 'before must be null or function, got ' + opts.before + ' ('+ typeof opts.before +')');
    assert(!opts.after || typeof opts.after === 'function', 'after must be null or function, got ' + opts.after + ' ('+ typeof opts.after +')');
    assert(!opts.success || typeof opts.success === 'function', 'success must be null or function, got ' + opts.success + ' ('+ typeof opts.success +')');
    assert(!opts.filter || typeof opts.filter === 'function', 'filter must be null or function, got ' + opts.filter + ' ('+ typeof opts.filter +')');
    assert(!opts.transform || typeof opts.transform === 'function', 'transform must be null or function, got ' + opts.transform + ' ('+ typeof opts.transform +')');
    assert(!opts.sort || typeof opts.sort === 'function', 'sort must be null or function, got ' + opts.sort + ' ('+ typeof opts.sort +')');
    assert(!opts.render || typeof opts.render === 'function', 'render must be null or function, got ' + opts.render + ' ('+ typeof opts.render +')');
    assert(!opts.limit || typeof opts.limit === 'number', 'limit must be null or number, got ' + opts.limit + ' ('+ typeof opts.limit +')');

    // set instance info
    this._state = state;
    this._options = opts;
  }

  Instafeed.prototype.run = function run() {
    var scope = this;
    var node = null;
    var url = null;
    var items = null;
    var html = null;

    this._debug('run', 'options', this._options);
    this._debug('run', 'state', this._state);

    // prevent re-entry
    if (this._state.running) {
      this._debug('run', 'already running, skipping');
      return false;
    }

    // set as running
    this._start();

    // get dom node
    this._debug('run', 'getting dom node');
    if (typeof this._options.target === 'string') {
      node = document.getElementById(this._options.target);
    } else {
      node = this._options.target;
    }
    if (!node) {
      this._fail(new Error('no element found with ID ' + this._options.target));
      return false;
    }
    this._debug('run', 'got dom node', node);

    // get access token
    this._debug('run', 'getting access token');
    this._getAccessToken(function onTokenReceived(err, token) {
      if (err) {
        scope._debug('onTokenReceived', 'error', err);
        scope._fail(new Error('error getting access token: ' + err.message));
        return;
      }

      url = 'https://graph.instagram.com/me/media?fields=caption,id,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token='+ token;
      scope._debug('onTokenReceived', 'request url', url);

      // make network request
      scope._makeApiRequest(url, function onResponseReceived(err, data) {
        if (err) {
          scope._debug('onResponseReceived', 'error', err);
          scope._fail(new Error('api request error: ' + err.message));
          return;
        }
        scope._debug('onResponseReceived', 'data', data);
        scope._success(data);

        try {
          items = scope._processData(data);
          scope._debug('onResponseReceived', 'processed data', items);
        } catch (processErr) {
          scope._fail(processErr);
          return;
        }

        if (scope._options.mock) {
          scope._debug('onResponseReceived', 'mock enabled, skipping render');
        } else {
          try {
            html = scope._renderData(items);
            scope._debug('onResponseReceived', 'html content', html);
          } catch (renderErr) {
            scope._fail(renderErr);
            return;
          }
          node.innerHTML = html;
        }

        scope._finish();
      });
    });

    return true;
  };

  Instafeed.prototype._processData = function processData(data) {
    var hasTransform = (typeof this._options.transform === 'function');
    var hasFilter = (typeof this._options.filter === 'function');
    var hasSort = (typeof this._options.sort === 'function');
    var hasLimit = (typeof this._options.limit === 'number');
    var transformedFiltered = [];
    var limitDelta = null;
    var dataItem = null;
    var transformedItem = null;
    var filterResult = null;

    this._debug('processData', 'hasFilter', hasFilter, 'hasTransform', hasTransform, 'hasSort', hasSort, 'hasLimit', hasLimit);

    if (typeof data !== 'object' || typeof data.data !== 'object' || data.data.length <= 0) {
      return null;
    }

    for (var i = 0; i < data.data.length; i++) {
      dataItem = this._getItemData(data.data[i]);

      // transform
      if (hasTransform) {
        try {
          transformedItem = this._options.transform(dataItem);
          this._debug('processData', 'transformed item', dataItem, transformedItem);
        } catch (err) {
          this._debug('processData', 'error calling transform', err);
          throw new Error('error in transform: ' + err.message);
        }
      } else {
        transformedItem = dataItem;
      }

      // filter
      if (hasFilter) {
        try {
          filterResult = this._options.filter(transformedItem);
          this._debug('processData', 'filter item result', transformedItem, filterResult);
        } catch (err) {
          this._debug('processData', 'error calling filter', err);
          throw new Error('error in filter: ' + err.message);
        }
        if (filterResult) {
          transformedFiltered.push(transformedItem);
        }
      } else {
        transformedFiltered.push(transformedItem);
      }
    }

    // sort
    if (hasSort) {
      try {
        transformedFiltered.sort(this._options.sort);
      } catch (err) {
        this._debug('processData', 'error calling sort', err);
        throw new Error('error in sort: ' + err.message);
      }
    }

    // limit
    if (hasLimit) {
      limitDelta = transformedFiltered.length - this._options.limit;
      this._debug('processData', 'checking limit', transformedFiltered.length, this._options.limit, limitDelta);
      if (limitDelta > 0) {
        transformedFiltered.splice(transformedFiltered.length - limitDelta, limitDelta);
      }
    }

    return transformedFiltered;
  };

  Instafeed.prototype._extractTags = function extractTags(str) {
    var exp = /#([^\s]+)/gi;
    var badChars = /[~`!@#$%^&*\(\)\-\+={}\[\]:;"'<>\?,\./|\\\s]+/i; // non-allowed characters
    var tags = [];

    if (typeof str === 'string') {
      while ((match = exp.exec(str)) !== null) {
        if (badChars.test(match[1]) === false) {
          tags.push(match[1]);
        }
      }
    }

    return tags;
  };

  Instafeed.prototype._getItemData = function getItemData(data) {
    var type = null;
    var image = null;

    switch (data.media_type) {
      case 'IMAGE':
        type = 'image';
        image = data.media_url;
        break;
      case 'VIDEO':
        type = 'video';
        image = data.thumbnail_url;
        break;
      case 'CAROUSEL_ALBUM':
        type = 'album';
        image = data.media_url;
        break;
    }

    return {
      caption: data.caption,
      tags: this._extractTags(data.caption),
      id: data.id,
      image: image,
      link: data.permalink,
      model: data,
      timestamp: data.timestamp,
      type: type,
      username: data.username
    };
  };

  Instafeed.prototype._renderData = function renderData(items) {
    var hasTemplate = (typeof this._options.template === 'string');
    var hasRender = (typeof this._options.render === 'function');
    var item = null;
    var itemHtml = null;
    var html = '';

    this._debug('renderData', 'hasTemplate', hasTemplate, 'hasRender', hasRender);

    if (typeof items !== 'object' || items.length <= 0) {
      return null;
    }

    for (var i = 0; i < items.length; i++) {
      item = items[i];

      if (hasRender) {
        try {
          itemHtml = this._options.render(item, this._options);
          this._debug('renderData', 'custom render result', item, itemHtml);
        } catch (err) {
          this._debug('renderData', 'error calling render', err);
          throw new Error('error in render: ' + err.message);
        }
      } else if (hasTemplate) {
        itemHtml = this._basicRender(item);
      }

      if (itemHtml) {
        html = html + itemHtml;
      } else {
        this._debug('renderData', 'render item did not return any content', item);
      }
    }

    return html;
  };

  Instafeed.prototype._basicRender = function basicRender(data) {
    var exp = new RegExp(this._options.templateBoundaries[0] + '([\\s\\w.]+)' + this._options.templateBoundaries[1], 'gm');
    var template = this._options.template;
    var match = null;
    var output = '';
    var substr = null;
    var lastIndex = 0;
    var keyPath = null;
    var keyPathValue = null;

    while((match = exp.exec(template)) !== null) {
      keyPath = match[1];
      substr = template.slice(lastIndex, match.index);
      output = output + substr;
      keyPathValue = this._valueForKeyPath(keyPath, data);
      if (keyPathValue) {
        output = output + keyPathValue.toString();
      }
      lastIndex = exp.lastIndex;
    }

    if (lastIndex < template.length) {
      substr = template.slice(lastIndex, template.length);
      output = output + substr;
    }

    return output;
  };

  Instafeed.prototype._valueForKeyPath = function valueForKeyPath(keyPath, data) {
    var exp = /([\w]+)/gm;
    var match = null;
    var key = null;
    var lastValue = data;

    while((match = exp.exec(keyPath)) !== null) {
      if (typeof lastValue !== 'object') {
        return null;
      }
      key = match[1];
      lastValue = lastValue[key];
    }

    return lastValue;
  };

  Instafeed.prototype._fail = function fail(err) {
    var didHook = this._runHook('error', err);
    if (!didHook && console && typeof console.error === 'function') {
      console.error(err);
    }
    this._state.running = false;
  };

  Instafeed.prototype._start = function start() {
    this._state.running = true;
    this._runHook('before');
  };

  Instafeed.prototype._finish = function finish() {
    this._runHook('after');
    this._state.running = false;
  };

  Instafeed.prototype._success = function success(data) {
    this._runHook('success', data);
    this._state.running = false;
  };

  Instafeed.prototype._makeApiRequest = function makeApiRequest(url, callback) {
    var called = false;
    var scope = this;
    var apiRequest = null;
    var callbackOnce = function callbackOnce(err, value) {
      if (!called) {
        called = true;
        callback(err, value);
      }
    };

    apiRequest = new XMLHttpRequest();

    apiRequest.ontimeout = function apiRequestTimedOut(event) {
      callbackOnce(new Error('api request timed out'));
    };

    apiRequest.onerror = function apiRequestOnError(event) {
      callbackOnce(new Error('api connection error'));
    };

    apiRequest.onload = function apiRequestOnLoad(event) {
      var contentType = apiRequest.getResponseHeader('Content-Type');
      var responseJson = null;

      scope._debug('apiRequestOnLoad', 'loaded', event);
      scope._debug('apiRequestOnLoad', 'response status', apiRequest.status);
      scope._debug('apiRequestOnLoad', 'response content type', contentType);

      if (contentType.indexOf('application/json') >= 0) {
        try {
          responseJson = JSON.parse(apiRequest.responseText);
        } catch (err) {
          scope._debug('apiRequestOnLoad', 'json parsing error', err, apiRequest.responseText);
          callbackOnce(new Error('error parsing response json'));
          return;
        }
      }

      if (apiRequest.status !== 200) {
        if (responseJson && responseJson.error) {
          callbackOnce(new Error(responseJson.error.code + ' ' + responseJson.error.message));
        } else {
          callbackOnce(new Error('status code ' + apiRequest.status));
        }
        return;
      }

      callbackOnce(null, responseJson);
    };

    apiRequest.open('GET', url, true);
    apiRequest.timeout = this._options.apiTimeout;
    apiRequest.send();
  };

  Instafeed.prototype._getAccessToken = function getAccessToken(callback) {
    var called = false;
    var scope = this;
    var timeoutCheck = null;

    var callbackOnce = function callbackOnce(err, value) {
      if (!called) {
        called = true;
        clearTimeout(timeoutCheck);
        callback(err, value);
      }
    };

    if (typeof this._options.accessToken === 'function') {
      this._debug('getAccessToken', 'calling accessToken as function');

      timeoutCheck = setTimeout(function accessTokenTimeoutCheck() {
        scope._debug('getAccessToken', 'timeout check', called);
        callbackOnce(new Error('accessToken timed out'), null);
      }, this._options.accessTokenTimeout);

      try {
        this._options.accessToken(function accessTokenReceiver(err, value) {
          scope._debug('getAccessToken', 'received accessToken callback', called, err, value);
          callbackOnce(err, value);
        });
      } catch (err) {
        this._debug('getAccessToken', 'error invoking the accessToken as function', err);
        callbackOnce(err, null);
      }
    } else {
      this._debug('getAccessToken', 'treating accessToken as static', typeof this._options.accessToken);
      callbackOnce(null, this._options.accessToken);
    }
  };

  Instafeed.prototype._debug = function debug() {
    var args = null;

    if (this._options.debug && console && typeof console.log === 'function') {
      args = [].slice.call(arguments);
      args[0] = '[Instafeed] ['+args[0]+']'; // first argument should be the callers name
      console.log.apply(null, args);
    }
  };

  Instafeed.prototype._runHook = function runHook(hookName, data) {
    var success = false;
    if (typeof this._options[hookName] === 'function') {
      try {
        this._options[hookName](data);
        success = true;
      } catch (err) {
        this._debug('runHook', 'error calling hook', hookName, err);
      }
    }
    return success;
  };

  return Instafeed;
}));
