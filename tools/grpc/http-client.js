const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const protoPathResolver = require('eventstore-proto');

const HttpServer = require('./http');
const PROTO_PATH = protoPathResolver('eventstore.proto');

function main(service) {
  const client = new service.Eventstore('eventstore:28888', grpc.credentials.createInsecure());
  const httpClient = new HttpServer({ client });
  httpClient.init();
  httpClient.start();
}

//preparing network i/o
protoLoader
  .load(PROTO_PATH)
  .then(packageDefinition =>
    grpc
      .loadPackageDefinition(packageDefinition)
      .zoover
  )
  .then(main);
