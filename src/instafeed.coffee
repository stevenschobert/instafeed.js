class Instafeed
	constructor: (params, context) ->
		# default options
		@options =
			target: 'instafeed'
			sortBy: 'none'
			userId: 'me'
			links: true
			mock: false

		# if an object is passed in, override the default options
		if typeof params is 'object'
			@options[option] = value for option, value of params

		# save a reference to context, which defaults to curr scope
		# this will be used to cache data from parsing to the real
		# instance the user interacts with (for pagination)
		@context = if context? then context else this

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
		# make sure either an access token is set
		if typeof @options.accessToken isnt 'string'
			throw new Error "Missing accessToken."

		# run the before() callback, if one is set
		if @options.before? and typeof @options.before is 'function'
			@options.before.call(this)
		
		if typeof url isnt 'string'
			# generate request URL (there are basically zero options for customizing this)
			url = "https://graph.instagram.com/#{@options.userId}/media?fields=caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=#{@options.accessToken}"
		
		self = this
		((fetch url, {
			mode: "cors",
			referrer: "no-referrer",
			referrerPolicy: "no-referrer"
		}).then (headers) ->
			headers.json()
		).then (response) ->
			self.parse response
			
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
		if response.next?
			@context.nextUrl = response.next

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
					response.data = @_sortBy(response.data, 'timestamp', reverse)
				
				else throw new Error "Invalid option for sortBy: '#{@options.sortBy}'."

		# to make it easier to test various parts of the class,
		# any DOM manipulation first checks for the DOM to exist
		if document? and @options.mock is false
			# limit the number of medias if needed
			medias = response.data
			parsedLimit = parseInt(@options.limit, 10)
			if @options.limit? and medias.length > parsedLimit
				medias = medias.slice(0, parsedLimit)
			
			# create the document fragment
			fragment = document.createDocumentFragment()
			
			# filter the results
			if @options.filter? and typeof @options.filter is 'function'
				medias = @_filter(medias, @options.filter)
			
			# determine whether to parse a template, or use html fragments
			if @options.template? and (typeof @options.template is 'string' or typeof @options.template is 'function')
				# create an html string
				imageString = ''
				imgUrl = ''
				
				# create a temp dom node that will hold the html
				tmpEl = document.createElement('div')
				
				# loop through the medias
				for media in medias
					# use thumbnail image as image for video
					if media.media_type == 'VIDEO'
						imageURL = media.thumbnail_url
					else
						imageURL = media.media_url
					
					options =
						model: media
						id: media.id
						link: media.permalink
						type: media.media_type
						image_url: imageURL
						media_url: media.media_url
						caption: media.caption
					
					# call/parse the template
					if typeof @options.template is 'function'
						mediaString = @options.template options
					else
						mediaString = @_makeTemplate @options.template, options
					
					# add the image partial to the html string
					if typeof mediaString is 'string'
						tmpEl.innerHTML += mediaString
					else if mediaString instanceof Array
						for node in mediaString
							tmpEl.appendChild node
					else
						tmpEl.appendChild mediaString

				# loop through the contents of the temp node
				# and append them to the fragment
				childNodesArr = []
				childNodeIndex = 0
				childNodeCount = tmpEl.childNodes.length
				while childNodeIndex < childNodeCount
					childNodesArr.push(tmpEl.childNodes[childNodeIndex])
					childNodeIndex += 1
				for node in childNodesArr
					fragment.appendChild(node)
			else
				# loop through the images
				for media in medias
					# use thumbnail image as image for video
					if media.media_type == 'VIDEO'
						node = document.createElement 'video'
						node.controls = true
						node.preload = "metadata"
						node.poster = media.thumbnail_url
						node.src = media.media_url
					else
						node = document.createElement 'img'
						node.src = media.media_url

					# wrap the image in an anchor tag, unless turned off
					if @options.links is true
						# create an anchor link
						anchor = document.createElement 'a'
						anchor.href = media.permalink

						# add the image to it
						anchor.appendChild node

						# add the anchor to the fragment
						fragment.appendChild anchor
					else
						# add the image (without link) to the fragment
						fragment.appendChild node

			# add the fragment to the dom:
			# - if target is string, consider it as element id
			# - otherwise consider it as element
			targetEl = @options.target
			if typeof targetEl == 'string'
				targetEl = document.getElementById(targetEl)

			unless targetEl?
				eMsg = "No element with id=\"#{@options.target}\" on page."
				throw new Error eMsg

			targetEl.appendChild fragment
		# END if document?

		# run after callback function, if one is set
		if @options.after? and typeof @options.after is 'function'
			@options.after.call(this)

		# return true if everything ran
		true

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
			output = output.replace(pattern, () -> return "#{varValue}")

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


((root, factory) ->
	# set up exports
	if typeof define == 'function' and define.amd
		define [], factory
	else if typeof module == 'object' and module.exports
		module.exports = factory()
	else
		root.Instafeed = factory()
)(this, () ->
	return Instafeed
)
