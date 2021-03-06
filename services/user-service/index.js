const _ = require('lodash');
const api = require('route-builder');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const protoPathResolver = require('eventstore-proto');
const { AggregateRoot, EventStoreClient } = require('cqrs');


const RPC_SERVER = 'eventstore:28888';
const PROTO_PATH = protoPathResolver('eventstore.proto');

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

  //register domains
  registry.domain = require('./domain');

  //build routes
  api(registry, './api').then((routes) => {
    routes = _.uniq(routes, segment => segment.route);
    console.log('Bind %d api routes', routes.length, {
      routes: routes.map(segment => segment.route)
    });
    registry.http = registry.app.listen(8081, () => {
      console.log(
        'User service started at %s %d',
        registry.http.address().address,
        registry.http.address().port
      );
    });
  });
}

Promise.coroutine(main)();