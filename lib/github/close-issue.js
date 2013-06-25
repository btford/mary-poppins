var Q = require('q');
var _ = require('lodash');

module.exports = function (issue) {
  var msg = _.defaults({
    number: issue.number,
    state: 'closed',
    title: issue.title,
    body: issue.body || ''
  }, this.config.msg);

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

  Q.ninvoke(this.rest.issues, 'edit', msg);
};
