const http = require('http');
const uuid = require('uuid');

const Aggregate = require('../../cqrs/Aggregate');
const Command = require('../../cqrs/Command');
const EventstoreClient = require('../../eventsourcing/EventstoreClient');

const eventstore = new EventstoreClient();
const aggregate = new Aggregate(eventstore);

const createHandler = (params) => {
  params.uuid = uuid();
  const commandParams = {
    name: 'CREATE_USER',
    params
  };
  const createCommand = new Command(commandParams);
  // We need response!!!
  aggregate.execute(createCommand);
};

http.createServer((req, res) => {
  if (req.url === '/favicon.ico') res.end();
  else {
    createHandler({
      username: 'iamser'
    });
    res.end();
  }
}).listen(28888);




