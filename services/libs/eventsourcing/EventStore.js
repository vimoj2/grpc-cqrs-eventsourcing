const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const StreamStore = require('./StreamStore').StreamStore;
const HistoricalReader = require('./HistoricalReader').HistoricalReader;
const config = require('./config');


const log = console.log;
const RPC_HOST = `${config.host}:${config.port}`;
const PROTO_PATH = './proto/eventstore.proto';

function main(root) {

  const getEvents = (call, callback) => {
    callback(null, streamStore.getStreamEvents(call.request.streamId))
  };

  const setEvents = (call, callback) => {
    const { streamId, events } = call.request;
    callback(null, streamStore.write(streamId, events));
  };

  const subscribe = (call) => {
    const { events, fromBegging } = call.request;
    let collecting = false;
    let collection = [];

    const projectionEvents = events;
    const subscriberId = call.metadata.getMap()['client'];
    log('[Subscribing]', subscriberId);
    call.on('cancelled', () => { streamStore.unsubscribe(subscriberId) });


    if (fromBegging) {
      collecting = true;
      const historicalReader = new HistoricalReader(streamStore.streams);
      historicalReader.on('data', events => {
        const filteredEvents = events.filter(event => projectionEvents.includes(event.eventType));
        call.write({ events: filteredEvents })
      });
      historicalReader.on('done', () => { collecting = false });
      historicalReader.read();
    }

    streamStore
      .createProjection(projectionEvents.join(','), subscriberId)
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
  };

  const getInfo = (call, callback) => {
    callback(null, streamStore.getInfo());
  };

  const handlers = {
    getEvents,
    setEvents,
    subscribe,
    getInfo
  };

  const streamStore = new StreamStore();
  const server = new grpc.Server();
  server.addService(root.Eventstore.service, handlers);
  const credentials = grpc.ServerCredentials.createInsecure();
  server.bind(RPC_HOST, credentials);
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
    .then(main);
};

if (module === require.main) {
  module.exports();
}
