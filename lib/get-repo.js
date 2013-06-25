var Q = require('q');

module.exports = function (github, config) {
  return getRepoIssueCount = function () {
    var def = Q.defer();
    github.repos.get(config.msg, def.makeNodeResolver());
    return def.promise;
  };
};
