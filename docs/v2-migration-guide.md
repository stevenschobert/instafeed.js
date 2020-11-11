# Migrating to Version 2

Quite a few things have changed with the switch to Instagram's new API. The amount of information the new API provides about images and videos is greatly reduced. This is great thing for privacy, but as a result some options in v1 are no longer available in v2.

v2 provides a much simpler service, but should still cater to the most common use-case for Instafeed: embedding your most recent Instagram posts on your website.

## Key Changes:

 - Media is generally only available from the user that the access token belongs to. (You can only display your own posts)
 - Geographic/location information is not available
 - Searching by tag is not available
 - Information on likes and comments is not available
 - Most sorting options are removed - only sort by name, date is available

## Additional requirements:

 - An access token refresh service is required. See [Managing Access Tokens](#managing-access-tokens) for more info.

## Migrating, Step by Step

Assuming you have a simple Instafeed implementation (a single user's most recent images), follow these steps to update to v2.

 1. [Setup your Facebook app](https://github.com/stevenschobert/instafeed.js/wiki/Facebook-app-and-test-user-setup)
 2. [Set up the token agent](https://github.com/stevenschobert/instafeed.js/wiki/Managing-Access-Tokens) and include the script on your web page, before the Instafeed script.
 3. Update instafeed.js on your website. Current release is `v2.0.0rc1` _This process varies depending on how you have included the script initially_.
 4. Review and update your Instafeed options. See below for which options have been changed or removed.

## Comparison of options between v1 and v2:

These are the v1 options and their status in v2:

| Key  | Status  | Notes  |
|---|---|---|
| accessToken | Required, Updated | The accessToken from the Facebook App associated with the user. Needs to be retrieved from a token service. [More info](Managing-Access-Tokens) |
| after | Optional | Works as v1 |
| before | Optional | Works as v1 |
| ~clientId~ | Removed | Basic display API only supports getting the user's own media. |
| error | Optional | Works as v1 |
| filter | Optional | Works as v1 |
| ~get~ | Removed | No longer supported by Basic Display API |
| limit | Optional, Updated |  Maximum number of media items to add to the page. This limit is applied in the browser. Basic Display API limits are unclear. |
| ~links~ | Removed | Links are included by default. Use the template option to control this instead. |
| ~locationId~ | Removed | No longer supported by Basic Display API |
| mock | Optional | Works as v1 |
| ~resolution~ | Removed | A single image resolution is returned by the Basic Display API. This is generally high resolution - 1440px wide is typical. |
| sortBy | Removed | Replaced by the new `sort` option, which uses a function. Sorting is performed in the browser.  |
| success | Optional | Works as v1 |
| ~tagName~ | Removed | No longer supported by Basic Display API. Use `filter` instead |
| target | Optional | Either the ID name or the DOM element itself where you want to add the images to. |
| template | Optional, Updated | Custom HTML template to render media. See templating. |
| ~useHttp~ | Removed | All URLs are HTTPS only |
| ~userId~ | Removed | No longer supported by Basic Display API |

See the full [v2 options reference](Options-Reference)
