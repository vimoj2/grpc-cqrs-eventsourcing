const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const utils = require('./utils');

const RPC_HOST = 'localhost:28888';
const PROTO_PATH = '../proto/eventstore.subscription.proto';
const StreamStore = require('./stream-store').StreamStore;
const streamStore = new StreamStore();

const log = console.log;

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

function main(root) {
  const server = new grpc.Server();
  server.addService(root.Eventstore.service, handlers);
  const credentials = grpc.ServerCredentials.createInsecure();
  server.bind(RPC_HOST, credentials);
  server.start();
  log('[RPC server initialised]');
}

//preparing network i/o
protoLoader
  .load(PROTO_PATH)
  .then(packageDefinition => (
    grpc.loadPackageDefinition(packageDefinition).zoover
  ))
  .then(main);
