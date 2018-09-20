
var express = require('express');
var api = require('../index');
var hal = require('hal');


var app = express();
app.hal = hal;
app.use(hal.middleware());

api({app}, './api').then(() => { app.listen(19091); });
