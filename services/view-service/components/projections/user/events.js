module.exports = () => {
  const events = {
    ['UserCreated'](event) {
      console.log(event)
    },
    ['UserUpdated'](event) {
      console.log(event)
    }
  };
  return { events };
};
