# Instafeed.js

Instafeed is a simple way to display your Instagram photos on your website.

We're in the process of launching instafeed.js v2, powered by the new Instagram Basic Display API. Guides and documentation are being created and will be added to the [project's wiki](https://github.com/stevenschobert/instafeed.js/wiki).

See the [v2 migration guide](https://github.com/stevenschobert/instafeed.js/wiki/Version-2-migration-guide) for help on updating from v1, or a [basic demonstration with code examples](https://codepen.io/companionstudio/pen/rNVPGOz).

For the now-non-functional v1.x library, please [see the Legacy API branch](https://github.com/stevenschobert/instafeed.js/tree/legacy-api).

## Installation

Setting up Instafeed is pretty straight-forward - there are 3 main steps.

 1. Create a Facebook app linked to Instagram, and add yourself as a test user. See [Managing User Tokens](https://github.com/stevenschobert/instafeed.js/wiki/Managing-Access-Tokens).
 2. Create an access token and provide it to an [Instagram Token service](https://github.com/companionstudio/instagram-token-agent)
 3. Add the instafeed.js script to your web page and provide some simple options. See [Basic Usage](https://github.com/stevenschobert/instafeed.js/wiki/Basic-Usage)

```html
<script type="text/javascript" src="path/to/instafeed.min.js"></script>
```

## Basic Usage

```html
<script type="text/javascript">
    var feed = new Instafeed({
      accessToken: 'your-token'
    });
    feed.run();
</script>

<div id="instafeed"></div>
```

Instafeed will automatically look for a `<div id="instafeed"></div>` and fill it with linked thumbnails. Of course, you can easily change this behavior using [standard options](#standard-options). Also check out the [advanced options](#advanced-options) for some advanced ways of customizing __Instafeed.js__.

## Requirements

 * A Facebook developer account, and an Instagram account with some media posted to it.
 * A Facebook app linked to your Instagram account, and a token generated through that app.
 * A service to keep your access token fresh

## Options

Here are some of the most commonly used options:

| Key  | Default Value  | Valid types | Description  |
|---|---|---|---|
| `accessToken` | `null` | String, Function | **Required.** The Instagram access token, either as a string, or a function which returns a string |
| `debug` | `false` | Boolean | Set to `true` to display debugging information |
| `filter` | `null` | Function | A function used to exclude images from your results. The function will be given the image data as an argument, and expects the function to return a boolean. |
| `limit` | `null` | Number | Display a maximum of this many posts | 
| `sort` | `null` | Function | A custom function to sort the media, rather than the default 'most recent' sorting|
| `target` | `'instafeed'` | String, DOM Element | Either the ID or the DOM element itself where you want to add the images. |
| `template` | `'<a href="{{link}}"><img title="{{caption}}" src="{{image}}" /></a>'` | String | A mustache template used to produce HTML for the document. |
| `transform` | `null` | Function | A function used to transform the image data before it is rendered. |

See [Options](https://github.com/stevenschobert/instafeed.js/wiki/Options-Reference) in the wiki for the complete reference.

## Templating

The easiest way to control the way Instafeed.js looks on your website is to use the __template__ option. You can write your own HTML markup and it will be used for every image that Instafeed.js fetches. See [Templating](https://github.com/stevenschobert/instafeed.js/wiki/Templating).

## Would you like to say thanks? Buy me a coffee! ## 

If you enjoy using Instafeed.js and want to say thanks, you can leave me a small tip. All payments
are securely handled through [Stripe](http://stripe.com).

**[Leave me a tip &rarr;](https://plasso.co/spschobert@gmail.com)**

## Change Log

__2.0.0rc1__ 

First release candidate based on the Basic Display API.

__1.4.1__

- Fixes an issue where some data used in templates would get incorrectly escaped.

__1.4.0__

- `accessToken` is no longer required to fetch images from user accounts!
- New template helpers for working with the new portrait and landscape images.
- `target` can now accept a DOM node directly, instead of just a string ID, thanks [@juhamust](https://github.com/juhamust)!
- Squashed the last (hopefully!) of the IE8 bugs.
- Fixed image loading errors when using Instafeed.js on a local file protocol (`file://`). Thanks [@spoonben](https://github.com/spoonben)!
- Added support from AMD and CommonJS.
- Improved error messaging when Instafeed.js can't find it's target element on the page.
- Instafeed.js no longer complains when trying to use strings for the `userId`, `locationId`, and `limit` options.

__1.3.2__

- Fixed the `useHttp` option when no template is set. Thanks @bartekn!

__1.3.1__

- Fixed an issue where `sortBy: "most-recent"` did not always correctly sort the images. Thanks
  [Neil Campbell](https://github.com/neilcampbell)!
- Changed the default `sortBy` option to be `none`.

__1.3.0__

- Image URLs are now protocol-relative by default. Use the new `useHttp` option to disable.
- Added the ability to filter out images using the `filter` option.
- Added pagination support using `.next()` and `.hasNext()` methods.
- Removed the default `limit` of 15 images. The option is still supported, but by default no limit
  is sent to the API.

__1.2.1__

- Fixed IE8 error "Object doesn't support this action".

__1.2.0__

- Added the ability to sort images! Use the __sortBy__ option.
- Added __{{likes}}__, __{{comments}}__, __{{id}}__, __{{caption}}__, __{{location}}__, and __{{model}}__, tags to the __template__ option.

__1.1.0__

- Added option to use a custom html template with the __template__ option.
- Added ability to fetch several feeds at the same time (create separate instances).
- Added __before__, __success__, __after__, and __error__ callback options.
- Added __mock__ option to only fetch data. Use with __success__ option for custom DOM manipulation.

__1.0.0__

- Initial release
