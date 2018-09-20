const uuid = require('uuid');
const path = require('path');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const { serialize } = require('serializer');


const RPC_SERVER = 'eventstore:28888';
const PROTO_PATH = './proto/eventstore.proto';

const packageDefinition = protoLoader.loadSync(path.resolve(__dirname, PROTO_PATH));
const zoover = grpc.loadPackageDefinition(packageDefinition).zoover;

module.exports.client = new zoover.Eventstore(RPC_SERVER, grpc.credentials.createInsecure());

module.exports.makeEvents = (eventType) => [{
  eventType,
  eventBody: serialize({ id: uuid() }),
  eventTimestamp: new Date().getTime().toString()
}];

module.exports.generateStreamId = () =>
  `streamId-${uuid()}`;