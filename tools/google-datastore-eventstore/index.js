const uuid = require('uuid');
// Imports the Google Cloud client library
const Datastore = require('@google-cloud/datastore');

// Your Google Cloud Platform project ID
const projectId = 'zoover-apps';

// Creates a client
const datastore = new Datastore({
  projectId: projectId,
  keyFilename: './Zoover-d18e00f7aa43.json'
});

// The kind for the new entity
const kind = 'eventstore';
// The name/ID for the new entity
const name = `stream-${uuid()}`;
// The Cloud Datastore key for the new entity
const taskKey = datastore.key([kind, name]);

// Prepares the new entity
const stream = {
  key: taskKey,
  data: {
    eventType: 'EntityEventType',
    eventBody: {
      uuid: uuid()
    },
    eventTimestamp: new Date().getTime()
  },
};

// Saves the entity
datastore
  .save(stream)
  .then(() => {
    console.log(`Saved ${stream.key.name}: ${stream.data.eventBody}`);
  })
  .catch(err => {
    console.error('ERROR:', err);
  });