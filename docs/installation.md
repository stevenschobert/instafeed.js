## Installation

Setting up Instafeed.js is pretty straight-forward - there are 3 main steps.

1.  Create a Facebook app linked to a Professional Instagram Account, and add yourself as a test user. See [steps 1-6 of the official documentation](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/create-a-meta-app-with-instagram)
2.  Create an access token and provide it to an Instagram Token service. See [Managing User Tokens](tokens).
3.  Add the instafeed.js script to your web page and provide some simple options. See [Usage](usage).

Instafeed.js is compatible with all of the following loading mechanisms:

- [Browser globals](#browser-globals)
- [RequireJS](#requirejs)
- [CommonJS (`require`)](#commonjs)
- [ECMAScript Modules (`import`)](#ecmascript-modules)

#### Browser Globals

If you are loading Instafeed.js via the standard `<script>` tag, Instafeed.js will be available under the global variable `Instafeed`:

```html
<script type="text/javascript" src="path/to/instafeed.min.js"></script>
<script type="text/javascript">
  var feed = new Instafeed({
    //...
  });
</script>
```

#### RequireJS

```js
requirejs(["path/to/instafeed.min.js"], function (Instafeed) {
  var feed = new Instafeed({
    //...
  });
});
```

#### CommonJS (`require`)

```js
const Instafeed = require("instafeed.js");

var feed = new Instafeed({
  //...
});
```

#### ECMAScript Modules (`import`)

```js
import Instafeed from "instafeed.js";

var feed = new Instafeed({
  //...
});
```
