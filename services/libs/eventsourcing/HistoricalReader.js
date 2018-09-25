const { EventEmitter } = require('events');


class HistoricalReader extends EventEmitter {
  constructor(streams, projection) {
    super();
    this.streams = streams;
    this.projection = projection;
    this.position = 0;
    this.offset = 10;
  }
  reversSearch(event = {}, events = []) {
    let position = 0;
    if (events.length === 0) {
      return position;
    }
    for(let i = events.length; i > 0; i--) {
      if (events[i - 1].eventTimestamp < event.eventTimestamp) {
        position = i;
        break;
      }
    }
    return position;
  }
  read() {
    let streamPosition = 0;
    this.events = [];
    const run = (streamPosition) => {
      let needToCheckNextPosition = false;
      for (let stream of Object.keys(this.streams)) {
        const event = this.streams[stream].events[streamPosition];
        if (event) {
          needToCheckNextPosition = true;
          const position = this.reversSearch(event, this.events);
          this.events.splice(position, 0, event);
          if (this.events.length === this.offset) {
            this.send();
          }
        }
      }

      if (needToCheckNextPosition) {
        run(++streamPosition);
      } else {
        if (this.events.length > this.position) {
          this.send(this.events.length - this.position);
        }
        this.emit('done');
      }
    };
    run(streamPosition);
  }
  send(lastPosition) {
    let offset, delta = 0;
    let first = true;
    const PACKAGE_SIZE = lastPosition || 10;

    for (let i = this.events.length - PACKAGE_SIZE; i < this.events.length; i++) {
      const event = this.events[i];
      if (first) {
        delta = 1;
        first = false;
        offset = event._metadata.offset;
        continue;
      }
      if ((event._metadata.offset - offset) !== 1) {
        break;
      } else {
        delta = 1;
      }
      offset = event._metadata.offset;
    }

    if (delta === 1) {
      this.emit('data', this.events.slice(this.position, this.position + PACKAGE_SIZE));
      if (!lastPosition) {
        this.offset += PACKAGE_SIZE;
        this.position += PACKAGE_SIZE;
      }
    }
  }
}

module.exports.HistoricalReader = HistoricalReader;