module.exports = {

  // Github repo to watch
  // https://github.com/myname/myrepo
  target: {
    user: 'myname',
    repo: 'myrepo'
  },

  // credentials for user who leaves comments, etc
  login: {
    username: 'myrobotname',
    password: 'supersecretpassword'
  },

  // port to listen on,
  // and URL for Github to ping
  hook: {
    url: 'http://example.com:1234',
    port: 1234
  }
};
