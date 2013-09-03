var fs = require('fs');
var util = require('util');

var Metahub = require('metahub').Metahub;

var maybeRequire;


var Poppins = function Poppins () {
  Metahub.apply(this, arguments);
};

util.inherits(Poppins, Metahub);

// register a task for Poppins
Poppins.prototype.couldYouPlease = function couldYouPlease (task) {
  if (task instanceof Array) {
    return task.forEach(this.couldYouPlease.bind(this));
  } else if (typeof task === 'string') {
    task = maybeRequire(task) || maybeRequire('poppins-' + task);
  }
  if (!task) {
    throw new Error('Task not found');
  }

  task(this);
};

// load locally installed tasks for Poppins
Poppins.prototype.theUsualPlease = function theUsualPlease () {
  fs.readdirSync(process.cwd() + '/node_modules').
    forEach(this.couldYouPlease.bind(this));
};



maybeRequire = maybeTry(require);

function maybeTry (fn) {
  return function () {
    try {
      fn.apply(null, arguments);
    } catch (e) {}
  }
}


module.exports = function () {
  return new Poppins();
};

module.exports.Poppins = Poppins;
