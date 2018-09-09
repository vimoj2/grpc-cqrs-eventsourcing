const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const grpcLibrary = require('@grpc/grpc-js');

const PROTO_PATH = './proto/eventstore.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const zoover = grpcLibrary.loadPackageDefinition(packageDefinition).zoover;

const db = {
  ['user-1']: [
    {
      eventId: 'c6860d67-f3b7-4375-8d3c-001e571d8b85',
      eventType: 'entity_event_created',
      eventBody: { 'entity': {} },
      eventTimestamp: new Date().getTime()
  }]
};

const getEvents = (call, callback) => {
  callback(null, { events: db[call.request.streamId] || [] });
};

const setEvent = (call, callback) => {
  db.push(call.request.event);
  callback(null);
};

const getStreamEvents = (call, callback) => {
  const stream = new Stream();
  stream.onValue(call.write);
};

function main() {
  const server = new grpc.Server();
  server.addService(zoover.Eventstore.service, {
    getEvents,
    setEvent,
    getStreamEvents,
  });
  server.bind('localhost:28888', grpc.ServerCredentials.createInsecure());
  server.start();
}

main();