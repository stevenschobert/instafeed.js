/**
Instafeed.js
Dead-simple way to add Instagram photos to your website. 
No jQuery required, just plain 'ol javascript.

Demo: http://instafeedjs.com/
Source: https://github.com/stevenschobert/instafeed.js
*/

(function() {
  var Instafeed, root;

  Instafeed = (function() {
    function Instafeed(params) {
      var option, value;
      this.options = {
        target: 'instafeed',
        get: 'popular',
        resolution: 'thumbnail',
        links: true,
        limit: 15,
        before: function(){},
        success: function(){},
        error: function(){},
        complete: function(){}
      };
      if (typeof params === 'object') {
        for (option in params) {
          value = params[option];
          this.options[option] = value;
        }
      }
    }

    Instafeed.prototype.run = function() {
      var header, script;
      this.options.before.call(this);
      if (typeof this.options.clientId !== 'string') {
        if (typeof this.options.accessToken !== 'string') {
          throw new Error("Missing clientId or accessToken.");
        }
      }
      if (typeof this.options.accessToken !== 'string') {
        if (typeof this.options.clientId !== 'string') {
          throw new Error("Missing clientId or accessToken.");
        }
      }
      script = document.createElement('script');
      script.id = 'instafeed-fetcher';
      script.src = this._buildUrl();
      header = document.getElementsByTagName('head');
      header[0].appendChild(script);
      window.instafeedCache = new Instafeed(this.options);
      return true;
    };

    Instafeed.prototype.parse = function(response) {
      var anchor, fragment, header, image, images, img, _i, _len;
      if (typeof response !== 'object') {
        throw new Error('Invalid JSON response');
      }
      if (response.meta.code !== 200) {
        throw new Error("Problem parsing response: " + response.meta.error_message);
      }
      if (response.data.length === 0) {
        throw new Error("No images were returned from Instagram");
        this.options.error.call(this);
      }
	  if (typeof response == 'object') {
        this.options.success.call(this);
      }
      fragment = document.createDocumentFragment();
      images = response.data;
      if (images.length > this.options.limit) {
        images = images.slice(0, this.options.limit + 1 || 9e9);
      }
      for (_i = 0, _len = images.length; _i < _len; _i++) {
        image = images[_i];
        img = document.createElement('img');
        img.src = image.images[this.options.resolution].url;
        if (this.options.links === true) {
          anchor = document.createElement('a');
          anchor.href = image.link;
          anchor.appendChild(img);
          fragment.appendChild(anchor);
        } else {
          fragment.appendChild(img);
        }
      }
      document.getElementById(this.options.target).appendChild(fragment);
      this.options.complete.call(this);
      header = document.getElementsByTagName('head')[0];
      header.removeChild(document.getElementById('instafeed-fetcher'));
      delete window.instafeedCache;
      return true;
    };

    Instafeed.prototype._buildUrl = function() {
      var base, endpoint, final;
      base = "https://api.instagram.com/v1";
      switch (this.options.get) {
        case "popular":
          endpoint = "media/popular";
          break;
        case "tagged":
          if (typeof this.options.tagName !== 'string') {
            throw new Error("No tag name specified. Use the 'tagName' option.");
          }
          endpoint = "tags/" + this.options.tagName + "/media/recent";
          break;
        case "location":
          if (typeof this.options.locationId !== 'number') {
            throw new Error("No location specified. Use the 'locationId' option.");
          }
          endpoint = "locations/" + this.options.locationId + "/media/recent";
          break;
        case "user":
          if (typeof this.options.userId !== 'number') {
            throw new Error("No user specified. Use the 'userId' option.");
          }
          if (typeof this.options.accessToken !== 'string') {
            throw new Error("No access token. Use the 'accessToken' option.");
          }
          endpoint = "users/" + this.options.userId + "/media/recent";
          break;
        default:
          throw new Error("Invalid option for get: '" + this.options.get + "'.");
      }
      final = "" + base + "/" + endpoint;
      if (this.options.accessToken != null) {
        final += "?access_token=" + this.options.accessToken;
      } else {
        final += "?client_id=" + this.options.clientId;
      }
      final += "&count=" + this.options.limit;
      final += "&callback=instafeedCache.parse";
      return final;
    };
    return Instafeed;
  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;
  root.Instafeed = Instafeed;
}).call(this);