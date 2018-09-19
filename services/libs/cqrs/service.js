const uuid = require('uuid');
const AggregateRoot = require('./AggregateRepository');
const UserAggregate = require('./aggregates/User');
const EventStoreClint = require('./EventStoreClient');
const helper = require('./test/helper');

const eventstoreClient = new EventStoreClint(helper.client);
const aggregateRoot = new AggregateRoot({ eventstoreClient, EntityClass: UserAggregate });


const triggerCreateBusinessLogic = (data) => {
  data.uid = uuid();

  const command = {
    commandType: 'CreateUser',
    commandData: data,
    commandTimestamp: new Date().getTime()
  };
  aggregateRoot.createEntity({ EntityClass: UserAggregate, command })
};

// Trigger business logic
triggerCreateBusinessLogic({ username: 'vimoj2' });