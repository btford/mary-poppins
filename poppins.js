var fs = require('fs');
var util = require('util');
var path = require('path');

var Metahub = require('metahub').Metahub;


var Poppins = function Poppins () {
  this.plugins = {};
  Metahub.apply(this, arguments);
};

util.inherits(Poppins, Metahub);

// register a task for Poppins
Poppins.prototype.couldYouPlease = function couldYouPlease (taskName) {
  var task;

  if (taskName instanceof Array) {
    return taskName.forEach(this.couldYouPlease.bind(this));
  }
  if (typeof taskName === 'string') {
    task = maybeRequire(taskName) || maybeRequire('poppins-' + taskName);
  }
  if (task) {
    task(this);
    this.emit('log', 'Loaded task "' + taskName + '"');
  } else {
    return this.emit('log', 'Could not find task "' + taskName + '"');
  }
};

// load locally installed tasks for Poppins
Poppins.prototype.theUsualPlease = function theUsualPlease () {
  fs.readdirSync(path.resolve('node_modules')).
    filter(function (name) {
      return name.indexOf('poppins-') === 0;
    }).
    forEach(this.couldYouPlease.bind(this));
};


Poppins.prototype.start = function () {
  return Metahub.prototype.start.apply(this, arguments);
};


function maybeRequire (package) {
  try {
    return require(path.resolve('node_modules', package));
  } catch (e) {
    console.log(e.toString());
  }
}


module.exports = function () {
  return new Poppins();
};

module.exports.Poppins = Poppins;
