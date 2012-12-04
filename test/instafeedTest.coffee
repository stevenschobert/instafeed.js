# Set up Chai (http://chaijs.com)
chai = require 'chai'
chai.should()

# Bring in our Instafeed class
{Instafeed} = require '../src/instafeed'

# Define our tests
describe 'Instafeed instace', ->
  feed = null
  document = 'test'

  it 'should inherit defaults if nothing is passed', ->
    feed = new Instafeed
    feed.options.target.should.equal 'instafeed'
    feed.options.resolution.should.equal 'thumbnail'

  it 'should accept multiple options as an object', ->
    feed = new Instafeed
      target: 'mydiv'
      clientId: 'mysecretid'
    feed.options.target.should.equal 'mydiv'
    feed.options.clientId.should.equal 'mysecretid'
    feed.options.resolution.should.equal 'thumbnail'

  it 'should have a unique timestamp when instantiated', ->
    feed = new Instafeed
    feed.unique.should.exist

  it 'should refuse to run without a client id or access token', ->
    feed = new Instafeed
    (-> feed.run()).should.throw "Missing clientId or accessToken."

  it 'should refuse to parse NON-JSON data', ->
    (-> feed.parse('non-object')).should.throw 'Invalid JSON response'

  it 'should detect an API error', ->
    (-> feed.parse(
      meta:
        code: 400
        error_message: 'badbad'
    )).should.throw 'Error from Instagram: badbad'

  it 'should detect when no images are returned from the API', ->
    (-> feed.parse(
      meta:
        code: 200
      data: []
    )).should.throw 'No images were returned from Instagram'

  it 'should assemble a url using the client id', ->
    feed = new Instafeed
      clientId: 'test'
    feed._buildUrl().should.equal "https://api.instagram.com/v1/media/popular?client_id=test&count=15&callback=instafeedCache#{feed.unique}.parse"

  it 'should use the access token for authentication, when available', ->
    feed = new Instafeed
      clientId: 'test'
      accessToken: 'mytoken'
    feed._buildUrl().should.equal "https://api.instagram.com/v1/media/popular?access_token=mytoken&count=15&callback=instafeedCache#{feed.unique}.parse"

  it 'should refuse to build a url with invalid "get" option', ->
    feed = new Instafeed
      clientId: 'test'
      get: 'casper'
    (-> feed._buildUrl()).should.throw "Invalid option for get: 'casper'."

  it 'should refuse to build a url if get=tag and there is no tag name', ->
    feed = new Instafeed
      clientId: 'test'
      get: 'tagged'
    (-> feed._buildUrl()).should.throw "No tag name specified. Use the 'tagName' option."

  it 'should refuse to build a url if get=location and there is no location id set', ->
    feed = new Instafeed
      clientId: 'test'
      get: 'location'
    (-> feed._buildUrl()).should.throw "No location specified. Use the 'locationId' option."

  it 'should refuse to build a url if get=user and there is no userId', ->
    feed = new Instafeed
      clientId: 'test'
      get: 'user'
      accessToken: 'mytoken'
    (-> feed._buildUrl()).should.throw "No user specified. Use the 'userId' option."

  it 'should refuse to build a url if get=user and there is no accessToken', ->
    feed = new Instafeed
      clientId: 'test'
      get: 'user'
      userId: 1
    (-> feed._buildUrl()).should.throw "No access token. Use the 'accessToken' option."

  it 'should run a before & after callback functions', ->
    timesRan = 0
    callback = ->
      timesRan++

    feed = new Instafeed
      clientId: 'test'
      before: callback
      after: callback
    feed.run()

    timesRan.should.equal 2

  it 'should run a success callback with json data', ->
    numImages = 0
    callback = (json) ->
      numImages = json.data.length

    feed = new Instafeed
      clientId: 'test'
      success: callback
    feed.parse
      meta:
        code: 200
      data: [1,2,3]

    numImages.should.equal 3

  it 'should run the error callback if problem with json data', ->
    message = ''
    callback = (problem) ->
      message = problem
    feed = new Instafeed
      clientId: 'test'
      error: callback

    feed.parse 3
    message.should.equal 'Invalid JSON data'

    feed.parse
      meta:
        code: 200
      data: []
    message.should.equal 'No images were returned from Instagram'

    feed.parse
      meta:
        code: 400
        error_message: 'bad data'
      data: [2]
    message.should.equal 'bad data'

  it 'should parse an html template', ->
    feed = new Instafeed
    template = '<div>{{custom}}</div>'
    data = {custom: 'test data'}

    feed._makeTemplate(template, data).should.equal '<div>test data</div>'
