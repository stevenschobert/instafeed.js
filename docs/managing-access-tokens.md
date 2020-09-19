# Managing Access Tokens

The [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api/), which powers version 2.0 of Instafeed.js, uses access tokens that are only valid 60 days.

This means that you will need a server-side component to keep your access token valid in order for Instafeed.js to work correctly.

There are currently 2 available options for keeping access tokens valid:

* [Instagram Token Agent](#instagram-token-agent)
* [Instant-tokens.com](#instant-tokenscom)

## History

In 2019, Instagram launched the [Instagram Basic Display API](https://developers.facebook.com/blog/post/2019/10/15/launch-instagram-basic-display-api/) and announced they would be sunsetting their Legacy API, which powered the 1.0 version of Instafeed.js, in 2020.

In the Legacy API, access tokens had no expiration time, so Instafeed.js was originally designed to have users hard-code their access tokens (which were read-only) in the browser-side code of their webpages. However, when the Basic Display API was initially launched, access tokens were short-lived, and only valid for 1 hour. This posed a challenge for Instafeed.js, since the library relied on those tokens being hard-coded.

In 2020 however, Instagram [added support for long-lived access tokens](https://developers.facebook.com/blog/post/2020/01/14/instagram-basic-display-api-long-lived-access-tokens-available/), opening up an migration path for Instafeed.js.

These long-lived access tokens did come with a caveat, which is that it would require _some_ amount of server-side code to keep the tokens refreshed past their 60-day lifetime.

## Instant-tokens.com

[Instant-tokens.com](https://www.instant-tokens.com) is a website that generates & refreshes Instagram access tokens. It is provided for free by [Coding Badger](https://codingbadger.com), and is easy to integrate with Instafeed.js.

Pros:
* Free to use
* No setup required, just sign in with your Instagram account.

Cons:
* Closed-source
* Owned & operated by 3rd party (Coding Badger)

## Instagram Token Agent

[Instagram Token Agent](https://github.com/companionstudio/instagram-token-agent) is an open-source Ruby-on-Rails application written by Ben Hull, and [available on GitHub](https://github.com/companionstudio/instagram-token-agent). It can be quickly deployed to Heroku, or any other Rails-compatible hosting mechanism.

Pros:
* Open-source
* Fully controllable by you

Cons:
* Requires some setup (e.g. creating Facebook API keys, deploying application)
* Relies on a Sandbox developer account (unless you can get approval from Facebook), which has some limitations.
