const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const RPC_HOST = 'localhost:28888';
const PROTO_PATH = '../proto/eventstore.subscription.proto';
const StreamStore = require('./classes').StreamStore;
const streamStore = new StreamStore();

const getEvents = (call, callback) => {
  callback(null, streamStore.getStream(call.request.streamId))
};

const setEvents = (call, callback) => {
  // console.log(JSON.stringify(call.request, null, 2));
  const { streamId, events } = call.request;
  callback(null, streamStore.write(streamId, events));
};

const handlers = {
  getEvents,
  setEvents,
};

function main(root) {
  const server = new grpc.Server();
  server.addService(root.Eventstore.service, handlers);
  const credentials = grpc.ServerCredentials.createInsecure();
  server.bind(RPC_HOST, credentials);
  server.start();
}

//preparing network i/o
protoLoader
  .load(PROTO_PATH)
  .then(packageDefinition => {
    return grpc.loadPackageDefinition(packageDefinition).zoover;
  })
  .then(main);
