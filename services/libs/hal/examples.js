// examples for hal library

/*
assume that we have this directory listing:

/app_root/
|-- api
    |-- locations
        |-- index.js
        |-- get.js
    |-- users
        ...
    |-- devices
        ...

*/

// region EXAMPLE DIRECTORY

// for handling request to root of api (/) you should create dir responder with specific basedir
// example

var path = require('path');
var app = require('express')();
app.hal = require('hal');

// directory responder is depends on hal middleware
app.use(app.hal.middleware());

// create responder
var responder = app.hal.dir(path.join(__dirname, 'api'));

// define route
app.get('/', responder);

/*
Directory listing would be presented as a link with list of resources.
Result:

{
  "_links": {
    "self": {
      "href": "/"
    },
    "resources": [
      {
        "href": "/locations"
      },
      {
        "href": "/users"
      },
      {
        "href": "/devices"
      }
    ]
  },
  "_embedded": {}
}
*/

// endregion

// region EXAMPLE_SINGLE_OBJECT

// for handling request to model/object(/locations/:id) you should use hal resource for build correct response
// example

var path = require('path');
var app = require('express')();
app.hal = require('hal');

// hal resource have no dependencies, but it's easiest to call send fn from middleware and auto linking to self.
app.use(app.hal.middleware());

// listing for file /locations/get.js
app.get('/locations/:id', function(req, res) {
    app.models.findOneById(req.params.id)
        .populate('floor')
        .exec(function(err, model) {
            res.hal.json(model.toJSON()) // here we already have "self" link
                .link('floor', {href: '/floor/{{id}}', id: model.floor.id}) // string interpolation for field href with double curvy braces
                .link('venue', {href: '/venue/{{id}}', id: model.floor.venue})
                .send();
        });
});

/*
Result would be:
{
  "_links": {
    "self": {
      "href": "/locations/100"
    },
    "floor": {
      "href": "/floor/3",
      "id": 3
    }
    "venue": {
      "href": "/venue/1",
      "id": 1
    }
  },
  "_embedded": {},
  "id": 100,
  "name": "location-1",
  ... properties
}
*/

// endregion


// region EXAMPLE_COLLECTION

// for handling request to collection of object(/locations) you should embed hal formatted resource into collection resource
// example

var path = require('path');
var app = require('express')();
app.hal = require('hal');

// just use it everywhere
app.use(app.hal.middleware());

// listing for file /locations/index.js
app.get('/locations', function(req, res) {
    app.models.find({})
        .populate('floor')
        .exec(function(err, models) {
            var resources = models.map(function(model) {
                return app.hal.resource().json(model.toJSON())
                    .link('self', {href: '/locations/{{id}}', id: model.id})// we don't know which req.path we should link to self, so you link it manually
                    .link('floor', {href: '/floor/{{id}}', id: model.floor.id})
                    .link('venue', {href: '/venue/{{id}}', id: model.floor.venue})
                    .toJSON();
            });

            res.hal.embed('locations', resources).send()
        });
});

/*
Result would be:
{
  "_links": {
    "self": {
      "href": "/locations/"
    }
  },
  "_embedded": {
    "locations": [
        {
          "_links": {
            "self": {
              "href": "/locations/100"
            },
            "floor": {
              "href": "/floor/3",
              "id": 3
            }
            "venue": {
              "href": "/venue/1",
              "id": 1
            }
          },
          "_embedded": {},
          "id": 100,
          "name": "location-1",
          ... properties
        },
        {
          "_links": {
            "self": {
              "href": "/locations/101"
            },
            "floor": {
              "href": "/floor/4",
              "id": 4
            }
            "venue": {
              "href": "/venue/1",
              "id": 1
            }
          },
          "_embedded": {},
          "id": 101,
          "name": "location-2",
          ... properties
        }
    ]
  }
}
*/

// endregion