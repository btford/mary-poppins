
var Q = require('q');
var _ = require('lodash');

module.exports = function (github, config) {

  var getIssues = function (repo) {

    var issueCount = repo.open_issues;
    console.log(issueCount);
    var numberOfPages = Math.ceil(issueCount / 100);

    var page,
      promises = [];

    for (page = 0; page < numberOfPages; page += 1) {
      promises.push(getIssuePage(page));
    }

    return Q.all(promises).
      then(function (issues) {
        console.log(issues);

        return _(issues).
          flatten().
          sortBy('number').
          unique(true, 'number').
          value();
      }).
      then(function (issues) {
        return Q.all(issues.map(getIssueComments));
      }).
      then(function (issues) {
        var map = {};
        issues.forEach(function (issue) {
          map[issue.number] = issue;
        });
        return map;
      })
  };

  var getIssuePage = function (page) {
    var def = Q.defer();

    var msg = _.defaults({
      state: 'open',
      sort: 'updated',
      page: page,
      per_page: 100
    }, config.msg); // TODO: can this config have additional unused properties?

    github.issues.repoIssues(msg, def.makeNodeResolver());

    return def.promise;
  };


  // get ALL the comments for some issue
  var getIssueComments = function (issue) {

    var numberOfPages = Math.ceil(issue.comments / 100);

    var page,
      promises = [];

    for (page = 0; page < numberOfPages; page += 1) {
      promises.push(getIssueCommentPage(issue.number, page));
    }

    return Q.all(promises).
      then(function (comments) {
        issue.comments = _(comments).
          flatten().
          sortBy('id').
          unique(true, 'id').
          value();

        return issue;
      });
  };

  // get page N of some issue's comments
  var getIssueCommentPage = function (issue, page) {
    var def = Q.defer();

    if (typeof page !== 'number') {
      throw new Error('no page defined:' + page);
    }

    var msg = _.defaults({
      number: issue,
      page: page,
      per_page: 100
    }, config.msg);

    github.issues.getComments(msg, def.makeNodeResolver());

    return def.promise;
  };

  return getIssues;
};
