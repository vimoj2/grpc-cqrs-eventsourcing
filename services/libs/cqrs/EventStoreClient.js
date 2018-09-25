const grpc = require('grpc');
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
  subscribe(projection) {
    const meta = new grpc.Metadata();
    meta.add('client', `service-${new Date().getTime()}`);
    return this.client.subscribe(projection, meta);
  }
}

module.exports = EventStoreClient;

if (module === require.main) {
  module.exports();
}