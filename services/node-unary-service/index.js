const uuid = require('uuid');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const { serialize } = require('serializer');

const log = console.log;
const RPC_SERVER = 'eventstore:28888';
const PROTO_PATH = './proto/eventstore.proto';
const D_TIMEOUT = 1000;

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const zoover = grpc.loadPackageDefinition(packageDefinition).zoover;

const eventType = process.argv[2] || 'user_created' ||  die(new Error('Pass projection! For now it is string divided by comma'));

const meta = new grpc.Metadata();
meta.add('client', `service-${new Date().getTime()}`);

const timeout = process.argv[3] || D_TIMEOUT;

const getEvents = () => [{
  eventType,
  eventBody: serialize({ id: uuid(), name: uuid() }),
  eventTimestamp: new Date().getTime().toString()
}];

function main() {
  const client = new zoover.Eventstore(RPC_SERVER, grpc.credentials.createInsecure());
  const send = () =>
    client.setEvents({
      streamId: `stream-${new Date().getTime()}`,
      events: getEvents()
    }, (err) => {
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
