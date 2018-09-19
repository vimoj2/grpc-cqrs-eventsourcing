const EventStoreClient = require('../EventStoreClient');
const helper = require('./helper');

let eventstoreClient;

describe('EventStoreClient', () => {
  before(() => {
    eventstoreClient = new EventStoreClient(helper.client);
  });
  after(() => eventstoreClient.close());
  describe('#create', () => {
    it('should create stream', (done) => {
      const events = helper.makeEvents('entity_created');
      const streamId = helper.generateStreamId();
      eventstoreClient
        .create(streamId, events)
        .then(() => done(null))
        .catch(done);
    });
  });
  describe('#update', () => {
    it('should update stream', (done) => {
      const streamId = helper.generateStreamId();
      const createEventType = 'entity_created';
      const updateEventType = 'entity_updated';

      const createEvents = helper.makeEvents(createEventType);
      const updateEvents = helper.makeEvents(updateEventType);

      eventstoreClient
        .create(streamId, createEvents)
        .then(() => {
          return eventstoreClient
            .update(streamId, updateEvents)
            .then(() => done(null))
            .catch(done);
        }).catch(done);
    });
  });
  describe('#load', () => {
    it('should handle empty response', (done) => {
      const streamId = helper.generateStreamId();

      eventstoreClient
        .load(streamId)
        .then(() => done(null))
        .catch(done)
    });
    it('should load events', (done) => {
      const streamId = helper.generateStreamId();
      const createEventType = 'entity_created';
      const createEvents = helper.makeEvents(createEventType);

      eventstoreClient
        .create(streamId, createEvents)
        .then(() => {
          eventstoreClient
            .load(streamId)
            .then(() => done(null))
            .catch(done)
        });
    });
  })

});