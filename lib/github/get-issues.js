var Q = require('q');
var _ = require('lodash');

module.exports = function () {
  var github = this.rest,
    config = this.config;

  var getAllIssues = function () {
    return Q.all([
      getIssuesByState('open'),
      getIssuesByState('closed')
    ]).
    then(function (issues) {
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
    });
  };

  // get either all open or all closed issues
  var getIssuesByState = function (state) {

    // warning: recursive promise wizardry ahead
    // keep grabbing pages until you get two of the same issue in a row
    var page = 1,
      acc = [];

    var getNextIssuePage = function (issues) {
      if (issues.length === 0) {
        return acc;
      } else {
        acc = acc.concat(issues);
        page += 1;
        return getIssuePage(page).
          then(getNextIssuePage);
      }
    };

    var getIssuePage = function (page) {
      var msg = _.defaults({
        sort: 'created',
        page: page,
        state: state,
        per_page: 100
      }, config.msg);

      return Q.ninvoke(github.issues, 'repoIssues', msg);
    };

    return getIssuePage(page).
      then(getNextIssuePage);
  };


  // get all the comments for some issue
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
    var msg = _.defaults({
      number: issue,
      page: page,
      per_page: 100
    }, config.msg);

    return Q.ninvoke(github.issues, 'getComments', msg);
  };

  return getAllIssues();
};