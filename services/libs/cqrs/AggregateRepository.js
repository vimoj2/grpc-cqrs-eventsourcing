const uuid = require('uuid');
const log = console.log;

class AggregateRepository {
  constructor({ eventstoreClient, EntityClass }) {
    this.eventstoreClient = eventstoreClient;
    this.EntityClass = EntityClass;
  }
  createEntity({ EntityClass, command }) {
    try {
      const uid = uuid();
      const entity = new this.EntityClass(uid);
      const processCommandMethod = this.getProcessCommandMethod(entity, command.commandType);
      const events = processCommandMethod.call(entity, command);
      return this.eventstoreClient.create(`${entity.entityName}-${uid}`, events);

    } catch (e) {
      log('[AggregateRepository#createEntity error]', e.stack);
    }
  }
  updateEntity({ EntityClass, uid, command}) {
    const entity = new this.EntityClass();
    const { entityName } = entity;

    return this.loadEvents(`${entityName}-${uid}`)
      .then(historicalEvents => {
        this.applyEntityEvents(historicalEvents, entity);
        const processCommandMethod = this.getProcessCommandMethod(entity, command.commandType);
        const events = processCommandMethod.call(entity, command);
        return this.eventstoreClient.update(`${entityName}-${uid}`, events);
      });
  }
  loadEvents(streamId) {
    return this.eventstoreClient.load(streamId);
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
  applyEntityEvents(loadedEvents, entity) {
    loadedEvents.forEach(event => {
      const type = event.eventType;
      const applyMethod = this.getApplyMethod(entity, type);

      applyMethod.call(entity, event);
    });
  }
  getApplyMethod(entity, eventType) {

    const defaultMethod = 'applyEvent';
    const methodName = `apply${eventType}`;

    if (typeof entity[methodName] === 'function') {
      return entity[methodName];
    } else if (typeof entity[defaultMethod] === 'function') {
      return entity[defaultMethod];
    } else {
      throw new Error(`Entity does not have method to ${methodName} for ${eventType}.`);
    }
  }
}

module.exports = AggregateRepository;