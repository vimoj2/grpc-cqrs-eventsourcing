const events = [
    {
        name: 'USER_CREATED',
        data: {
            id: 1,
            username: 'iamuser'
        },
        timestamp: new Date().getTime()
    }
];

const log = console.log;

class EventstoreClient {
    constructor() {
        log('[EventstoreClient] init');
    }
    subscribe(fn) {
        log('[EventstoreClient] subscribed');
        setTimeout(() => {
            log('[EventstoreClient] send event', events[0].name);
            fn(events[0])
        }, 1000);
    }
    publish(event) {
        log('[EventstoreClient] publish event', JSON.stringify(event, null, 2));
    }
}

module.exports = EventstoreClient;