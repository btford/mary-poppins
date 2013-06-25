// cached wrapper around Github
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Q = require('q');
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
  var def = Q.defer();
  this.rest.repos.getHooks(this.config.msg, def.makeNodeResolver());
  return def.promise;
};

Github.prototype.getCommits = function (number) {
  var def = Q.defer();

  var msg = _.defaults({
    number: number
  }, config.msg);

  this.rest.pullRequests.getCommits(msg, def.makeNodeResolver());
  return def.promise;
};

Github.createComment = function (number, body) {
  var def = Q.defer();

  var msg = _.defaults({
    number: number,
    body: body
  }, config.msg);

  github.issues.createComment(msg, def.makeNodeResolver());

  return def.promise;
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
      url: 'http://hasfailed.me:3000/',
    }
  }, this.config.msg);

  var def = Q.defer();
  this.rest.repos.createHook(msg, def.makeNodeResolver());
  return def.promise;
};

Github.prototype.updateHook = function (id) {

  var msg = _.defaults({
    id: id,
    name: 'web',
    active: true,
    events: [
      'pull_request',
      'issues',
      'issue_comment'
    ],
    config: {
      url: 'http://hasfailed.me:3000/',
    }
  }, this.config.msg);

  var def = Q.defer();
  this.rest.repos.updateHook(msg, def.makeNodeResolver());
  return def.promise;
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
