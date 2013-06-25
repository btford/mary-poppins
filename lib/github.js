// cached wrapper around Github
var EventEmitter = require('events').EventEmitter;
var util = require('util');

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

  var getRepo = require('./get-repo')(gh.rest, gh.config);
  var getIssues = require('./issues/get-issues')(gh.rest, gh.config);

  var getAndCacheIssues = function (repo) {
    gh.log('Scraping issue data from Github API');
    return getIssues(repo).
      then(function (issues) {
        cache.set('issues', issues);
        gh.issues = issues;
      });
  };

  return getRepo().
    then(function (repo) {
      if (cache.exists('repo')) {
        gh.repo = cache.get('repo');
        if (Date.parse(repo.updated_at) > Date.parse(gh.repo.updated_at)) {
          gh.log('Cache is stale');
          cache.set('repo', repo);
          gh.repo = repo;
        } else {
          gh.issues = cache.get('issues');
          return;
        }
      } else {
        gh.log('No repo cache');
        cache.set('repo', repo);
      }
      return getAndCacheIssues(repo);
    }).
    then(function () {
      gh.log('Done');
    }, function (err) {
      gh.log(err);
    });
};

Github.prototype.getHooks = function () {
  return Q.ninvoke(this.rest.repos, 'getHooks', this.config.msg);
};

Github.prototype.getCommits = function (number) {
  var msg = _.defaults({
    number: number
  }, config.msg);
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

  return Q.ninvoke(this.rest.repos, 'createHook', msg).
    then(function (res) {
      cache('', res.id)
      return res;
    })
};

Github.prototype.updateHook = function (id) {

  if (!id) {
    if (!this.cache.exists('hook')) {
      throw new Error('No id given')
    }
    id = this.cache.get('hook');
  }

  var msg = _.defaults({
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
  }, this.config.msg);

  return Q.ninvoke(this.rest.repos, 'updateHook', msg);
};

Github.prototype.enableHook = function (id, val) {

  if (!id) {
    if (!this.cache.exists('hook')) {
      throw new Error('No id given')
    }
    id = this.cache.get('hook');
  }

  var msg = _.defaults({
    id: id,
    name: 'web',
    active: val
  }, this.config.msg);

  return Q.ninvoke(this.rest.repos, 'updateHook', msg);
};

Github.prototype.deleteHook = function (id) {

  if (!id) {
    if (!this.cache.exists('hook')) {
      throw new Error('No id given')
    }
    id = this.cache.get('hook');
  }

  var msg = _.defaults({
    id: id
  }, this.config.msg);

  return Q.ninvoke(this.rest.repos, 'deleteHook', msg);
};

Github.prototype.disableHook = function (id) {
  return this.enableHook(id, false);
};


// merge a change event
Github.prototype.merge = function (data) {

  var actionName = data.payload.action;

  var methodName = data.type.replace('Event', '') +
    actionName[0].toUpperCase() +
    actionName.substr(1);

  (this['__' + methodName] || function () {})(data);

  this.emit(methodName, data);
};

// __ methods are invoked by merge

Github.prototype.__issueCommentCreated = function (data) {
  this.issues[data.payload.issue.number].push(data.payload.comment);
  this.__cacheIssues();
};

Github.prototype.__issueClosed =
Github.prototype.__issueReopened =
Github.prototype.__issueOpened = function (data) {
  var old = this.issues[data.payload.issue.number];
  this.issues[data.payload.issue.number] = data.payload.issue;
  if (old && old.comments) {
    this.issues[data.payload.issue.number].comments = old.comments;
  }
  this.__cacheIssues();
};

Github.prototype.__cacheIssues = function () {
  this.cache.set('issues', this.issues);
};


module.exports = function (config) {
  return new Github(config);
};
