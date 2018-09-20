var crypto = require('crypto');

module.exports = function() {
    return function(req, res) {
        var salt = Math.random();
        var sha = crypto.createHash('sha256');

        sha.update(req.params.method_param);
        var hash = sha.digest().toString('utf8');

        res.hal.json({hash, salt}).send();
    }
};