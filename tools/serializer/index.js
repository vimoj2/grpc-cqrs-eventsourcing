function toJSONBytes(obj) {
  const str = JSON.stringify(obj);
  return Buffer.from(str);
}

function toObject(bytes) {
  return JSON.parse(Buffer.from(bytes).toString());
}

module.exports = {
  deserialize: toObject,
  serialize: toJSONBytes,
};