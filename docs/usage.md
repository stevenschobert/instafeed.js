## Basic Usage

```html
<div id="instafeed"></div>

<script type="text/javascript">
  var feed = new Instafeed({
    accessToken: "your-token",
  });
  feed.run();
</script>
```

Instafeed will automatically look for a `<div id="instafeed"></div>` and fill it with linked thumbnails. Of course, you can easily change this behavior using the options below.

See [Managing Access Tokens](tokens) for more information on how to make sure your access token stays fresh.

## Options

Here are all of the options available:

| Key                  | Default Value                                                          | Valid types         | Description                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `accessToken`        | `null`                                                                 | String, Function    | **Required.** The Instagram access token, either as a string, or a function which returns a string                                                           |
| `accessTokenTimeout` | `5000`                                                                 | Number              | If you pass a function to `accessToken`, how long to wait for a response.                                                                                    |
| `after`              | `null`                                                                 | Function            | A callback function called when images have been added to the page.                                                                                          |
| `apiTimeout`         | `5000`                                                                 | Number              | How long to wait for a response from the Instagram API                                                                                                       |
| `debug`              | `false`                                                                | Boolean             | Set to `true` to log debugging information to the console                                                                                                    |
| `error`              | `null`                                                                 | Function            | A callback function called when an error occurs during processing.                                                                                           |
| `filter`             | `null`                                                                 | Function            | A function used to exclude images from your results. The function will be given the image data as an argument, and expects the function to return a boolean. |
| `limit`              | `null`                                                                 | Number              | Display a maximum of this many posts                                                                                                                         |
| `mock`               | `false`                                                                | Boolean             | Set to true fetch data without inserting images into DOM. Use with success callback.                                                                         |
| `render`             | `null`                                                                 | Function            | Provide a custom function used to render the item from the image data. Should provide HTML ready to be inserted into the document.                           |
| `sort`               | `null`                                                                 | Function            | A custom function to sort the media, rather than the default 'most recent' sorting                                                                           |
| `success`            | `null`                                                                 | Function            | A callback function called when Instagram API has returned valid data, before any transforming or rendering is done.                                         |
| `target`             | `'instafeed'`                                                          | String, DOM Element | Either the ID or the DOM element itself where you want to add the images.                                                                                    |
| `template`           | `'<a href="{{link}}"><img title="{{caption}}" src="{{image}}" /></a>'` | String              | A mustache template used to produce HTML for the document. See [Templating](Templating).                                                                     |
| `templateBoundaries` | `['{{','}}']`                                                          | Array               | The starting and ending delimiters for your templating format                                                                                                |
| `transform`          | `null`                                                                 | Function            | A function used to transform the image data before it is rendered. See [Data Transformations](Data-Transformations).                                         |

## Templating

The easiest way to control the way Instafeed.js looks on your website is to use the **template** option. You can write your own HTML markup and it will be used for every image that Instafeed.js fetches.

Instafeed uses mustache-style templates to produce HTML for your page. If you want to change the HTML Instafeed creates, you can provide your own template.

The default template is:

`<a href="{{link}}"><img title="{{caption}}" src="{{image}}" /></a>`

This produces a link pointing to the post on Instagram, containing the image, with the title set to the caption.

You can use the following templating tags:

- `{{image}}` The URL to the image (The first image of an album post, or the preview frame of a video)
- `{{type}}` One of either `image`, `video`, and `album`
- `{{link}}` The URL of the post on Instagram

## Accessing the Instagram API response

The [raw data object](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#fields) returned by Instagram, plus any attributes you add using the `transform` function are accessible via the `model` tag. eg: `{{model.id}}` returns the post's ID.

The fields currently available are:

- `caption`: The Media's caption text. Not returnable for Media in albums.
- `id`: The Media's ID.
- `media_type`: The Media's type. Can be IMAGE, VIDEO, or CAROUSEL_ALBUM.
- `media_url`: The Media's URL.
- `permalink`: The Media's permanent URL.
- `thumbnail_url`: The Media's thumbnail image URL. Only available on VIDEO Media.
- `timestamp`: The Media's publish date in ISO 8601 format.
- `username`: The Media owner's username.
