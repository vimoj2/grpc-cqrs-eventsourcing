const path = require('path');
module.exports = protoFile => path.resolve(__dirname, `proto/${protoFile}`);