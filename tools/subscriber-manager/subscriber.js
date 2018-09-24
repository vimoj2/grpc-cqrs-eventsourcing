const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const { deserialize } = require('serializer');

const log = console.log;
const RPC_SERVER = 'localhost:29999';
const PROTO_PATH = './proto/eventstore.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const zoover = grpc.loadPackageDefinition(packageDefinition).zoover;

const eventTypes = process.argv[2] || 'entityEventType' ||  die(new Error('Pass projection! For now it is string divided by comma'));

const meta = new grpc.Metadata();
meta.add('client', `service-${new Date().getTime()}`);

function main() {
  const client = new zoover.Eventstore(RPC_SERVER, grpc.credentials.createInsecure());

  const subscriptionOptions = {
    events: eventTypes.split(','),
    fromBegging: true
  };

  const call = client.subscribe(subscriptionOptions, meta);
  call.on('error', function(e) {
    log(e);
    // An error has occurred and the stream has been closed.
  });
  call.on('data', (data) => {
    data.events.forEach((event) => {
      console.log('[Got]',
        event.eventType,
        JSON.stringify(deserialize(event.eventBody), null, 2),
        event.eventTimestamp
      )
    });
  });
  call.on('status', function(status) {
    log(status);
    // process status
  });
  call.on('end', function() {
    log('[CALL END]')
    // The server has finished sending
  });
}

function die(error) {
  console.error(error.stack);
  process.exit(-1);
}

main();
