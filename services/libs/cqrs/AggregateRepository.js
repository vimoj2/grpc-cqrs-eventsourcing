const uuid = require('uuid');


const log = console.log;

class AggregateRepository {
  constructor({ eventstoreClient, EntityClass }) {
    this.eventstoreClient = eventstoreClient;
    this.EntityClass = EntityClass;
  }
  createEntity({ EntityClass, command }) {
    try {
      const entity = new this.EntityClass();
      const processCommandMethod = this.getProcessCommandMethod(entity, command.commandType);
      const events = processCommandMethod.call(entity, command);

      this.eventstoreClient.create(entity.entityName, events);

    } catch (e) {
      log('[AggregateRepository#createEntity error]', e.stack);
    }
  }
  getProcessCommandMethod(entity, commandType) {
    const defaultMethod = 'processCommand';
    let methodName = `process${commandType}`;

    if (typeof entity[methodName] === 'function') {
      return entity[methodName];
    } else if (typeof entity[defaultMethod] === 'function') {
      return entity[defaultMethod];
    } else {
      throw new Error(`Entity does not have method to ${methodName} for ${commandType}.`);
    }
  }
}

module.exports = AggregateRepository;

if (require.main === module) {
  class User {
    constructor() {
      this.entityName = `user-${uuid()}`;
    }
    processCreateUser(command) {
      //Business logic
      //Validation
      const events = [
        {
          eventType: 'UserCreated',
          eventBody: {
            ...command.commandData,
            timestamp: command.commandTimestamp
          }
        }
      ];
      return events;
    }
  }

  const eventstoreClient = {
    create(streamId, events) {
      console.log(streamId, JSON.stringify(events, null, 2))
    },
    update() {},
    load() {},
    subscribe() {}
  };

  const businessLogicTrigger = (data) => {
    data.uid = uuid();

    const command = {
      commandType: 'CreateUser',
      commandData: data,
      commandTimestamp: new Date().getTime()
    };

    const aggregateRoot = new module.exports({ eventstoreClient, EntityClass: User });
    aggregateRoot.createEntity({ EntityClass: User, command })
  };

  // Trigger business logic
  businessLogicTrigger({ username: 'vimoj2' })
}