const _ = require('lodash');
const fs = require('fs');
const api = require('route-builder');
const uuid = require('uuid');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const { AggregateRoot, EventStoreClient, EventHandler } = require('cqrs');
const protoPathResolver = require('eventstore-proto');
const config = require('./config');


const RPC_SERVER = 'eventstore:28888';
const PROTO_PATH = protoPathResolver('eventstore.proto');

{
  let readdirPromise = Promise.promisify(fs.readdir);
  let statPromise = Promise.promisify(fs.lstat);
  var filterByExt = extname => files => files.filter(fp => path.extname(fp) === extname);
  var readdir = function (dir) {
    return statPromise(dir)
      .then((stat) => {
        if (stat.isDirectory())
          return readdirPromise(dir).then(files => Promise.all(files.map(file => readdir(path.join(dir, file)))));
        return path.resolve(dir)
      })
      .then((raw) => Array.isArray(raw) ? _.flatten(raw) : [raw])
  }
}

function * main() {
  const registry = Object.create(null);

  registry.app = express();
  registry.app.use(bodyParser.urlencoded({extended: true}));
  registry.app.use(bodyParser.json());

  const packageDefinition = protoLoader.loadSync(path.resolve(__dirname, PROTO_PATH));
  const zoover = grpc.loadPackageDefinition(packageDefinition).zoover;
  const grpcClient = new zoover.Eventstore(RPC_SERVER, grpc.credentials.createInsecure());

  registry.eventstoreClient = new EventStoreClient(grpcClient);
  const metadata = new grpc.Metadata();
  metadata.add('client', `${config.service.name}-${uuid()}`);

  const projectionSettings = {
    projection: config.projection,
    stateful: true,
    metadata
  };

  const projections = yield readdir(path.resolve(__dirname, './components/projections')).then(filterByExt('.js'));
  registry.projection = new EventHandler(
    projectionSettings,
    projections.map(file => require(file)(registry)),
    registry.eventstoreClient
  );

  //build routes
  api(registry, './api').then((routes) => {
    routes = _.uniq(routes, segment => segment.route);
    console.log('Bind %d api routes', routes.length, {routes: routes.map(segment => segment.route)});
    registry.http = registry.app.listen(config.http.port, () => {
      console.log(
        'View service started at %s %d',
        registry.http.address().address,
        registry.http.address().port
      );
    });
  });
}

Promise.coroutine(main)();