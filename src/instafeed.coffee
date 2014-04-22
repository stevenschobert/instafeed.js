class Instafeed
  constructor: (params, context) ->
    # default options
    @options =
      target: 'instafeed'
      get: 'popular'
      resolution: 'thumbnail'
      sortBy: 'none'
      links: true
      mock: false
      useHttp: false

    # if an object is passed in, override the default options
    if typeof params is 'object'
      @options[option] = value for option, value of params

    # save a reference to context, which defaults to curr scope
    # this will be used to cache data from parsing to the real
    # instance the user interacts with (for pagination)
    @context = if context? then context else this

    # generate a unique key for the instance
    @unique = @_genKey()

  # method to check if there are more results to load
  hasNext: ->
    return typeof @context.nextUrl is 'string' and @context.nextUrl.length > 0

  # method to display next results using the pagination
  # data from API. Manually passing a url to .run() will
  # bypass the URL creation from options.
  next: ->
    # check for a valid next url first
    return false if not @hasNext()

    # call run with the next results
    return @run(@context.nextUrl)

  # MAKE IT GO!
  run: (url) ->
    # make sure either a client id or access token is set
    if typeof @options.clientId isnt 'string'
      unless typeof @options.accessToken is 'string'
        throw new Error "Missing clientId or accessToken."
    if typeof @options.accessToken isnt 'string'
      unless typeof @options.clientId is 'string'
        throw new Error "Missing clientId or accessToken."

    # run the before() callback, if one is set
    if @options.before? and typeof @options.before is 'function'
      @options.before.call(this)

    # to make it easier to test various parts of the class,
    # any DOM manipulation first checks for the DOM to exist
    if document?
      # make a new script element
      script = document.createElement 'script'

      # give the script an id so it can removed later
      script.id = 'instafeed-fetcher'

      # assign the script src using _buildUrl(), or by
      # using the argument passed to the function
      script.src = url || @_buildUrl()

      # add the new script object to the header
      header = document.getElementsByTagName 'head'
      header[0].appendChild script

      # create a global object to cache the options
      instanceName = "instafeedCache#{@unique}"
      window[instanceName] = new Instafeed @options, this
      window[instanceName].unique = @unique

    # return true if everything ran
    true

  # Data parser (must be a json object)
  parse: (response) ->
    # throw an error if not an object
    if typeof response isnt 'object'
      # either throw an error or call the error callback
      if @options.error? and typeof @options.error is 'function'
        @options.error.call(this, 'Invalid JSON data')
        return false
      else
        throw new Error 'Invalid JSON response'

    # check if the api returned an error code
    if response.meta.code isnt 200
      # either throw an error or call the error callback
      if @options.error? and typeof @options.error is 'function'
        @options.error.call(this, response.meta.error_message)
        return false
      else
        throw new Error "Error from Instagram: #{response.meta.error_message}"

    # check if the returned data is empty
    if response.data.length is 0
      # either throw an error or call the error callback
      if @options.error? and typeof @options.error is 'function'
        @options.error.call(this, 'No images were returned from Instagram')
        return false
      else
        throw new Error 'No images were returned from Instagram'

    # call the success callback if no errors in response
    if @options.success? and typeof @options.success is 'function'
      @options.success.call(this, response)

    # cache the pagination data, if it exists. Apply the value
    # to the "context" object, which will be a true reference
    # if this instance was created just for parsing
    @context.nextUrl = ''
    if response.pagination?
      @context.nextUrl = response.pagination.next_url

    # before images are inserted into the DOM, check for sorting
    if @options.sortBy isnt 'none'
      # if sort is set to random, don't check for polarity
      if @options.sortBy is 'random'
        sortSettings = ['', 'random']
      else
        # get the sort settings from @options
        sortSettings = @options.sortBy.split('-')

      # determine if the order should be inverse
      reverse = if sortSettings[0] is 'least' then true else false

      # handle the case for sorting
      switch sortSettings[1]
        when 'random'
          response.data.sort () ->
            return 0.5 - Math.random()

        when 'recent'
          response.data = @_sortBy(response.data, 'created_time', reverse)

        when 'liked'
          response.data = @_sortBy(response.data, 'likes.count', reverse)

        when 'commented'
          response.data = @_sortBy(response.data, 'comments.count', reverse)

        else throw new Error "Invalid option for sortBy: '#{@options.sortBy}'."

    # to make it easier to test various parts of the class,
    # any DOM manipulation first checks for the DOM to exist
    if document? and @options.mock is false
      # limit the number of images if needed
      images = response.data
      if @options.limit?
        images = images[0..@options.limit] if images.length > @options.limit

      # create the document fragment
      fragment = document.createDocumentFragment()

      # filter the results
      if @options.filter? and typeof @options.filter is 'function'
        images = @_filter(images, @options.filter)

      # determine whether to parse a template, or use html fragments
      if @options.template? and typeof @options.template is 'string'
        # create an html string
        htmlString = ''
        imageString = ''
        imgUrl = ''

        # create a temp dom node that will hold the html
        tmpEl = document.createElement('div')

        # loop through the images
        for image in images
          # use protocol relative image url
          imageUrl = image.images[@options.resolution].url
          imageUrl = imageUrl.replace('http://', '//') unless @options.useHttp

          # parse the template
          imageString = @_makeTemplate @options.template,
            model: image
            id: image.id
            link: image.link
            image: imageUrl
            caption: @_getObjectProperty(image, 'caption.text')
            likes: image.likes.count
            comments: image.comments.count
            location: @_getObjectProperty(image, 'location.name')

          # add the image partial to the html string
          htmlString += imageString

        # add the final html string to the temp node
        tmpEl.innerHTML = htmlString

        # loop through the contents of the temp node
        # and append them to the fragment
        for node in [].slice.call(tmpEl.childNodes)
          fragment.appendChild(node)
      else
        # loop through the images
        for image in images
          # create the image using the @options's resolution
          img = document.createElement 'img'

          # use protocol relative image url
          imageUrl = image.images[@options.resolution].url
          imageUrl = imageUrl.replace('http://', '//') unless @options.useHttp
          img.src = imageUrl

          # wrap the image in an anchor tag, unless turned off
          if @options.links is true
            # create an anchor link
            anchor = document.createElement 'a'
            anchor.href = image.link

            # add the image to it
            anchor.appendChild img

            # add the anchor to the fragment
            fragment.appendChild anchor
          else
            # add the image (without link) to the fragment
            fragment.appendChild img

      # Add the fragment to the DOM
      document.getElementById(@options.target).appendChild fragment

      # remove the injected script tag
      header = document.getElementsByTagName('head')[0]
      header.removeChild document.getElementById 'instafeed-fetcher'

      # delete the cached instance of the class
      instanceName = "instafeedCache#{@unique}"
      window[instanceName] = undefined
      try
        delete window[instanceName]
      catch e
    # END if document?

    # run after callback function, if one is set
    if @options.after? and typeof @options.after is 'function'
      @options.after.call(this)

    # return true if everything ran
    true

  # helper function that structures a url for the run()
  # function to inject into the document hearder
  _buildUrl: ->
    # set the base API URL
    base = "https://api.instagram.com/v1"

    # get the endpoint based on @options.get
    switch @options.get
      when "popular" then endpoint = "media/popular"
      when "tagged"
        # make sure a tag is defined
        if typeof @options.tagName isnt 'string'
          throw new Error "No tag name specified. Use the 'tagName' option."

        # set the endpoint
        endpoint = "tags/#{@options.tagName}/media/recent"

      when "location"
        # make sure a location id is defined
        if typeof @options.locationId isnt 'number'
          throw new Error "No location specified. Use the 'locationId' option."

        # set the endpoint
        endpoint = "locations/#{@options.locationId}/media/recent"

      when "user"
        # make sure there is a user id set
        if typeof @options.userId isnt 'number'
          throw new Error "No user specified. Use the 'userId' option."

        # make sure there is an access token
        if typeof @options.accessToken isnt 'string'
          throw new Error "No access token. Use the 'accessToken' option."

        endpoint = "users/#{@options.userId}/media/recent"
      # throw an error if any other option is given
      else throw new Error "Invalid option for get: '#{@options.get}'."

    # build the final url (uses the instance name)
    final = "#{base}/#{endpoint}"

    # use the access token for auth when it's available
    # otherwise fall back to the client id
    if @options.accessToken?
      final += "?access_token=#{@options.accessToken}"
    else
      final += "?client_id=#{@options.clientId}"

    # add the count limit
    if @options.limit?
      final += "&count=#{@options.limit}"

    # add the jsonp callback
    final += "&callback=instafeedCache#{@unique}.parse"

    # return the final url
    final

  # helper function to generate a unique key
  _genKey: ->
    S4 = ->
      (((1+Math.random())*0x10000)|0).toString(16).substring(1)
    "#{S4()}#{S4()}#{S4()}#{S4()}"

  # helper function to parse a template
  _makeTemplate: (template, data) ->
    # regex pattern
    pattern = ///
      (?:\{{2})       # opening braces
      ([\w\[\]\.]+)   # variable name
      (?:\}{2})       # closing braces
    ///

    # copy the template
    output = template

    # process the template (null defaults to empty strings)
    while (pattern.test(output))
      varName = output.match(pattern)[1]
      varValue = @_getObjectProperty(data, varName) ? ''
      output = output.replace(pattern, "#{varValue}")

    # send back the new string
    return output

  # helper function to access an object property by string
  _getObjectProperty: (object, property) ->
    # convert [] to dot-syntax
    property = property.replace /\[(\w+)\]/g, '.$1'

    # split the object into arrays
    pieces = property.split '.'

    # run through the array to find the
    # nested property
    while pieces.length
      # move down the property chain
      piece = pieces.shift()

      # if they key exists, copy the value
      # into 'object', otherwise return null
      if object? and piece of object
        object = object[piece]
      else
        return null

    # send back the final object
    return object

  # helper function to sort an array objects by an
  # object property (sorts highest to lowest)
  _sortBy: (data, property, reverse) ->
    # comparator function
    sorter = (a, b) ->
      valueA = @_getObjectProperty a, property
      valueB = @_getObjectProperty b, property
      # sort lowest-to-highest if reverse is true
      if reverse
        if valueA > valueB then return 1 else return -1

      # otherwise sort highest to lowest
      if valueA < valueB then return 1 else return -1

    # sort the data
    data.sort(sorter.bind(this))

    return data

  # helper method to filter out images
  _filter: (images, filter) ->
    filteredImages = []
    for image in images
      do (image) ->
        filteredImages.push(image) if filter(image)
    return filteredImages


# set up exports
root = exports ? window
root.Instafeed = Instafeed
