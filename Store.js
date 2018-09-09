const uuid = require('uuid');

class Stream {
  constructor() {
    this.eventStream
  }
  onValue(handler) {
    this.emit('event', handler);
  }
}

class MemoryStore extends Map {
  constructor() {
    super();
  }
  add(streamId, events) {
    this
      .set(streamId,
        this.has(streamId) ?
          this.get(streamId).push(events) :
          this.set(streamId, events)
      );
  }
  find(streamId, findOptions) {
    if (this.has(streamId)) {
      return this.get(streamId)
    }
    return [];
  }
}

class Subscriptions {
  constructor() {
    this.store = new MemoryStore();
    this.callsMap = {};
  }
  register(call, callback) {
    this.callsMap.set(this._makeProjectionMapping(call), call);
    call.on('exit', this._cleanCallsMap);
  }
  //check call params with gRPC
  //events: [EVENT_NAME_1]
  _makeProjectionMapping(params, callId) {
    params.events.forEach(eventName => {
      if (this.callsMap[eventName]) {
        if (!this.callsMap[eventName].includes(callId)) {
        } else {
          //Could be an error. Stop subscription.
          throw new Error('Subscription already exists');
        }
      } else {
        this.callsMap[eventName] = []
      }
    });
  }
  _cleanCallsMap() {

  }
}

// runtime
const call = {};
const subscriptions = new Subscriptions();

function callHandler(call) {}
callHandler(call);