var Q = require('q');
var _ = require('lodash');

module.exports = function (github, config) {

  var closeIssues = function (issues) {
    return Q.all(issues.map(closeIssue));
  };

  var closeIssue = function (issue) {
    var def = Q.defer();

    var msg = _.defaults({
      number: issue.number,
      state: 'closed',
      title: issue.title,
      body: issue.body || ''
    }, config.msg);

    // persist these optional values

    if (issue.labels) {
      msg.labels = _.pluck(issue.labels, 'name');
    } else {
      msg.labels = [];
    }

    if (issue.assignee) {
      msg.assignee = issue.assignee.login;
    }

    if (issue.milestone) {
      msg.milestone = issue.milestone.number;
    }

    github.issues.edit(msg, def.makeNodeResolver());

    return def.promise;
  };

  return closeIssues;
};
