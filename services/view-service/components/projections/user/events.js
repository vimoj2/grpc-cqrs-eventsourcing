module.exports = (tnx) => {
  const events = {
    ['UserCreated'](event) {
      if (this.state.users)
        this.state.users[`${event.uid}`] = event;
      else
        this.state.users = { [`${event.uid}`]: event };
    },
    ['UserUpdated'](event) {
      if (this.get('users')[event.uid])
        Object.assign(this.get('users')[event.uid], event);
    }
  };
  return { events };
};
