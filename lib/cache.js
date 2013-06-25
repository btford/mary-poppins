// disk-backed cache

var fs = require('fs');

var cacheDir = __dirname + '/../.cache';
try {
  fs.mkdirSync(cacheDir);
} catch (e) {}


var filePath = function (name) {
  return cacheDir + '/' + name + '.json';
};

var Cache = function () {
  this.pretty = false;
};

module.exports = function () {
  return new Cache();
};

Cache.prototype.set = function (name, data) {
  fs.writeFileSync(
    filePath(name),
    this.pretty ?
      JSON.stringify(data, null, 2) : JSON.stringify(data));
};

Cache.prototype.get = function (name) {
  return JSON.parse(fs.readFileSync(filePath(name)));
};

Cache.prototype.exists = function (name) {
  return fs.existsSync(filePath(name));
};

Cache.prototype.pretty = function (val) {
  this.pretty = val;
};
