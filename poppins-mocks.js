// see https://github.com/visionmedia/superagent
var request = require('supertest');
// see https://github.com/pgte/nock
var nock = require('nock');

var Q = require('q');
Q.longStackSupport = true;

var expect = require('expect.js');
var Poppins = require('./poppins.js').Poppins;
var debugging = false;


beforeEach(function() {
  nock.cleanAll();
});

afterEach(function() {
  closePoppins();
});

var exports = module.exports = {
  poppins: null,
  debug: debug,
  createPoppins: createPoppins,
  github: {
    mock: githubMock,
    mockGet: githubMockGet,
    repoPath: repoPath,
    issuesPath: issuesPath
  },
  request: poppinsRequest
};

function debug() {
  debugging = true;
  // can't turned off right now :-(
  nock.recorder.rec();
}

function createPoppins(initData) {
  closePoppins();
  initData = initData || {};
  initData.openIssues = initData.openIssues || [];
  initData.closedIssues = initData.closedIssues || [];

  var nockScopes = [];
  nockScopes.push(githubMockGet(repoPath(), initData.repo || {
    "id": 460078
  }));
  nockScopes.push(githubMockGet(issuesPath({state: 'open'}), initData.openIssues));
  if (initData.openIssues.length) {
    // if we have issues, poppins will ask for the next page
    nockScopes.push(githubMockGet(issuesPath({state: 'open'}), []));
  }
  nockScopes.push(githubMockGet(issuesPath({state: 'closed'}), initData.closedIssues));
  if (initData.closedIssues.length) {
    // if we have issues, poppins will ask for the next page
    nockScopes.push(githubMockGet(issuesPath({state: 'closed'}), []));
  }

  var poppins = exports.poppins = new Poppins({
    target: {
      user: 'someGithubUser',
      repo: 'someGithubRepo'
    },
    login: {
      username: 'someUser',
      password: 'somePassword'
    },
    // port for poppins to listen on and URL for Github to ping
    hook: {
      url: 'http://example.com:1234',
      port: 1234
    }
  });
  clearPoppinsCache(poppins);

  if (debugging) {
    poppins.on('log', function(msg) {
      console.log(msg);
    });
  }

  return poppins.start().then(function() {
    // assert that the repo, the open and closed issues were read.
    // Then the corresponding mocks also have been removed.
    nockScopes.forEach(function(nockScope) {
      nockScope.done();
    });
  });

}

function closePoppins() {
  if (exports.poppins) {
    exports.poppins.stop();
    exports.poppins = null;
  }
}

function clearPoppinsCache(poppins) {
  if (poppins.cache.exists('repo')) {
    poppins.cache.clear('repo');
  }
  if (poppins.cache.exists('issues')) {
    poppins.cache.clear('issues');
  }
  if (poppins.cache.exists('hook')) {
    poppins.cache.clear('hook');
  }
}

function githubMock(pathRegexStr) {
  // using string regex so we don't have to escape
  // slashes when defining them.
  var pathRegex = new RegExp(pathRegexStr);
  return nock('https://api.github.com:443')
    .filteringPath(function(path) {
      if (pathRegex.test(path)) {
        return '/path';
      } else {
        return '/notMatched'
      }
    });
}

function githubMockGet(pathRegEx, response) {
  return githubMock(pathRegEx)
    .get('/path')
    .reply(200, JSON.stringify(response),
    { 'content-type': 'application/json; charset=utf-8',
      status: '200 OK'
    });
}

function repoPath() {
  return '/repos/[^/]+/[^/]+$';
}

function issuesPath(filters) {
  var res = '/issues', prop;
  for (prop in filters) {
    res += '.*'+prop+'='+filters[prop];
  }
  return res;
}

function poppinsRequest(data, callback) {
  var deferred = Q.defer();

  request(exports.poppins.server).post('/')
    .send({
      payload: JSON.stringify(data)
    })
    .type('application/json')
    .set('Accept', 'application/json')
    .expect(202)
    .end(deferred.makeNodeResolver());

  return deferred.promise;
}