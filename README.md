instafeed.js
============

Instafeed is a dead-simple way to add Instagram photos to your website. No jQuery required, just good 'ol plain javascript.

## Installation
Setting up Instafeed is pretty straight-forward. Just download the script and include it in your HTML:

```html
<script type="text/javascript" src="path/to/instafeed.min.js"></script>
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

Instafeed with automatically look for a `<div id="instafeed"></div>` and fill it with linked thumbnails. Of course, you can easily change this behavior using the __advanced options__.

## Requirements

The only thing you'll need to get going is a valid __client id__ from Instagram's API. You can easily register for one on [Instagram's website](http://instagram.com/developer/register/).

> If you want to get images from a specific user, you will need a valid oAuth token. Using an oAuth token has security risks. See the section on __"Security Considerations"__

## Advanced Options

- `clientId` (string) - Your API client id from Instagram. __Required__.
- `accessToken` (string) - A valid oAuth token. Required to use __get: 'user'__.
- `get` (string) - Customize what Instafeed fetches. Use __popular__, __tagged__, __location__, or __user__.
- `tagName` (string) - Name of the tag to get. Use with __get: 'tagged'__.
- `locationId` (number) - Unique id of a location to get. Use with __get: 'location'__.
- `userId` (number) - Unique id of a user to get. Use with __get: 'user'__.
- `target` (string) - The ID of a DOM element you want to add the images to.
- `links` (bool) - Wrap the images with a link to the photo on Instagram.
- `limit` (number) - Maximum number of Images to add. __Max of 60__.
- `resolution` (string) - Size of the images to get. Use __low_resolution__, __thumbnail__, or __standard_resolution__.
- `before` (function) - Callback function called before fetching images from Instagram.
- `success` (function(json)) - Callback function called when the Instagram API returns valid data, and before any images have been added to the DOM. (json data is the argument)
- `after` (function) - Callback function called when images have been added to the page.
- `error` (function(message)) - Callback function called when there is a problem fetching images from Instagram. (message string is the argument)
- `template` (string) - A custom template to use when parsing images (overrides the `links` option). Available options are:
    - `{{link}}` - the link url to view the image on Instagram
    - `{{image}}` - the permanent url the the image source
    - Ex: `<a class="animation" href="{{link}}"><img src="{{image}}" /></a>`

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

__1.1.0__

- Added option to use a custom html template with the __template__ option.
- Added ability to fetch several feeds at the same time (create separate instances).
- Added _before_, _success_, _after_, and _error_ callback functions.

__1.0.0__

- Initial release
