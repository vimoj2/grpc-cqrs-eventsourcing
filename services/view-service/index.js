const _ = require('lodash');
const api = require('route-builder');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const {
  AggregateRoot,
  EventStoreClient
} = require('cqrs');


const RPC_SERVER = 'eventstore:28888';
const PROTO_PATH = './proto/eventstore.proto';

function * main() {
  const registry = Object.create(null);

  registry.app = express();
  registry.app.use(bodyParser.urlencoded({extended: true}));
  registry.app.use(bodyParser.json());

  const packageDefinition = protoLoader.loadSync(path.resolve(__dirname, PROTO_PATH));
  const zoover = grpc.loadPackageDefinition(packageDefinition).zoover;
  const grpcClient = new zoover.Eventstore(RPC_SERVER, grpc.credentials.createInsecure());

  registry.AggregateRoot = AggregateRoot;
  registry.eventstoreClient = new EventStoreClient(grpcClient);

  //build routes
  api(registry, './api').then((routes) => {
    routes = _.uniq(routes, segment => segment.route);
    console.log('Bind %d api routes', routes.length, {routes: routes.map(segment => segment.route)});
    registry.http = registry.app.listen(8082, () => {
      console.log(
        'View service started at %s %d',
        registry.http.address().address,
        registry.http.address().port
      );
    });
  });
}

Promise.coroutine(main)();