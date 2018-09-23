const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const StreamStore = require('./StreamStore').StreamStore;
const config = require('./config');

const RPC_HOST = `${config.host}:${config.port}`;
const PROTO_PATH = './proto/eventstore.proto';

console.log(__dirname)

const log = console.log;

function main(root) {

  const getEvents = (call, callback) => {
    callback(null, streamStore.getStreamEvents(call.request.streamId))
  };

  const setEvents = (call, callback) => {
    const { streamId, events } = call.request;
    callback(null, streamStore.write(streamId, events));
  };

  const subscribe = (call, callback) => {
    const { projection } = call.request;
    log('[Subscriber]', projection);

    const subscriberId = call.metadata.getMap()['client'];
    call.on('cancelled', () => {
      streamStore.unsubscribe(subscriberId);
    });
    
    if (projection.fromBegging) {      
      const loadHistoricalEvents = () => {
        
      }
    }
    
    streamStore
      .createProjection(projection, subscriberId)
      .onValue((events) => {
        call.write({ events });
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
