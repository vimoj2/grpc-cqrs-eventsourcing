const uuid = require('uuid');
const sizeof = require('object-sizeof');
const EventEmitter = require('events').EventEmitter;


const streamNumber = parseInt(process.argv[2]);
const eventsSize = parseInt(process.argv[3]);

const eventTypes = [
	'EntityCreated',
	'EntityUpdated'
];

const bytesToSize = (bytes) => {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes === 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};
let offset = 0;
const getOffsetId = () => {
   return ++offset;
};
class Event extends EventEmitter {
	constructor(idx) {
		super();
		this.eventType = eventTypes[(idx === 0 ? idx : 1)];
		this.eventBody = {
			uid: uuid()
		};
		this.eventTimestamp = getNextTS();
		this._metadata = {
			offset: getOffsetId()
		}
	}
}
let j = 0;
const getNextTS = () => new Date().getTime() + (j++);

const makeEventsFn = (size) => {
	return new Array(size).fill(0).map((_, idx) => {
		return {
			eventType: eventTypes[(idx === 0 ? idx : 1)],
			eventBody: {
				uid: uuid()
			},
			eventTimestamp: getNextTS(),
			_metadata: {
				offset: getOffsetId()
			}
		}
	})
};

const makeEventsClass = (size) => {
	return new Array(size)
		.fill(0)
		.map((_, idx) => new Event(idx));
};


const makeClassStreams = (size) => {
	return new Array(size)
		.fill(0)
		.map(() => makeEventsClass(eventsSize))
};

const makeFnStreams = (size) => {
	return new Array(size)
		.fill(0)
		.map(_ => makeEventsFn(eventsSize))

};

const reversSearch = (event = {}, events = []) => {
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
};

const historicalRead = (streams) => {
	let streamPosition = 0;
	let events = [];
	const run = (streamPosition) => {
		let needToCheckNextPosition = false;
		for (let stream of streams) {
			const event = stream[streamPosition];
			if (event) {
				needToCheckNextPosition = true;
				const position = reversSearch(event, events);
				events.splice(position, 0, event);
			}
		}
		if (needToCheckNextPosition) {			
			run(++streamPosition);
		}
	};
	run(streamPosition);
	return events;
};

// 1
console.log('Fn', bytesToSize(sizeof(makeClassStreams(streamNumber, eventsSize))));
console.log('Class', bytesToSize(sizeof(makeFnStreams(streamNumber, eventsSize))));

console.time(`make fn ${streamNumber} streams with ${eventsSize} events`);
const fnstreams = makeFnStreams(streamNumber, eventsSize);
console.timeEnd(`make fn ${streamNumber} streams with ${eventsSize} events`);

console.time('ordering events by timestamp');
const fnts = historicalRead(fnstreams).map(i => i.eventTimestamp);
console.timeEnd('ordering events by timestamp');

console.time('check events order');
fnts.forEach((v, idx) => {
	if (fnts[idx +1 ])
		if (fnts[idx + 1] - v < 1) {
			console.log(fnts[idx]);
			console.log(fnts[idx + 1]);
		}
});
console.timeEnd('check events order');



// 2
console.time(`make class ${streamNumber} streams with ${eventsSize} events`);
const classstreams = makeClassStreams(streamNumber, eventsSize);
console.timeEnd(`make class ${streamNumber} streams with ${eventsSize} events`);

console.time('ordering events by timestamp');
const classts = historicalRead(classstreams).map(i => i.eventTimestamp);
console.timeEnd('ordering events by timestamp');

console.time('check stream class events order');
classts.forEach((v, idx) => {
	if (classts[idx +1])
		if (classts[idx + 1] - v < 1) {
			console.log(classts[idx]);
			console.log(classts[idx + 1]);
		}
});
console.timeEnd('check stream class events order');
