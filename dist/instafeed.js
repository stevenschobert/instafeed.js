/* instafeed.js | v2.0.0 | https://github.com/stevenschobert/instafeed.js | License: MIT */
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, 
  global.Instafeed = factory());
})(this, function() {
  "use strict";
  function assert(val, msg) {
    if (!val) {
      throw new Error(msg);
    }
  }
  function Instafeed(options) {
    assert(!options || typeof options === "object", "options must be an object, got " + options + " (" + typeof options + ")");
    var opts = {
      accessToken: null,
      accessTokenTimeout: 1e4,
      after: null,
      apiTimeout: 1e4,
      apiLimit: null,
      before: null,
      debug: false,
      error: null,
      filter: null,
      limit: null,
      mock: false,
      render: null,
      sort: null,
      success: null,
      target: "instafeed",
      template: '<a href="{{link}}"><img title="{{caption}}" src="{{image}}" /></a>',
      templateBoundaries: [ "{{", "}}" ],
      transform: null
    };
    var state = {
      running: false,
      node: null,
      token: null,
      paging: null,
      pool: []
    };
    if (options) {
      for (var optKey in opts) {
        if (typeof options[optKey] !== "undefined") {
          opts[optKey] = options[optKey];
        }
      }
    }
    assert(typeof opts.target === "string" || typeof opts.target === "object", "target must be a string or DOM node, got " + opts.target + " (" + typeof opts.target + ")");
    assert(typeof opts.accessToken === "string" || typeof opts.accessToken === "function", "accessToken must be a string or function, got " + opts.accessToken + " (" + typeof opts.accessToken + ")");
    assert(typeof opts.accessTokenTimeout === "number", "accessTokenTimeout must be a number, got " + opts.accessTokenTimeout + " (" + typeof opts.accessTokenTimeout + ")");
    assert(typeof opts.apiTimeout === "number", "apiTimeout must be a number, got " + opts.apiTimeout + " (" + typeof opts.apiTimeout + ")");
    assert(typeof opts.debug === "boolean", "debug must be true or false, got " + opts.debug + " (" + typeof opts.debug + ")");
    assert(typeof opts.mock === "boolean", "mock must be true or false, got " + opts.mock + " (" + typeof opts.mock + ")");
    assert(typeof opts.templateBoundaries === "object" && opts.templateBoundaries.length === 2 && typeof opts.templateBoundaries[0] === "string" && typeof opts.templateBoundaries[1] === "string", "templateBoundaries must be an array of 2 strings, got " + opts.templateBoundaries + " (" + typeof opts.templateBoundaries + ")");
    assert(!opts.template || typeof opts.template === "string", "template must null or string, got " + opts.template + " (" + typeof opts.template + ")");
    assert(!opts.error || typeof opts.error === "function", "error must be null or function, got " + opts.error + " (" + typeof opts.error + ")");
    assert(!opts.before || typeof opts.before === "function", "before must be null or function, got " + opts.before + " (" + typeof opts.before + ")");
    assert(!opts.after || typeof opts.after === "function", "after must be null or function, got " + opts.after + " (" + typeof opts.after + ")");
    assert(!opts.success || typeof opts.success === "function", "success must be null or function, got " + opts.success + " (" + typeof opts.success + ")");
    assert(!opts.filter || typeof opts.filter === "function", "filter must be null or function, got " + opts.filter + " (" + typeof opts.filter + ")");
    assert(!opts.transform || typeof opts.transform === "function", "transform must be null or function, got " + opts.transform + " (" + typeof opts.transform + ")");
    assert(!opts.sort || typeof opts.sort === "function", "sort must be null or function, got " + opts.sort + " (" + typeof opts.sort + ")");
    assert(!opts.render || typeof opts.render === "function", "render must be null or function, got " + opts.render + " (" + typeof opts.render + ")");
    assert(!opts.limit || typeof opts.limit === "number", "limit must be null or number, got " + opts.limit + " (" + typeof opts.limit + ")");
    assert(!opts.apiLimit || typeof opts.apiLimit === "number", "apiLimit must null or number, got " + opts.apiLimit + " (" + typeof opts.apiLimit + ")");
    this._state = state;
    this._options = opts;
  }
  Instafeed.prototype.run = function run() {
    var scope = this;
    this._debug("run", "options", this._options);
    this._debug("run", "state", this._state);
    if (this._state.running) {
      this._debug("run", "already running, skipping");
      return false;
    }
    this._start();
    this._debug("run", "getting dom node");
    if (typeof this._options.target === "string") {
      this._state.node = document.getElementById(this._options.target);
    } else {
      this._state.node = this._options.target;
    }
    if (!this._state.node) {
      this._fail(new Error("no element found with ID " + this._options.target));
      return false;
    }
    this._debug("run", "got dom node", this._state.node);
    this._debug("run", "getting access token");
    this._getAccessToken(function onTokenReceived(err, token) {
      if (err) {
        scope._debug("onTokenReceived", "error", err);
        scope._fail(new Error("error getting access token: " + err.message));
        return;
      }
      scope._debug("onTokenReceived", "got token", token);
      scope._state.token = token;
      scope._showNext(function onNextShown(err) {
        if (err) {
          scope._debug("onNextShown", "error", err);
          scope._fail(err);
          return;
        }
        scope._finish();
      });
    });
    return true;
  };
  Instafeed.prototype.hasNext = function hasNext() {
    var paging = this._state.paging;
    var pool = this._state.pool;
    this._debug("hasNext", "paging", paging);
    this._debug("hasNext", "pool", pool.length, pool);
    return pool.length > 0 || paging && typeof paging.next === "string";
  };
  Instafeed.prototype.next = function next() {
    var scope = this;
    if (!scope.hasNext()) {
      scope._debug("next", "hasNext is false, skipping");
      return false;
    }
    if (scope._state.running) {
      scope._debug("next", "already running, skipping");
      return false;
    }
    scope._start();
    scope._showNext(function onNextShown(err) {
      if (err) {
        scope._debug("onNextShown", "error", err);
        scope._fail(err);
        return;
      }
      scope._finish();
    });
  };
  Instafeed.prototype._showNext = function showNext(callback) {
    var scope = this;
    var url = null;
    var poolItems = null;
    var hasLimit = typeof this._options.limit === "number";
    scope._debug("showNext", "pool", scope._state.pool.length, scope._state.pool);
    if (scope._state.pool.length > 0) {
      if (hasLimit) {
        poolItems = scope._state.pool.splice(0, scope._options.limit);
      } else {
        poolItems = scope._state.pool.splice(0);
      }
      scope._debug("showNext", "items from pool", poolItems.length, poolItems);
      scope._debug("showNext", "updated pool", scope._state.pool.length, scope._state.pool);
      if (scope._options.mock) {
        scope._debug("showNext", "mock enabled, skipping render");
      } else {
        try {
          scope._renderData(poolItems);
        } catch (renderErr) {
          callback(renderErr);
          return;
        }
      }
      callback(null);
    } else {
      if (scope._state.paging && typeof scope._state.paging.next === "string") {
        url = scope._state.paging.next;
      } else {
        url = "https://graph.instagram.com/me/media?fields=caption,id,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=" + scope._state.token;
        if (!scope._options.apiLimit && typeof scope._options.limit === "number") {
          scope._debug("showNext", "no apiLimit set, falling back to limit", scope._options.apiLimit, scope._options.limit);
          url = url + "&limit=" + scope._options.limit;
        } else if (typeof scope._options.apiLimit === "number") {
          scope._debug("showNext", "apiLimit set, overriding limit", scope._options.apiLimit, scope._options.limit);
          url = url + "&limit=" + scope._options.apiLimit;
        }
      }
      scope._debug("showNext", "making request", url);
      scope._makeApiRequest(url, function onResponseReceived(err, data) {
        var processed = null;
        if (err) {
          scope._debug("onResponseReceived", "error", err);
          callback(new Error("api request error: " + err.message));
          return;
        }
        scope._debug("onResponseReceived", "data", data);
        scope._success(data);
        scope._debug("onResponseReceived", "setting paging", data.paging);
        scope._state.paging = data.paging;
        try {
          processed = scope._processData(data);
          scope._debug("onResponseReceived", "processed data", processed);
          if (processed.unused && processed.unused.length > 0) {
            scope._debug("onResponseReceived", "saving unused to pool", processed.unused.length, processed.unused);
            for (var i = 0; i < processed.unused.length; i++) {
              scope._state.pool.push(processed.unused[i]);
            }
          }
        } catch (processErr) {
          callback(processErr);
          return;
        }
        if (scope._options.mock) {
          scope._debug("onResponseReceived", "mock enabled, skipping append");
        } else {
          try {
            scope._renderData(processed.items);
          } catch (renderErr) {
            callback(renderErr);
            return;
          }
        }
        callback(null);
      });
    }
  };
  Instafeed.prototype._processData = function processData(data) {
    var hasTransform = typeof this._options.transform === "function";
    var hasFilter = typeof this._options.filter === "function";
    var hasSort = typeof this._options.sort === "function";
    var hasLimit = typeof this._options.limit === "number";
    var transformedFiltered = [];
    var limitDelta = null;
    var dataItem = null;
    var transformedItem = null;
    var filterResult = null;
    var unusedItems = null;
    this._debug("processData", "hasFilter", hasFilter, "hasTransform", hasTransform, "hasSort", hasSort, "hasLimit", hasLimit);
    if (typeof data !== "object" || typeof data.data !== "object" || data.data.length <= 0) {
      return null;
    }
    for (var i = 0; i < data.data.length; i++) {
      dataItem = this._getItemData(data.data[i]);
      if (hasTransform) {
        try {
          transformedItem = this._options.transform(dataItem);
          this._debug("processData", "transformed item", dataItem, transformedItem);
        } catch (err) {
          this._debug("processData", "error calling transform", err);
          throw new Error("error in transform: " + err.message);
        }
      } else {
        transformedItem = dataItem;
      }
      if (hasFilter) {
        try {
          filterResult = this._options.filter(transformedItem);
          this._debug("processData", "filter item result", transformedItem, filterResult);
        } catch (err) {
          this._debug("processData", "error calling filter", err);
          throw new Error("error in filter: " + err.message);
        }
        if (filterResult) {
          transformedFiltered.push(transformedItem);
        }
      } else {
        transformedFiltered.push(transformedItem);
      }
    }
    if (hasSort) {
      try {
        transformedFiltered.sort(this._options.sort);
      } catch (err) {
        this._debug("processData", "error calling sort", err);
        throw new Error("error in sort: " + err.message);
      }
    }
    if (hasLimit) {
      limitDelta = transformedFiltered.length - this._options.limit;
      this._debug("processData", "checking limit", transformedFiltered.length, this._options.limit, limitDelta);
      if (limitDelta > 0) {
        unusedItems = transformedFiltered.slice(transformedFiltered.length - limitDelta);
        this._debug("processData", "unusedItems", unusedItems.length, unusedItems);
        transformedFiltered.splice(transformedFiltered.length - limitDelta, limitDelta);
      }
    }
    return {
      items: transformedFiltered,
      unused: unusedItems
    };
  };
  Instafeed.prototype._extractTags = function extractTags(str) {
    var exp = /#([^\s]+)/gi;
    var badChars = /[~`!@#$%^&*\(\)\-\+={}\[\]:;"'<>\?,\./|\\\s]+/i;
    var tags = [];
    var match = null;
    if (typeof str === "string") {
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
     case "IMAGE":
      type = "image";
      image = data.media_url;
      break;

     case "VIDEO":
      type = "video";
      image = data.thumbnail_url;
      break;

     case "CAROUSEL_ALBUM":
      type = "album";
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
    var hasTemplate = typeof this._options.template === "string";
    var hasRender = typeof this._options.render === "function";
    var item = null;
    var itemHtml = null;
    var container = null;
    var html = "";
    this._debug("renderData", "hasTemplate", hasTemplate, "hasRender", hasRender);
    if (typeof items !== "object" || items.length <= 0) {
      return;
    }
    for (var i = 0; i < items.length; i++) {
      item = items[i];
      if (hasRender) {
        try {
          itemHtml = this._options.render(item, this._options);
          this._debug("renderData", "custom render result", item, itemHtml);
        } catch (err) {
          this._debug("renderData", "error calling render", err);
          throw new Error("error in render: " + err.message);
        }
      } else if (hasTemplate) {
        itemHtml = this._basicRender(item);
      }
      if (itemHtml) {
        html = html + itemHtml;
      } else {
        this._debug("renderData", "render item did not return any content", item);
      }
    }
    this._debug("renderData", "html content", html);
    container = document.createElement("div");
    container.innerHTML = html;
    this._debug("renderData", "container", container, container.childNodes.length, container.childNodes);
    while (container.childNodes.length > 0) {
      this._debug("renderData", "appending child", container.childNodes[0]);
      this._state.node.appendChild(container.childNodes[0]);
    }
  };
  Instafeed.prototype._basicRender = function basicRender(data) {
    var exp = new RegExp(this._options.templateBoundaries[0] + "([\\s\\w.]+)" + this._options.templateBoundaries[1], "gm");
    var template = this._options.template;
    var match = null;
    var output = "";
    var substr = null;
    var lastIndex = 0;
    var keyPath = null;
    var keyPathValue = null;
    while ((match = exp.exec(template)) !== null) {
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
    while ((match = exp.exec(keyPath)) !== null) {
      if (typeof lastValue !== "object") {
        return null;
      }
      key = match[1];
      lastValue = lastValue[key];
    }
    return lastValue;
  };
  Instafeed.prototype._fail = function fail(err) {
    var didHook = this._runHook("error", err);
    if (!didHook && console && typeof console.error === "function") {
      console.error(err);
    }
    this._state.running = false;
  };
  Instafeed.prototype._start = function start() {
    this._state.running = true;
    this._runHook("before");
  };
  Instafeed.prototype._finish = function finish() {
    this._runHook("after");
    this._state.running = false;
  };
  Instafeed.prototype._success = function success(data) {
    this._runHook("success", data);
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
    apiRequest.ontimeout = function apiRequestTimedOut() {
      callbackOnce(new Error("api request timed out"));
    };
    apiRequest.onerror = function apiRequestOnError() {
      callbackOnce(new Error("api connection error"));
    };
    apiRequest.onload = function apiRequestOnLoad(event) {
      var contentType = apiRequest.getResponseHeader("Content-Type");
      var responseJson = null;
      scope._debug("apiRequestOnLoad", "loaded", event);
      scope._debug("apiRequestOnLoad", "response status", apiRequest.status);
      scope._debug("apiRequestOnLoad", "response content type", contentType);
      if (contentType.indexOf("application/json") >= 0) {
        try {
          responseJson = JSON.parse(apiRequest.responseText);
        } catch (err) {
          scope._debug("apiRequestOnLoad", "json parsing error", err, apiRequest.responseText);
          callbackOnce(new Error("error parsing response json"));
          return;
        }
      }
      if (apiRequest.status !== 200) {
        if (responseJson && responseJson.error) {
          callbackOnce(new Error(responseJson.error.code + " " + responseJson.error.message));
        } else {
          callbackOnce(new Error("status code " + apiRequest.status));
        }
        return;
      }
      callbackOnce(null, responseJson);
    };
    apiRequest.open("GET", url, true);
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
    if (typeof this._options.accessToken === "function") {
      this._debug("getAccessToken", "calling accessToken as function");
      timeoutCheck = setTimeout(function accessTokenTimeoutCheck() {
        scope._debug("getAccessToken", "timeout check", called);
        callbackOnce(new Error("accessToken timed out"), null);
      }, this._options.accessTokenTimeout);
      try {
        this._options.accessToken(function accessTokenReceiver(err, value) {
          scope._debug("getAccessToken", "received accessToken callback", called, err, value);
          callbackOnce(err, value);
        });
      } catch (err) {
        this._debug("getAccessToken", "error invoking the accessToken as function", err);
        callbackOnce(err, null);
      }
    } else {
      this._debug("getAccessToken", "treating accessToken as static", typeof this._options.accessToken);
      callbackOnce(null, this._options.accessToken);
    }
  };
  Instafeed.prototype._debug = function debug() {
    var args = null;
    if (this._options.debug && console && typeof console.log === "function") {
      args = [].slice.call(arguments);
      args[0] = "[Instafeed] [" + args[0] + "]";
      console.log.apply(null, args);
    }
  };
  Instafeed.prototype._runHook = function runHook(hookName, data) {
    var success = false;
    if (typeof this._options[hookName] === "function") {
      try {
        this._options[hookName](data);
        success = true;
      } catch (err) {
        this._debug("runHook", "error calling hook", hookName, err);
      }
    }
    return success;
  };
  return Instafeed;
});