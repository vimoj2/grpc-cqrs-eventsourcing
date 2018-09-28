class User {
  constructor(uid) {
    if (uid) this.uid = uid;
    this.entityName = `user`;
  }
  processCreateUser(command) {
    return [
      {
        eventType: 'UserCreated',
        eventBody: {
          ...command.commandData, ...{ uid: this.uid },
          timestamp: command.commandTimestamp
        },
        eventTimestamp: command.commandTimestamp
      }
    ];
  }
  processUpdateUser(command) {
    return [
      {
        eventType: 'UserUpdated',
        eventBody: {
          ...command.commandData,
          timestamp: command.commandTimestamp
        },
        eventTimestamp: command.commandTimestamp
      }
    ];
  }
  applyUserCreated(event) {
    const { eventBody: { uid, timestamp } } = event;
    this.uid = uid;
    return this;
  }
  applyUserUpdated(event) {
    const { eventBody: { timestamp } } = event;
    this.timestamp = timestamp;
    return this;
  }
}

module.exports = User;