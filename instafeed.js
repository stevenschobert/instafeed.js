// Generated by CoffeeScript 1.9.3
(function() {
  var Instafeed;

  Instafeed = (function() {
    function Instafeed(params, context) {
      var option, value;
      this.options = {
        target: 'instafeed',
        sortBy: 'none',
        userId: 'me',
        links: true,
        mock: false
      };
      if (typeof params === 'object') {
        for (option in params) {
          value = params[option];
          this.options[option] = value;
        }
      }
      this.context = context != null ? context : this;
    }

    Instafeed.prototype.hasNext = function() {
      return typeof this.context.nextUrl === 'string' && this.context.nextUrl.length > 0;
    };

    Instafeed.prototype.next = function() {
      if (!this.hasNext()) {
        return false;
      }
      return this.run(this.context.nextUrl);
    };

    Instafeed.prototype.run = function(url) {
      var self;
      if (typeof this.options.accessToken !== 'string') {
        throw new Error("Missing accessToken.");
      }
      if ((this.options.before != null) && typeof this.options.before === 'function') {
        this.options.before.call(this);
      }
      if (typeof url !== 'string') {
        url = "https://graph.instagram.com/" + this.options.userId + "/media?fields=caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=" + this.options.accessToken;
      }
      self = this;
      return ((fetch(url, {
        mode: "cors",
        referrer: "no-referrer",
        referrerPolicy: "no-referrer"
      })).then(function(headers) {
        return headers.json();
      })).then(function(response) {
        self.parse(response);
        return true;
      });
    };

    Instafeed.prototype.parse = function(response) {
      var anchor, childNodeCount, childNodeIndex, childNodesArr, eMsg, fragment, i, imageString, imageURL, imgUrl, j, k, l, len, len1, len2, len3, media, mediaString, medias, node, options, parsedLimit, reverse, sortSettings, targetEl, tmpEl;
      if (typeof response !== 'object') {
        if ((this.options.error != null) && typeof this.options.error === 'function') {
          this.options.error.call(this, 'Invalid JSON data');
          return false;
        } else {
          throw new Error('Invalid JSON response');
        }
      }
      if (response.data.length === 0) {
        if ((this.options.error != null) && typeof this.options.error === 'function') {
          this.options.error.call(this, 'No images were returned from Instagram');
          return false;
        } else {
          throw new Error('No images were returned from Instagram');
        }
      }
      if ((this.options.success != null) && typeof this.options.success === 'function') {
        this.options.success.call(this, response);
      }
      this.context.nextUrl = '';
      if (response.next != null) {
        this.context.nextUrl = response.next;
      }
      if (this.options.sortBy !== 'none') {
        if (this.options.sortBy === 'random') {
          sortSettings = ['', 'random'];
        } else {
          sortSettings = this.options.sortBy.split('-');
        }
        reverse = sortSettings[0] === 'least' ? true : false;
        switch (sortSettings[1]) {
          case 'random':
            response.data.sort(function() {
              return 0.5 - Math.random();
            });
            break;
          case 'recent':
            response.data = this._sortBy(response.data, 'timestamp', reverse);
            break;
          default:
            throw new Error("Invalid option for sortBy: '" + this.options.sortBy + "'.");
        }
      }
      if ((typeof document !== "undefined" && document !== null) && this.options.mock === false) {
        medias = response.data;
        parsedLimit = parseInt(this.options.limit, 10);
        if ((this.options.limit != null) && medias.length > parsedLimit) {
          medias = medias.slice(0, parsedLimit);
        }
        fragment = document.createDocumentFragment();
        if ((this.options.filter != null) && typeof this.options.filter === 'function') {
          medias = this._filter(medias, this.options.filter);
        }
        if ((this.options.template != null) && (typeof this.options.template === 'string' || typeof this.options.template === 'function')) {
          imageString = '';
          imgUrl = '';
          tmpEl = document.createElement('div');
          for (i = 0, len = medias.length; i < len; i++) {
            media = medias[i];
            if (media.media_type === 'VIDEO') {
              imageURL = media.thumbnail_url;
            } else {
              imageURL = media.media_url;
            }
            options = {
              model: media,
              id: media.id,
              link: media.permalink,
              type: media.media_type,
              image_url: imageURL,
              media_url: media.media_url,
              caption: media.caption
            };
            if (typeof this.options.template === 'function') {
              mediaString = this.options.template(options);
            } else {
              mediaString = this._makeTemplate(this.options.template, options);
            }
            if (typeof mediaString === 'string') {
              tmpEl.innerHTML += mediaString;
            } else if (mediaString instanceof Array) {
              for (j = 0, len1 = mediaString.length; j < len1; j++) {
                node = mediaString[j];
                tmpEl.appendChild(node);
              }
            } else {
              tmpEl.appendChild(mediaString);
            }
          }
          childNodesArr = [];
          childNodeIndex = 0;
          childNodeCount = tmpEl.childNodes.length;
          while (childNodeIndex < childNodeCount) {
            childNodesArr.push(tmpEl.childNodes[childNodeIndex]);
            childNodeIndex += 1;
          }
          for (k = 0, len2 = childNodesArr.length; k < len2; k++) {
            node = childNodesArr[k];
            fragment.appendChild(node);
          }
        } else {
          for (l = 0, len3 = medias.length; l < len3; l++) {
            media = medias[l];
            if (media.media_type === 'VIDEO') {
              node = document.createElement('video');
              node.controls = true;
              node.preload = "metadata";
              node.poster = media.thumbnail_url;
              node.src = media.media_url;
            } else {
              node = document.createElement('img');
              node.src = media.media_url;
            }
            if (this.options.links === true) {
              anchor = document.createElement('a');
              anchor.href = media.permalink;
              anchor.appendChild(node);
              fragment.appendChild(anchor);
            } else {
              fragment.appendChild(node);
            }
          }
        }
        targetEl = this.options.target;
        if (typeof targetEl === 'string') {
          targetEl = document.getElementById(targetEl);
        }
        if (targetEl == null) {
          eMsg = "No element with id=\"" + this.options.target + "\" on page.";
          throw new Error(eMsg);
        }
        targetEl.appendChild(fragment);
      }
      if ((this.options.after != null) && typeof this.options.after === 'function') {
        this.options.after.call(this);
      }
      return true;
    };

    Instafeed.prototype._makeTemplate = function(template, data) {
      var output, pattern, ref, varName, varValue;
      pattern = /(?:\{{2})([\w\[\]\.]+)(?:\}{2})/;
      output = template;
      while (pattern.test(output)) {
        varName = output.match(pattern)[1];
        varValue = (ref = this._getObjectProperty(data, varName)) != null ? ref : '';
        output = output.replace(pattern, function() {
          return "" + varValue;
        });
      }
      return output;
    };

    Instafeed.prototype._getObjectProperty = function(object, property) {
      var piece, pieces;
      property = property.replace(/\[(\w+)\]/g, '.$1');
      pieces = property.split('.');
      while (pieces.length) {
        piece = pieces.shift();
        if ((object != null) && piece in object) {
          object = object[piece];
        } else {
          return null;
        }
      }
      return object;
    };

    Instafeed.prototype._sortBy = function(data, property, reverse) {
      var sorter;
      sorter = function(a, b) {
        var valueA, valueB;
        valueA = this._getObjectProperty(a, property);
        valueB = this._getObjectProperty(b, property);
        if (reverse) {
          if (valueA > valueB) {
            return 1;
          } else {
            return -1;
          }
        }
        if (valueA < valueB) {
          return 1;
        } else {
          return -1;
        }
      };
      data.sort(sorter.bind(this));
      return data;
    };

    Instafeed.prototype._filter = function(images, filter) {
      var filteredImages, fn, i, image, len;
      filteredImages = [];
      fn = function(image) {
        if (filter(image)) {
          return filteredImages.push(image);
        }
      };
      for (i = 0, len = images.length; i < len; i++) {
        image = images[i];
        fn(image);
      }
      return filteredImages;
    };

    return Instafeed;

  })();

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if (typeof module === 'object' && module.exports) {
      return module.exports = factory();
    } else {
      return root.Instafeed = factory();
    }
  })(this, function() {
    return Instafeed;
  });

}).call(this);
