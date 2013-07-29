// cached wrapper around Github
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');

var Q = require('q');
Q.longStackSupport = true;

var _ = require('lodash');
var GitHubApi = require('github');

var makeCache = require('./cache');

var Github = function (config) {
  this.config = config;

  this.config.msg = {
    user: config.target.user,
    repo: config.target.repo
  };

  this.rest = new GitHubApi({
    version: '3.0.0'
  });

  this.rest.authenticate({
    type: 'basic',
    username: config.login.username,
    password: config.login.password
  });

  this.cache = makeCache();

  this.repo = null;
  this.issues = null;
  this.prs = null;

  this.log = function () {};
};

util.inherits(Github, EventEmitter);

// grab all data from Github API and cache it
Github.prototype.populate = function () {
  var cache = this.cache;
  var gh = this;

  gh.log('Populating cache');

  return this._populateRepo().
    then(function (repo) {
      if (cache.exists('repo')) {
        gh.repo = cache.get('repo');
        if (Date.parse(repo.updated_at) > Date.parse(gh.repo.updated_at)) {
          gh.log('Cache is stale');
          gh.repo = repo;
          cache.set('repo', repo);
        } else {
          gh.issues = cache.get('issues');
          return;
        }
      } else {
        gh.log('No repo cache');
        cache.set('repo', repo);
      }
      return gh._populateAndCacheIssues(repo).
        then(function () {
          gh.log('Done caching repo issues');
        });
    });
};

Github.prototype._populateIssues = require('./github/get-issues');

Github.prototype._populateAndCacheIssues = function (repo) {
  var gh = this;
  gh.log('Scraping issue data from Github API');
  return gh._populateIssues(repo).
    then(function (issues) {
      gh.issues = issues;
      gh._cacheIssues();
    });
};

Github.prototype._populateRepo = function () {
  return Q.ninvoke(this.rest.repos, 'get', this.config.msg);
};

Github.prototype.clearCache = function () {
  if (this.cache.exists('repo')) {
    this.cache.clear('repo');
  }
};

Github.prototype.getHooks = function () {
  return Q.ninvoke(this.rest.repos, 'getHooks', this.config.msg);
};

Github.prototype.getCommits = function (number) {
  var msg = _.defaults({
    number: number
  }, this.config.msg);
  return Q.ninvoke(this.rest.pullRequests, 'getCommits', msg);
};

Github.prototype.createComment = function (number, body) {
  var msg = _.defaults({
    number: number,
    body: body
  }, this.config.msg);

  return Q.ninvoke(this.rest.issues, 'createComment', msg);
};

Github.prototype.createHook = function () {

  var msg = _.defaults({
    name: 'web',
    active: true,
    events: [
      'pull_request',
      'issues',
      'issue_comment'
    ],
    config: {
      url: this.config.hook.url,
    }
  }, this.config.msg);

  var cache = this.cache;

  return Q.ninvoke(this.rest.repos, 'createHook', msg);
};

Github.prototype.updateHook = function (id, args) {
  if (!id) {
    if (!this.cache.exists('hook')) {
      throw new Error('No id given');
    }
    id = this.cache.get('hook');
  }

  var msg = _.defaults(args || {}, this.config.msg, {
    id: id,
    name: 'web',
    events: [
      'pull_request',
      'issues',
      'issue_comment'
    ],
    config: {
      url: this.config.hook.url,
    }
  });

  return Q.ninvoke(this.rest.repos, 'updateHook', msg);
};

Github.prototype.enableHook = function (id) {
  return this.updateHook(id, {
    active: true
  });
};

Github.prototype.disableHook = function (id) {
  return this.updateHook(id, {
    active: disable
  });
};

Github.prototype.deleteHook = function (id) {
  if (!id) {
    if (!this.cache.exists('hook')) {
      throw new Error('No id given');
    }
    id = this.cache.get('hook');
  }

  var msg = _.defaults({
    id: id
  }, this.config.msg);

  return Q.ninvoke(this.rest.repos, 'deleteHook', msg);
};

Github.prototype.closeIssue = require('./github/close-issue');


// merge a change event
Github.prototype.merge = function (data) {
  var action = data.action;

  var entity = data.comment ?
                  (data.issue ? 'issueComment' : 'pullRequestComment') :
                data.pull_request ? 'pullRequest' :
                data.issue ? 'issue' : '';

  var methodName = entity +
    action[0].toUpperCase() +
    action.substr(1);

  try {
    (this['_' + methodName] || function () {}).apply(this, [data]);
  }
  catch (e) {
    fs.writeFileSync('error-' + Date.now() + '.txt', JSON.stringify(data) + '\n\n' + e.stack);
  }


  this.emit(methodName, data);
};

// there methods are invoked by merge
// they are applies before event handlers

Github.prototype._issueCommentCreated = function (data) {
  this.__commentCreated(data.issue, data.comment);
};

Github.prototype._pullRequestCommentCreated = function (data) {
  this.__commentCreated(data.pull_request, data.comment);
};

// issueish = issue or PR
Github.prototype.__commentCreated = function (issueish, comment) {
  this.issues[issueish.number].comments.push(comment);
  this._cacheIssues();
};

Github.prototype._issueClosed =
Github.prototype._issueReopened =
Github.prototype._issueOpened = function (data) {
  var old = this.issues[data.issue.number];
  this.issues[data.issue.number] = data.issue;
  if (old && old.comments) {
    this.issues[data.issue.number].comments = old.comments;
  }
  this._cacheIssues();
};

Github.prototype._cacheIssues = function () {
  this.cache.set('issues', this.issues);
};


module.exports = function (config) {
  return new Github(config);
};
