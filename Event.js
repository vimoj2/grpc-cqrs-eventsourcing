class Event {
    constructor({ id, version, type, data }) {
        this.id = id;
        this.version = version;
        this.type = type;
        this.data = data;
    }
}

module.exports = Event;