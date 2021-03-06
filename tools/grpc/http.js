const express = require('express');
const bodyParser = require("body-parser");
const utils = require('serializer');

const HTTP_PORT = 8888;

module.exports = class HttpClient {
  constructor(options) {
    this.client = options.client;
    this.app = express();
    this.app.use(express.static('./assets'));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: true}));
  }
  init() {
    this.app.get('/stream/info', (req, res) => {
      this.client.getInfo({}, (error, result) => {
        if (error)
          res.status(500).end();
        else
          res.json(result);
      })
    });
    this.app.get('/stream/:streamId', (req, res) => {
      const { streamId } = req.params;
      this.client.getEvents({ streamId }, (error, result) => {
        if (!result.events) {
          res.status(404).end();
          return;
        }
        result.events.forEach(event => {
          event.eventBody = utils.deserialize(event.eventBody);
        });
        res.json(result);
      })
    });
    this.app.post('/stream', (req, res) => {
      const { streamId, eventType, eventBody } = req.body;
      const body = {
        streamId,
        events: [
          {
            eventType,
            eventBody: utils.serialize(JSON.parse(eventBody)),
            eventTimestamp: new Date().getTime().toString()
          }
        ]
      };
      console.log('Sending...', JSON.stringify(body, null, 2));
      this.client.setEvents(body, (error, response) => {
        res.end();
      });
    });
  }
  start() {
    this.app.listen(HTTP_PORT)
    console.log(`Server Started and Running [http://localhost:${HTTP_PORT}]`);
  }
};

