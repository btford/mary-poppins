
var Q = require('q');
var _ = require('lodash');

module.exports = function (github, config) {

  // assumes there are <= 100 open PRs
  var getPRs = function () {
    var def = Q.defer();

    var msg = _.defaults({
      page: 0,
      per_page: 100,
      state: 'open'
    }, config.msg);

    github.pullRequests.getAll(msg, def.makeNodeResolver());

    return def.promise;
  };

  return getPRs;
};
