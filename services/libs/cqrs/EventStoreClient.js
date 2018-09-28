const { deserialize, serialize } = require('serializer');

const formatEvents = (data, formatter) => data.events.map(event => {
  return {
    eventType: event.eventType,
    eventBody: formatter.call(null, event.eventBody),
    eventTimestamp: event.eventTimestamp
  }
});

class EventStoreClient {
  constructor(client) {
    this.client = client;
  }
  create(streamId, events) {
    return new Promise((resolve, reject) => {
      this.client.setEvents({
        streamId,
        events: formatEvents({ events }, serialize)
      }, (err, result) => {
        if (err) {
          reject(err);
          return
        }
        resolve(result);
      })
    })
  }
  update(streamId, events) {
    return this.create(streamId, events);
  }
  load(streamId) {
    return new Promise((resolve, reject) => {
      this.client.getEvents({ streamId }, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        result.events = result.events || [];
        resolve(formatEvents(result, deserialize));
      })
    });
  }
  close() {
    this.client.close();
  }
  subscribe(projection, meta) {
    return this.client.subscribe(projection, meta);
  }
}

module.exports = EventStoreClient;

if (module === require.main) {
  const grpc = require('grpc');
  const protoPathResolver = require('eventstore-proto');
  const protoLoader = require('@grpc/proto-loader');
  const protoPath = protoPathResolver('eventstore.proto');
  const path = require('path');
  const packageDefinition = protoLoader.loadSync(path.resolve(__dirname, protoPath));
  const zoover = grpc.loadPackageDefinition(packageDefinition).zoover;
  const RPC_SERVER = 'eventstore:28888';
  const transportClient = new zoover.Eventstore(RPC_SERVER, grpc.credentials.createInsecure());


  const eventstoreClient = new module.exports(transportClient);
  const meta = new grpc.Metadata();

  meta.add('client', `service-${new Date().getTime()}`);
  eventstoreClient.subscribe({
    events: ['UserCreated'],
    fromBegging: false
  }, meta)
}