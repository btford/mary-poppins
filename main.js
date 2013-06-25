#!/usr/bin/env node

var path = require('path');
var program = require('commander'); // TODO: this is kinda overkill

var makeGithub = function (file) {
  var config = require(path.join(process.cwd(), file));
  return require('./lib/github')(config);
};

var logDone = function (res) {
  console.log(program.json ? res : 'Done.');
};

// CLI
// ---

program.
  option('-j, --json', 'full JSON response from GitHub').
  version(require('./package.json').version);

program.
  command('install <config.js>').
  description('install hook on GitHub').
  action(function (file) {
    makeGithub(file).
      createHook().
      done(logDone);
  });

program.
  command('remove <config.js> [id]').
  description('remove hook from GitHub').
  action(function (file, id) {
    makeGithub(file).
      deleteHook(id).
      done(logDone);
  });

program.
  command('enable <config.js> [id]').
  description('enable GitHub hook').
  action(function (file, id) {
    makeGithub(file).
      enableHook(id).
      done(logDone);
  });

program.
  command('disable <config.js> [id]').
  description('enable GitHub hook').
  action(function (file, id) {
    makeGithub(file).
      disableHook(id).
      done(logDone);
  });

program.
  command('hooks <config.js>').
  description('list GitHub hooks').
  action(function (file) {
    var gh = makeGithub(file);
    gh.getHooks().
      done(function (hooks) {
        if (program.json) {
          console.log(hooks);
          return;
        }
        hooks.
          filter(function (hook) {
            return hook.name === 'web';
          }).
          forEach(function (hook) {
            console.log('#' + hook.id);
            console.log('  active: ' + hook.active);
            console.log('  url:    ' + hook.config.url);
          });
      });
  });

program.
  command('start <config.js>').
  description('run hook server').
  action(function (file) {
    var gh = makeGithub(file);
    gh.populate();
    gh.on('pullRequestOpened', function (data) {
      var number = data.payload.pull_request.number;
      gh.getCommits(number).
        then(function (commits) {
          if (commits.some(function (commit) {
            var match = commit.commit.message.match(/^(.*)\((.*)\)\:\s(.*)$/);
            return !match || !match[1] || !match[3];
          })) {
            return gh.createComment(number, fs.readFileSync('./messages/commit.md'));
          }
        }).
        done(console.log);
    });

    var server = require('./lib/hook')();
    server.on('hook', function (data) {
      gh.merge(data);
    });
    server.listen(config.hook.port);
  });

program.
  parse(process.argv);
