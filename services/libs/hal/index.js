var path = require('path');
var fs = require('fs');
var _ = require('lodash');

module.exports.dir = dirResponder;
function dirResponder(basedir) {
    return function(req, res) {
        if (!res.hal)
            throw new Error('No hal resource in response object. Did you use middleware?');

        var resources = fs.readdirSync(path.join(basedir, req.path))
            .filter(function(dirname) {
                return fs.lstatSync(path.join(basedir, req.path, dirname)).isDirectory();
            })
            .map(function(dirname) {
                return path.join(req.path, dirname);
            });

        res.hal.link('resources', resources).send()
    };
}

module.exports.resource = createResource;
function createResource() {
    var source = {
        _links: {},
        _embedded: {}
    };

    var api = {
        _resource: source,
        json: function(object) {
            _.extend(source, object);
            return api;
        },
        embed: function(name, resource) {
            source._embedded[name] = normalize(resource);
            return api;
        },
        link: function(name, resource) {
            source._links[name] = normalize(resource);
            return api;
        },
        toJSON: function() {
            return api._resource;
        }
    };

    return api;

    function normalize(resource) {
        if (_.isArray(resource)) {
            return resource.map(normalize)
        } else if (_.isObject(resource)) {
            var interpolateRegex = /\{\{\s*(.+?)\s*}}/g;
            if ('href' in resource && interpolateRegex.test(resource.href)) {
                resource.href = resource.href.replace(interpolateRegex, function(raw, key) { if (key === 'href') return ''; return resource[key] || ''; })
            }
            return resource;
        } else if (_.isString(resource)) {
            return {href: resource};
        }
        return resource;
    }
}

module.exports.middleware = middlewareCreator;
function middlewareCreator() {
    return function(req, res, next) {
        var hal = req.hal = res.hal = createResource();
        hal.link('self', req.path);
        hal.send = function() {
            if (!res.get('Content-Type')) {
                res.set('Content-Type', 'application/hal+json');
            }
            res.json(hal.toJSON());
            return hal;
        };

        next();
    }
}