# Getting Started

## Installation

TODO

## Loading

Instafeed.js is compatible with all of the following loading mechanisms:

* [Browser globals](#browser-globals)
* [RequireJS](#requirejs)
* [CommonJS (`require`)](#commonjs)
* [ECMAScript Modules (`import`)](#ecmascript-modules)

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
requirejs(['path/to/instafeed.min.js'], function(Instafeed) {
  var feed = new Instafeed({
    //...
  });
});
```

#### CommonJS (`require`)

```js
const Instafeed = require('instafeed.js');

var feed = new Instafeed({
  //...
});
```

#### ECMAScript Modules (`import`)

```js
import Instafeed from 'instafeed.js';

var feed = new Instafeed({
  //...
});
```
