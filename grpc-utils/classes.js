const EventEmitter = require('events').EventEmitter;
const utils = require('./utils');

const log = console.log;

class Stream extends EventEmitter {
  constructor(streamId) {
    super();
    this.events = [];
    this.isLocked = false;
    this.streamId = streamId;
    log(`[Stream ${this.streamId} initialized]`);
  }
  lock() {
    if (this.isLocked) {
      const error = new Error(`Stream ${this.streamId} already locked`);
      // throw error;
      this.emit('error', error);
    } else {
      this.isLocked = true;
    }
  }
  unlock() {
    if (!this.isLocked) {
      const error = new Error(`Stream ${this.streamId} already unlocked`);
      // throw error;
      this.emit('error', error);
    } else {
      this.isLocked = false;
    }
  }
  write(events) {
    this.lock();
    this.events = [...this.events].concat(events);
    this.emit('write', events);
    this.unlock();
  }
  getEvents() {
    return this.events;
  }
}

class StreamStore {
  constructor() {
    this.streams = {};
    this.subscribers = {};
    log('[Stream store initialized]')
  }
  addConsumer(streamId, handler = () => {}) {
    this.streams[streamId].on('write', handler)
  }
  registerStream(streamId) {
    if (!this.streams[streamId]) {
      this.streams[streamId] = new Stream(streamId);
      this.addConsumer(streamId, events => {
        events.forEach(event => {
          const {id, name} = utils.deserialize(event.eventBody);
          console.log(id, name, event.eventType, event.eventTimestamp);
        })
      });
      log(`Stream store registered stream ${streamId}`);
    }
    return this.streams[streamId];
  }
  getStream(streamId) {
    return { events: this.streams[streamId].events };
  }
  write(streamId, events) {
    const stream = this.registerStream(streamId);
    // console.log('Write...', JSON.stringify(events, null, 2));
    stream.write(events);
  }
}

module.exports = {
  StreamStore
};
