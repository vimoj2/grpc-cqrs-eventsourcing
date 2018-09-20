const isUUID = require('is-uuid').v4

module.exports = (req, res, next) => {
    req.params.id && (!isUUID(req.params.id) && (req.params.id = Number(req.params.id)))
    next()
}