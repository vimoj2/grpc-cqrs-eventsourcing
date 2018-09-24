const Kefir = require('kefir');

const streams = [{
	streamId: 'f2ba6f3e-da7e-4083-b76a-764aeb091d3c',
	streamName: 'entity',
	events: [{
		eventId: '3bedbf35-304d-4327-99f6-8ac15f6318b4',
		eventType: 'EntityCreated',
		eventBody: {},
		eventTimestamp: 123456781234,
		eventVersion: 1,
		_metadata: {
			offset: 1
		}
	},{
		eventId: 'a0af662e-cd9c-4ed2-8075-c6ab85fe4135',
		eventType: 'EntityUpdated',
		eventBody: {},
		eventTimestamp: 123456781235,
		eventVersion: 2,
		_metadata: {
			offset: 2
		}
	}]
}];

const EventEmitter = require('events').EventEmitter;
class Stream extends EventEmitter {
	constructor(streamName, interval) {
		super();
		this.streamName = streamName;
		this.interval = interval;
		this.init();
	}
	init() {
		setTimeout(() => {
			const data = {
				streamName: this.streamName,
				data: [Math.random(), Math.random()]
			};
			// console.log(data)
			this.emit('data', data);
			this.emit('done')
		}, this.interval);
	}
}

const stream1 = new Stream('stream1', 2000);
const stream2 = new Stream('stream2', 3000);

// const kStream1 = Kefir.fromEvents(stream1, 'data');
// const kStream2 = Kefir.fromEvents(stream2, 'data');
const pool = Kefir.pool();

pool.plug(Kefir.fromEvents(stream2, 'data'));
stream1.on('done', () => {
	pool.plug(Kefir.fromEvents(stream1, 'data'));
});

pool.onValue(console.log);

// pool.log();
// const a = Kefir.sequentially(1000, [0, 1, 2]);
// const concatenatedStream = Kefir.concat([kStream2]);
// concatenatedStream.log();
// concatenatedStream.onValue(console.log)


// console.log(JSON.stringify(streams, null, 2));