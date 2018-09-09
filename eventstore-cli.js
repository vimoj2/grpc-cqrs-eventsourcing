const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const protoOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};

const PROTO_PATH = './proto/eventstore.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, protoOptions);
const zoover = grpc.loadPackageDefinition(packageDefinition).zoover;


function main() {
  const client = new zoover.Eventstore('localhost:28888', grpc.credentials.createInsecure());

  const event = {
    eventId: 'c6860d67-f3b7-4375-8d3c-001e571d8b85',
    eventType: 'entity_event_created',
    eventTimestamp: new Date().getTime()
  };

  // client.setEvent({ event }, (err, response) => {
  //   if (err) {
  //     console.error('[setEvent]', err);
  //   }
  // });

  client.getEvents({ streamId: 'user-1' }, (err, response) => {
    console.log('[Events]', JSON.stringify(response, null, 2));
  });
}

main();
