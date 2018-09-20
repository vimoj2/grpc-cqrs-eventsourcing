module.exports = function (registry) {
  var app = registry.app;
  return {
    findAll: function (req, res) {
      var users = [{id: 1}, {id: 2}];

      res.hal
        .embed('users', users.map(user => app.hal.resource().json(user).link('self', {
          href: '/users/{{id}}',
          id: user.id
        })))
        .send()
    }
  }

};