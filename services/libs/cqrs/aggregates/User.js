const uuid = require('uuid');

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
        },
        eventTimestamp: command.commandTimestamp
      }
    ];
    return events;
  }
}

module.exports = User;