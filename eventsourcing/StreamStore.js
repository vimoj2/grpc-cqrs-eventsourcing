const Kefir = require('kefir');
const EventEmitter = require('events').EventEmitter;
const Stream = require('./Stream').Stream;

const log = console.log;

class StreamStore {
  constructor() {
    this.streams = {};
    this.subscribers = {};
    this.rootStream = null;
    log('[Stream store initialized]')
  }
  getInfo() {
    return {
      streams: Object.keys(this.streams).length,
      subscribers: Object.keys(this.subscribers)
    }
  }
  intRootStream() {
    if (!this.emitter) {
      this.rootStream = Kefir.stream(emitter => {
        log('[Emitter initialization]');
        this.emitter = emitter
      });
    }
    return this.rootStream;
  }
  addHandler(events) {
    this.emitter.emit(events);
  }
  addConsumer(streamId, handler = () => {}) {
    this.streams[streamId].on('write', handler);
  }
  registerStream(streamId) {
    if (!this.streams[streamId]) {
      this.streams[streamId] = new Stream(streamId);
      if (Object.keys(this.subscribers).length) {
        this.addConsumer(streamId, this.addHandler.bind(this));
      }
      log(`[Stream store registered stream ${streamId}]`);
    }
    return this.streams[streamId];
  }
  getStreamEvents(streamId) {
    if (this.streams[streamId])
      return { events: this.streams[streamId].events };
    else
      return { events: [] };
  }
  getStream(streamId) {
    return this.streams[streamId];
  }
  write(streamId, events) {
    const stream = this.registerStream(streamId);
    // log('Write...', JSON.stringify(events, null, 2));
    stream.write(events);
  }
  checkSubscription(activeSubscriber, projection) {
    const eventArray = projection.split(',');
    const events = eventArray.reduce((a, v) => { a[v] = false; return a; }, {});

    for(let subscriber in this.subscribers) {
      if (subscriber === activeSubscriber) {
        continue;
      }
      if (Object.values(events).every(Boolean)) {
        break;
      }

      for (let type of projection.split(',')) {
        if (Object.keys(events).includes(type)) {
          events[type] = true;
        }
      }
    }

    const result = [];
    for (let event in events) {
      if (!events[event]) {
        result.push(event);
      }
    }
    return result;
  }
  unsubscribe(subscriber) {
    const projection = this.subscribers[subscriber];
    const events = this.checkSubscription(subscriber, projection, false);
    log(`[Suggested to remove ${events}]`);
    if (events.length) {
      for (let streamId in this.streams) {
        const stream = this.getStream(streamId);
        for (let type of stream.eventTypes) {
          if (events.includes(type)) {
            stream.setPublished(false);
            break;
          }
        }
      }
    }
    delete this.subscribers[subscriber];
    log(`[Subscriber ${subscriber} moved out]`);
  }
  subscribe(subscriber, projection) {
    const eventTypes = this.checkSubscription(subscriber, projection);
    Object.assign(this.subscribers, { [subscriber]: projection });

    log(`[Events have to be exposed ${eventTypes}]`);

    for(let streamId in this.streams) {
      const stream = this.getStream(streamId);
      for (let type of eventTypes) {
        if (!stream.isPublished && stream.eventTypes.includes(type)) {
          const stream = this.getStream(streamId);
          stream.setPublished(true);
          stream.addListener('write', this.addHandler.bind(this));
          break;
        }
      }
    }
    log(`[Subscriber ${subscriber} linked with projection ${projection}]`);
  }
  createProjection(projection, subscriber) {
    const rootStream = this.intRootStream();
    this.subscribe(subscriber, projection);

    return rootStream.filter(e => {
      return e.filter(e => projection.split(',').includes(e.eventType)).length
    });
  }
}

module.exports.StreamStore = StreamStore;