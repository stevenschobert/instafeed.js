instafeed.js
============
[![Build Status](https://travis-ci.org/stevenschobert/instafeed.js.svg?branch=master)](https://travis-ci.org/stevenschobert/instafeed.js)

Instafeed is a dead-simple way to add Instagram photos to your website. No jQuery required, just good 'ol plain javascript.

__Examples:__

- [Hemeon.com](http://hemeon.com/) by [Marc Hemeon](https://twitter.com/hemeon)
- [VinThomas.com](http://vinthomas.com/) by [Vin Thomas](https://twitter.com/vinthomas)
- [The Kozik Cocoon](http://www.kozikcocoon.com/) by [Danny Palmer](http://twitter.com/dannyprose)

__Buy me a coffee:__

If you enjoy using Instafeed.js and want to say thanks, you can leave me a small tip. All payments
are securely handled through [Stripe](http://stripe.com).

**[Leave me a tip &rarr;](https://plasso.co/spschobert@gmail.com)**

## Installation
Setting up Instafeed is pretty straight-forward. Just download the script and include it in your HTML:

```html
<script type="text/javascript" src="path/to/instafeed.min.js"></script>
```

### NPM/Bower

Instafeed.js is also available on NPM and Bower:

```sh
npm install instafeed.js      # npm
bower install instafeed.js    # bower
```

## Basic Usage
Here's how easy it is to get all images tagged with __#awesome__:

```html
<script type="text/javascript">
    var feed = new Instafeed({
        get: 'tagged',
        tagName: 'awesome',
        clientId: 'YOUR_CLIENT_ID'
    });
    feed.run();
</script>
```

Instafeed with automatically look for a `<div id="instafeed"></div>` and fill it with linked thumbnails. Of course, you can easily change this behavior using [standard options](#standard-options). Also check out the [advanced options](#advanced-options) for some advanced ways of customizing __Instafeed.js__.

## Requirements

The only thing you'll need to get going is a valid __client id__ from Instagram's API. You can easily register for one on [Instagram's website](http://instagram.com/developer/register/).

> If you want to get images from a specific user, you will need a valid oAuth token. Using an oAuth token has security risks. See the section on __"Security Considerations"__

## Standard Options

- `clientId` (string) - Your API client id from Instagram. __Required__.
- `accessToken` (string) - A valid oAuth token. Required to use __get: 'user'__.
- `target` (string) - The ID of a DOM element you want to add the images to.
- `template` (string) - Custom HTML template to use for images. See [templating](#templating).
- `get` (string) - Customize what Instafeed fetches. Available options are:
    - `popular` (default) - Images from the popular page
    - `tagged` - Images with a specific tag. Use `tagName` to specify the tag.
    - `location` - Images from a location. Use `locationId` to specify the location
    - `user` - Images from a user. Use `userId` to specify the user.
- `tagName` (string) - Name of the tag to get. Use with `get: 'tagged'`.
- `locationId` (number) - Unique id of a location to get. Use with `get: 'location'`.
- `userId` (number) - Unique id of a user to get. Use with `get: 'user'`.
- `sortBy` (string) - Sort the images in a set order. Available options are:
    - `none` (default) - As they come from Instagram.
    - `most-recent` - Newest to oldest.
    - `least-recent` - Oldest to newest.
    - `most-liked` - Highest # of likes to lowest.
    - `least-liked` - Lowest # likes to highest.
    - `most-commented` - Highest # of comments to lowest.
    - `least-commented` - Lowest # of comments to highest.
    - `random` - Random order.
- `links` (bool) - Wrap the images with a link to the photo on Instagram.
- `limit` (number) - Maximum number of Images to add. __Max of 60__.
- `useHttp` (bool) - By default, image urls are protocol-relative. Set to `true`
  to use the standard `http://`.
- `resolution` (string) - Size of the images to get. Available options are:
    - `thumbnail` (default) - 150x150
    - `low_resolution` - 306x306
    - `standard_resolution` - 612x612

## Advanced Options

- `before` (function) - A callback function called before fetching images from Instagram.
- `after` (function) - A callback function called when images have been added to the page.
- `success` (function) - A callback function called when Instagram returns valid data. (argument -> json object)
- `error` (function) - A callback function called when there is an error fetching images. (argument -> string message)
- `mock` (bool) - Set to true fetch data without inserting images into DOM. Use with __success__ callback.
- `filter` (function) - A function used to exclude images from your results. The function will be
  given the image data as an argument, and expects the function to return a boolean. See the example
  below for more information.

__Example Filter (get username + tagged):__

```js
var feed = new Instafeed({
  get: 'user',
  userId: USER_ID,
  filter: function(image) {
    return image.tags.indexOf('TAG_NAME') >= 0;
  }
});
feed.run();
```

To see a full list of properties that `image` has, see [issue #21](https://github.com/stevenschobert/instafeed.js/issues/21).

## Templating

The easiest way to control the way Instafeed.js looks on your website is to use the __template__ option. You can write your own HTML markup and it will be used for every image that Instafeed.js fetches.

Here's a quick example:

```html
<script type="text/javascript">
    var feed = new Instafeed({
        get: 'popular',
        tagName: 'awesome',
        clientId: 'YOUR_CLIENT_ID',
        template: '<a class="animation" href="{{link}}"><img src="{{image}}" /></a>'
    });
    feed.run();
</script>
```

Notice the `{{link}}` and `{{image}}`? The templating option provides several tags for you to use to control where variables are inserted into your HTML markup. Available keywors are:

- `{{link}}` - URL to view the image on Instagram's website.
- `{{image}}` - URL of the image source. The size is inherited from the `resolution` option.
- `{{id}}` - Unique ID of the image. Useful if you want to use [iPhone hooks](http://instagram.com/developer/iphone-hooks/) to open the images directly in the Instagram app.
- `{{caption}}` - Image's caption text. Defaults to empty string if there isn't one.
- `{{likes}}` - Number of likes the image has.
- `{{comments}}` - Number of comments the image has.
- `{{location}}` - Name of the location associated with the image. Defaults to empty string if there isn't one.
- `{{model}}` - Full JSON object of the image. If you want to get a property of the image that isn't listed above you access it using dot-notation. (ex: `{{model.filter}}` would get the filter used.)

## Pagination

As of __v1.3__, Instafeed.js has a `.next()` method you can call to load more images from Instagram.
Under the hood, this uses the _pagination_ data from the API. Additionall, there is a helper
`.hasNext()` method that you can use to check if pagination data is available.

Together these options can be used to create a "Load More" button:

```js
// grab out load more button
var loadButton = document.getElementById('load-more'),

    feed = new Instafeed({
      // every time we load more, run this function
      after: function() {
        // disable button if no more results to load
        if (!this.hasNext()) {
          loadButton.setAttribute('disabled', 'disabled');
        }
      },
    });

// bind the load more button
loadButton.addEventListener('click', function() {
  feed.next();
});

// run our feed!
feed.run();
```

## Security Considerations

With Instafeed, it is possible to get images from a specific user id:

```html
<script type="text/javascript">
    var userFeed = new Instafeed({
        get: 'user',
        userId: YOUR_USER_ID,
        accessToken: 'YOUR_ACCESS_TOKEN'
    });
    userFeed.run();
</script>
```

This setup requires an __accessToken__. Normally, using tokens like this in javascript would be _very bad_. However, since Instagram provides [scoping](http://instagram.com/developer/authentication/) in their API, you can limit the risk of user impersonation.

Just always make sure your token is set to __basic authorization__, which only allows 'GET' requests. If you aren't sure what scope your token has, check under your [account page](https://instagram.com/accounts/manage_access).

## Contributing to Development

This isn't a large project by any means, but I'm definitely welcome to any pull requests and contributions. Everything is written and tested in [CoffeeScript](http://coffeescript.org).

You can get your copy up and running for development quickly by cloning the repo and running [npm](http://npmjs.org/):

```
$ npm install
```

This will install all the necessary test tools for testing. There is also a Makefile in the repo to make your tests quick and easy:

- `make test` will run all the tests using [Mocha](http://visionmedia.github.com/mocha/) + [Chai](http://chaijs.com/) + [CoffeeLint](http://www.coffeelint.org/)
- `make min` will create the minified version
- `make` will run both the previous steps and compile everything

## Change Log

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
