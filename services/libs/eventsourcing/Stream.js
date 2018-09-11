const Kefir = require('kefir');
const EventEmitter = require('events').EventEmitter;
const utils = require('serializer');


const log = console.log;

class Stream extends EventEmitter {
  constructor(streamId) {
    super();
    this.eventTypes = [];
    this.events = [];
    this.isLocked = false;
    this.streamId = streamId;
    this.on('removeListener', () => console.log(`[Listerer removed from ${this.streamId} stream]`));
    log(`[Stream ${this.streamId} initialized]`);
  }
  addType(type) {
    if (!this.eventTypes.includes(type))
      this.eventTypes.push(type);
  }
  setPublished(bool) {
  	log(`[Stream ${this.streamId} status changed to ${bool}]`);
    this.removeAllListeners('write');
    this.isPublished = bool;
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
    events.forEach(event => this.addType(event.eventType));
    log('[Write]', events);
    this.unlock();
  }
  getEvents() {
    return this.events;
  }
}

module.exports.Stream = Stream;