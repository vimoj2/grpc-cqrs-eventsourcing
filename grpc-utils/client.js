const uuid = require('uuid');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const {serialize} = require('./utils');

const D_TIMEOUT = 1000;
const RPC_SERVER = 'localhost:28888';
const PROTO_PATH = '../proto/eventstore.subscription.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const zoover = grpc.loadPackageDefinition(packageDefinition).zoover;

// const streamId = process.argv[2] || die(new Error('Pass streamId'));
const eventType = process.argv[2] || die(new Error('Pass event type'));
const timeout = process.argv[3] || D_TIMEOUT;

const getEvents = () => [{
  eventType,
  eventBody: serialize({ id: uuid(), name: uuid() }),
  eventTimestamp: new Date().getTime().toString()
}];

function main() {
  const client = new zoover.Eventstore(RPC_SERVER, grpc.credentials.createInsecure());
  const send = () =>
    client.setEvents({ streamId: `stream-${new Date().getTime()}`, events: getEvents()}, (err) => {
      if (err) {
        console.error('[setEvent]', err);
      }
      setTimeout(() => {
        send();
      }, timeout)
    });
  send();
}

function die(error) {
  console.error(error.stack);
  process.exit(-1);
}

main();
