'use strict';
let path = require('path');
let fs = require('fs');
let bird = require('bluebird');
let hal = require('hal');
let assert = require('assert');

let coroutine = bird.coroutine;
let readdir = bird.promisify(fs.readdir);
let stat = bird.promisify(fs.lstat);

const paramsIdMiddleware = require('./middlewares/uuid-check')

module.exports = coroutine(function* (registry, root, relative) {
  if (typeof relative === 'undefined') relative = root;

  assert(registry.app, 'Registry should contains express application at key "app"');

  registry.hal = hal;
  registry.app.use(registry.hal.middleware());

  let segments = [];
  return coroutine(buildSegment)(root)
    .then(segments => segments.sort(sortBySegmentCount))
    .then(segments => segments.map(mapRoutesPaths))
    .then(bindRouting);

  /**
   * Recursive generator for collecting routes.
   * @param {String} segment
   * @param {Boolean} isResourceRelated
   * @return {Array}
   */
  function* buildSegment(segment, isResourceRelated) {
    let source = yield readdir(segment);
    let resourceFound = false;

    // handle resource.js file if exists
    if (source.indexOf('resource.js') !== -1) {
      if (isResourceRelated) throw new Error('Resource related resource.');
      resourceFound = true;
      segments.push({type: 'resource', segment, path: makePath(segment, 'resource.js')});
    }

    // collect stats for directory listing
    let stats = yield bird.all(source.map(file => stat(path.join(segment, file))));

    // handle if directory contains only directories
    if (0 !== source.length && source.filter((item, index) => stats[index].isDirectory()).length === source.length) {
      segments.push({
        type: 'directory',
        segment: isResourceRelated ? injectParamIntoSegment(segment) : segment,
        path: makePath(segment),
        listing: source
      });
    }

    // handle files and directories
    for (var i in source) {
      if (!source.hasOwnProperty(i)) continue;

      let name = source[i],
        stat = stats[i],
        method;

      // handle if filename is method type
      if (['get', 'post', 'put', 'patch', 'delete'].indexOf(method = path.basename(name, '.js')) !== -1)
        segments.push({
          type: 'method',
          segment: isResourceRelated ? injectParamIntoSegment(segment) : segment,
          path: makePath(segment, name),
          method,
          isResourceRelated
        });

      // if directory - dive in recursive
      if (stat.isDirectory())
        yield coroutine(buildSegment)(path.join(segment, name), resourceFound);
    }

    return segments;
  }

  /**
   * Bind route to every segment.
   * @param {Object[]} segments
   * @return {*}
   */
  function bindRouting(segments) {
    let app = registry.app;
    for (let segment of segments) {
      switch (segment.type) {
        case 'directory':
          // respond directory listing
          app.get(segment.route, directoryResponder(segment));
          break;
        case 'method':
          // bind a method named file exporting function to route
          let methodHandler = require(segment.path)(registry);
          app.use(segment.route, (req, res, next) => {
            if (req.method === segment.method.toUpperCase()) {
              if (segment.route !== req.path) {
                let param = req.path.split('/').slice(-1)[0];
                if (param !== '' && typeof param !== 'undefined' && param !== null)
                  req.params.method_param = param;
              }
              paramsIdMiddleware(req, null, () => methodHandler(req, res))

            } else
              next();
          });
          break;
        case 'resource':
          // bind resource exporting operations object to routes
          let operations = require(segment.path)(registry);
          let route = segment.route, routeWithId = path.join(route, ':id');

          // resource operations
          app.get(routeWithId, paramsIdMiddleware, operations.find || noopResponse);
          app.post(routeWithId, operations.update || noopResponse);
          app.put(routeWithId, paramsIdMiddleware, operations.update || noopResponse);
          app.patch(routeWithId, paramsIdMiddleware, operations.update || noopResponse);
          app.delete(routeWithId, paramsIdMiddleware, operations.delete || noopResponse);

          // collection operations
          app.get(route, paramsIdMiddleware, operations.findAll || noopResponse);
          app.post(route, paramsIdMiddleware, operations.create || noopResponse);
          app.put(route, paramsIdMiddleware, operations.create || noopResponse);

          break;
        default:
          throw new Error(`Not supported segment type {${segment.type}} for ${segment.segment}`);
      }
    }
    return segments;
  }

  /**
   * Sort array by splitting each segment for pieces and compare length.
   * @param {Object} left segment
   * @param {Object} right segment
   * @return {boolean}
   */
  function sortBySegmentCount(left, right) {
    right = right.segment.split('/').filter(filterEmpty).length;
    left = left.segment.split('/').filter(filterEmpty).length;

    return right - left;

    function filterEmpty(input) {
      return input !== '' && input !== '.'
    }
  }

  /**
   * Map segments applying route attribute.
   * @param {Object} segment
   * @return {*}
   */
  function mapRoutesPaths(segment) {
    segment.route = normalizeRoute(segment.segment);
    return segment;
  }

  /**
   * Add :id parameter to segment path
   * @param {String} segmentPath
   * @return {String}
   */
  function injectParamIntoSegment(segmentPath) {
    let pieces = segmentPath.split('/'),
      last = pieces.splice(-1);

    return pieces.concat(':id', last).join('/');
  }

  /**
   * Normalize segment route.
   * @param {String} segmentPath
   * @return {String}
   */
  function normalizeRoute(segmentPath) {
    return path.join('/', path.relative(relative, segmentPath));
  }

  /**
   * Make absolute path for passing to require function.
   * @param {String} segmentPath
   * @param {String} [name]
   */
  function makePath(segmentPath, name) {
    return path.resolve(typeof name === 'undefined' ? segmentPath : path.join(segmentPath, name));
  }

  /**
   * Noop response function. Simply send 404 status code.
   * @param req
   * @param res
   */
  function noopResponse(req, res) {
    res.status(404).send();
  }

  /**
   * Create directory response function based on directory segment listing.
   * @param {Object} segment
   * @return {Function}
   */
  function directoryResponder(segment) {
    return function (req, res) {
      let resources = segment.listing.map(dirname => path.join(req.path, dirname));
      res.hal.link('resources', resources).send();
    }
  }

});
