const uuid = require('uuid');
const AggregateRoot = require('./AggregateRepository');
const EventStoreClint = require('./EventStoreClient');
const UserModel = require('./aggregates/User');
const helper = require('./test/helper');


const eventstoreClient = new EventStoreClint(helper.client);
const aggregateRoot = new AggregateRoot({ eventstoreClient, EntityClass: UserModel });

const triggerCreateBusinessLogic = (data) => {
  data.uid = uuid();
  const command = {
    commandType: 'CreateUser',
    commandData: data,
    commandTimestamp: new Date().getTime()
  };
  return aggregateRoot.createEntity({ EntityClass: UserModel, command });
};

const triggerUpdateBusinessLogic = (uid, data) => {
  const command = {
    commandType: 'UpdateUser',
    commandData: data,
    commandTimestamp: new Date().getTime()
  };
  return aggregateRoot.updateEntity({ EntityClass: UserModel, uid, command });
};

// Trigger business logic
triggerCreateBusinessLogic({ username: 'vimoj2' });
triggerUpdateBusinessLogic('1f94aca3-fa87-48d5-beb2-dd1234c34563', { email: 'eugene@mail.com' });