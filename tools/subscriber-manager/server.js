const uuid = require('uuid');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const { StreamStore } = require('./StreamStore');
const Promise = require('bluebird');
const { EventEmitter } = require('events');
const PROTO_PATH = './proto/eventstore.proto';
const log = console.log;


class HistoricalReader extends EventEmitter {
  constructor(streams, projection) {
    super();
    this.streams = streams;
    this.projection = projection;
    this.position = 0;
    this.offset = 10;
  }
  reversSearch(event = {}, events = []) {
    let position = 0;
    if (events.length === 0) {
      return position;
    }
    for(let i = events.length; i > 0; i--) {
      if (events[i - 1].eventTimestamp < event.eventTimestamp) {
        position = i;
        break;
      }
    }
    return position;
  }
  read() {
    let streamPosition = 0;
    this.events = [];
    const run = (streamPosition) => {
      let needToCheckNextPosition = false;
      for (let stream of Object.keys(this.streams)) {
        const event = this.streams[stream].events[streamPosition];
        if (event) {
          needToCheckNextPosition = true;
          const position = this.reversSearch(event, this.events);
          this.events.splice(position, 0, event);
          if (this.events.length === this.offset) {
            this.send();
          }
        }
      }

      if (needToCheckNextPosition) {
        run(++streamPosition);
      } else {
        if (this.events.length > this.position) {
          this.send(this.events.length - this.position);
        }
        this.emit('done');
      }
    };
    run(streamPosition);
  }
  send(lastPosition) {
    let offset, delta = 0;
    let first = true;
    const PACKAGE_SIZE = lastPosition || 10;

    for (let i = this.events.length - PACKAGE_SIZE; i < this.events.length; i++) {
      const event = this.events[i];
      if (first) {
        delta = 1;
        first = false;
        offset = event._metadata.offset;
        continue;
      }
      if ((event._metadata.offset - offset) !== 1) {
        break;
      } else {
        delta = 1;
      }
      offset = event._metadata.offset;
    }

    if (delta === 1) {
      this.emit('data', this.events.slice(this.position, this.position + PACKAGE_SIZE));
      if (!lastPosition) {
        this.offset += PACKAGE_SIZE;
        this.position += PACKAGE_SIZE;
      }
    }
  }
}

function * main(root) {
  const subscribe = (call, callback) => {
    const { projection } = call.request;
    const subscriberId = call.metadata.getMap()['client'];
    log('[Subscribing]', subscriberId);
    call.on('cancelled', () => {
      streamStore.unsubscribe(subscriberId);
    });

    const historicalReader = new HistoricalReader(streamStore.streams);
    historicalReader.on('data', events => {
      call.write({ events })
    });
    historicalReader.on('done', () => {
      collecting = false;
    });

    let collecting = true;
    let collection = [];
    streamStore
      .createProjection(projection, subscriberId)
      .onValue((events) => {
        if (collecting) {
          collection.push(events);
        } else {
          if (collection.length !== 0) {
            call.write({ events: collection });
            collection = [];
          } else {
            call.write({ events });
          }
        }
      });

    historicalReader.read();
  };

  const setEvents = (call, callback) => {
    const { streamId, events } = call.request;
    callback(null, streamStore.write(streamId, events));
  };

  const handlers = {
    subscribe,
    setEvents
  };

  const streamStore = new StreamStore();
  const server = new grpc.Server();

  //init with mock data
  yield Promise.mapSeries(new Array(1).fill(0), () => {
    const streamId = `stream-${uuid()}`;
    streamStore.write(streamId, [{
      eventType: 'entityEventType',
      eventBody: Buffer.from(JSON.stringify({uuid: uuid()})),
      eventTimestamp: new Date().getTime()
    }]);
    return Promise.resolve();
  }).then(() => log(`[Streams initialization is done]`));

  server.addService(root.Eventstore.service, handlers);
  const credentials = grpc.ServerCredentials.createInsecure();
  server.bind('localhost:29999', credentials);
  server.start();
  log('[RPC server initialised]');
}

module.exports = () => {
  //preparing network i/o
  protoLoader
    .load(PROTO_PATH)
    .then(packageDefinition => (
      grpc.loadPackageDefinition(packageDefinition).zoover
    ))
    .then(root => Promise.coroutine(main)(root));
};

if (module === require.main) {
  module.exports();
}
