const _ = require('lodash');
const async = require('async');
const Promise = require('bluebird');
const { deserialize } = require('serializer');

const formatEvents = (data, formatter) => data.events.map(event => {
  return {
    eventType: event.eventType,
    eventBody: formatter.call(null, event.eventBody),
    eventTimestamp: event.eventTimestamp
  }
});

class EventHandler {
  constructor(options, projections, eventstoreClient) {
    options = options || {};

    const defaultOptions = {
      restore: false,
      stateful: false,
      pipeStart: () => Promise.resolve(),
      pipeEnd: () => Promise.resolve(),
      catcher: (error) => {
        console.log('Promise chain rejection. %s', error.message, { error });
        if (error instanceof Error)
          console.log(error.stack);
        process.exit(-1);
      }
    };
    projections = Array.isArray(projections) ? projections : [projections];
    this.events = _.assign.apply(_, [{}].concat(_.map(projections, 'events'))) || {};
    this.views = _.assign.apply(_, [{}].concat(_.map(projections, 'views'))) || {};

    this.options = _.defaults(options, defaultOptions);

    this.initState();

    const setupSubscriber = () => {
      if (
        !options.projection &&
        typeof options.projection !== 'string'
      ) {
        return Promise.reject(new Error('Projection configuration is incorrect'));
      }
      const subscription = eventstoreClient.subscribe(options.projection);
      subscription.on('data', (data) => {
        formatEvents(data, deserialize).forEach(event => this.queue.push(event));
      });
      subscription.on('error', (error) => {
        console.log(error.stack);
        process.exit(-1);
      });
      subscription.on('end', (error) => {
        console.log('Subscription was canceled');
        process.exit(0);
      });
    };

    const initialize = options.init || Promise.resolve;
    initialize()
      .then(() => console.log('Projection initialization finished'))
      .then(setupSubscriber)
      .catch((err) => {
        console.log(err);
        process.exit(-1);
      });

    this.queue = async.queue((event, done) => {
      if (!(event.eventType in this.events))
        throw new Error(`Projection does not have handler to apply event "${event.eventType}"`);

      console.log('Applying event "%s":', event.eventType, event);

      let handler = this.events[event.eventType].bind(this.execState);
      return Promise.resolve(event)
        .then(this.options.pipeStart.bind(this))
        .then(pack => handler.apply(this, [event.eventBody].concat(Array.isArray(pack) ? pack : [pack])))
        .then(this.options.pipeEnd.bind(this))
        .nodeify(done)
        .catch(this.options.catcher);

    }, options.concurrency);
  }
  initState() {
    console.log('Initializing base state.');
    if (this.options.stateful) {
      let state = this.state = {};
      this.execState = {
        get(property, defaults) {
          let result = _.propertyOf(state)(property);
          return typeof result === 'undefined' ? defaults : result;
        }
      };
      Object.defineProperty(this.execState, 'state', {value: this.state});
    } else {
      this.execState = {
        get(property, defaults) {
          return defaults;
        }
      };
      Object.defineProperty(this.execState, 'state', {value: undefined});
    }
  }
}

module.exports = EventHandler;