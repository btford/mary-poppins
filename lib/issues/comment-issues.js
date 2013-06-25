var Q = require('q');
var _ = require('lodash');

module.exports = function (github, config) {

  var commentIssues = function (issues) {
    return Q.all(issues.map(commentIssue));
  };

  var commentIssue = function (issue) {
    var def = Q.defer();

    var msg = _.defaults({
      number: issue.number,
      body: config.message
    }, config.msg);

    github.issues.createComment(msg, def.makeNodeResolver());

    return def.promise;
  };

  return commentIssues;
};
