const Command = require('./Command');
const Event = require('./Event');

const log = console.log;

class CreateEvent extends Event {
  constructor(options) {
    super(options);
  }
}

class Aggregate {
  constructor(eventstore) {
    log('[AGGREGATE]', 'init');
    this.eventstore = eventstore;
    this.eventstore.subscribe(this.handler);
    this.handlers = [];
  }

  process(event) {
    if (event instanceof CreateEvent) {
      this.handler(event.type, event.data);
    }
  }

  apply(event) {
    this.eventstore.publish(event);
  }

  handler(event) {
    log('[AGGREGATE]', 'handle', JSON.stringify(event, null, 2));
  }

  execute(command) {
    switch (command.name) {
      case 'CREATE_USER':
        this.apply({
          name: 'USER_CREATED',
          params: command.params,
          timestamp: new Date().getTime()
        })
    }
  }
}

module.exports = Aggregate;
