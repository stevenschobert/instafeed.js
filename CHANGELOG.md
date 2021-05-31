# Changelog

__2.0.0__

Official v2 release 🎉

If you are migrating from v1, see the [v2 migration guide](https://github.com/stevenschobert/instafeed.js/wiki/Version-2-migration-guide#comparison-of-options-between-v1-and-v2).

__2.0.0-rc3__

- Fixes `assignment to undeclared variable match` bug.
- Adds ES module support by building a separate distributable `instafeed.es.min.js`.
- Re-adds pagination support via `hasNext` and `next` methods.
- Adds `apiLimit` option to override how many images are requested from the Instagram API. This option supersedes the `limit` option.
- Adds pooling support when `apiLimit` is higher than `limit`.

__2.0.0-rc2__

- Adds `before` callback option that was missing from `2.0.0-rc1`.
- Fixes `Invalid State Error` bug in Internet Explorer. Thanks [@awoodford](https://github.com/awoodford).
- Hashtags are now parsed from the image caption, and made available as a `tags` array on the image data.
- Changed default timeout options `apiTimeout` and `accessTokenTimeout` from `5000` (5 seconds) to `10000` (10 seconds)

__2.0.0-rc1__

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
