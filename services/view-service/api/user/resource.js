module.exports = (registry) => {
  const state = registry.projection.state;
  return {
    find(req, res) {
      if (!state.users || !state.users[req.params.id]) {
        res.status(404).end();
        return;
      }
      res.json(state.users[req.params.id]);
    },
    findAll(req, res) {
        res.json(Object.values(state.users ? state.users : {}));
    }
  }
};