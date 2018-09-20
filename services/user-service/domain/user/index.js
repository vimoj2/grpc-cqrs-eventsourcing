const uuid = require('uuid');

class User {
  constructor(uid) {
    this.uid = (uid || uuid());
    this.entityName = `user-${this.uid}`;
  }
  processCreateUser(command) {
    const events = [
      {
        eventType: 'UserCreated',
        eventBody: {
          ...command.commandData, ...{ uid: this.uid },
          timestamp: command.commandTimestamp
        },
        eventTimestamp: command.commandTimestamp
      }
    ];
    return events;
  }
  processUpdateUser(command) {
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
    const { eventBody: { timestamp } } = event;
    this.timestamp = timestamp;
    return this;
  }
  applyUserUpdated(event) {
    const { eventBody: { timestamp } } = event;
    this.timestamp = timestamp;
    return this;
  }
}

module.exports = User;