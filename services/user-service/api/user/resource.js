module.exports = (registry) => {
  return {
    create(req, res) {
      const data = req.body;

      const command = {
        commandType: 'CreateUser',
        commandData: data,
        commandTimestamp: new Date().getTime()
      };

      const aggregateRoot = new registry.AggregateRoot({
        eventstoreClient: registry.eventstoreClient,
        EntityClass: registry.domain.User
      });

      aggregateRoot
        .createEntity({
          EntityClass: registry.domain.User,
          command
        })
        .then(() => res.end());
    },
    update(req, res) {
      const data = req.body;
      const uid = req.params.id;

      const command = {
        commandType: 'UpdateUser',
        commandData: data,
        commandTimestamp: new Date().getTime()
      };

      const aggregateRoot = new registry.AggregateRoot({
        eventstoreClient: registry.eventstoreClient,
        EntityClass: registry.domain.User
      });

      aggregateRoot
        .updateEntity({
          EntityClass: registry.domain.User,
          uid,
          command
        })
        .then(() => res.end());
    }
  }
};