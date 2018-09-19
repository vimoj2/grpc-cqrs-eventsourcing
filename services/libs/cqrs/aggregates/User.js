const uuid = require('uuid');

class User {
  constructor(uid) {
    this.entityName = uid ? `user-${uid}`: `user-${uuid()}`;
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
        },
        eventTimestamp: command.commandTimestamp
      }
    ];
    return events;
  }
  processUpdateUser(command) {
    //Business logic
    //Validation
    const events = [
      {
        eventType: 'UserUpdated',
        eventBody: {
          ...command.commandData,
          timestamp: command.commandTimestamp
        },
        eventTimestamp: command.commandTimestamp
      }
    ];
    return events;
  }
  applyUserCreated(event) {
    console.log('applyCreateEvent()');
    const { eventBody: { timestamp } } = event;
    this.timestamp = timestamp;
    return this;
  }
  applyUserUpdated(event) {
    console.log('applyUserUpdated()');
    const { eventBody: { timestamp } } = event;
    this.timestamp = timestamp;
    return this;
  }
}

module.exports = User;