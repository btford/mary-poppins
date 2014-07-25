var mocks = require('../poppins-mocks.js');
var expect = require('expect.js');

// For debug logs: mocks.debug();

describe('basic', function () {
  it('should read the repo on startup', function(done) {
    mocks.createPoppins({
      repo: {
        id: 123,
        name: 'someName'
      }
    }).then(function() {
      expect(mocks.poppins.repo).to.eql({
          id: 123,
          name: 'someName',
          meta: {status: '200 OK'}
      });
    }).then(done, done);
  });

  it('should read the open issues on startup', function(done) {
    mocks.createPoppins({
      openIssues: [
        { number: 123 }
      ],
      log: false
    }).then(function() {
      expect(mocks.poppins.issues).to.eql({
        123: {
          number: 123, comments: []
        }
      });
    }).then(done, done);
  });

  it('should read the closed issues on startup', function(done) {
    mocks.createPoppins({
      closedIssues: [
        { number: 123 }
      ],
      log: false
    }).then(function() {
        expect(mocks.poppins.issues).to.eql({
          123: {
            number: 123, comments: []
          }
        });
      }).then(done, done);
  });

  it('should add an issue to its data when Github pushes it', function(done) {
    mocks.createPoppins({
      log: true
    }).then(function() {
      return mocks.request({
          action: 'opened',
          issue: {
            number: 123
          }
        });
    }).then(function(res){
        expect(mocks.poppins.issues[123].number).to.be(123);
        done();
    });
  });
});
