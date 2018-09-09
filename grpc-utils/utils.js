function toJSONBytes(obj) {
  if (Array.isArray(obj)) {
    return obj = obj.map(o => Buffer.from(JSON.stringify(obj)));
  }
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