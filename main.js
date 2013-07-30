#!/usr/bin/env node

var path = require('path');
var program = require('commander'); // TODO: this is kinda overkill
var fs = require('fs');

var Q = require('q');
Q.longStackSupport = true;

var makeGithub = function (file) {
  var config = require(path.join(process.cwd(), file));
  var gh = require('./lib/github')(config);
  gh.cache.pretty = program.pretty;

  return gh;
};

var logDone = function (res) {
  console.log(program.json ? res : 'Done.');
};

// CLI
// ---

program.
  option('-j, --json', 'log full JSON response from GitHub').
  option('-p, --pretty', 'pretty format cached JSON').
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
  command('cache <config.js>').
  description('clear and repopulate the cache').
  action(function (file, id) {
    var gh = makeGithub(file);
    
    gh.clearCache();

    gh.
      populate().
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

    var checks = require('./checks/unknown');
    var greeting = fs.readFileSync('./messages/greeting.md', 'utf8');
    var closing = fs.readFileSync('./messages/closing.md', 'utf8');

    gh.
      populate().
      done(function () {
        var checkPr = function (data) {
          var number = data.pull_request.number;
          gh.getCommits(number).
            then(function (commits) {
              var checkList = checks.map(function (check) {
                if (check.condition && check.target === 'commits') {
                  return (check.condition(commits) ? '- [x] ' : '- [ ] ') + check.message;
                } else {
                  return '- [ ] ' + check.message;
                }
              }).join('\n');

              var commentBody = [ greeting, checkList, closing ].join('\n\n');

              return gh.createComment(number, commentBody);
            }).
            done(console.log);
        };

        gh.on('pullRequestOpened', checkPr);

        // TODO: remove old comments
        //gh.on('pullRequestReopened', checkPr);
        //gh.on('pullRequestSynchronize', checkPr);

        var server = require('./lib/hook')();
        server.on('hook', function (data) {
          gh.merge(data);
        });

        if (program.json) {
          server.on('hook', console.log);
        }

        server.listen(gh.config.hook.port);
        console.log('listening on ' + gh.config.hook.port);
      });
  });

program.
  parse(process.argv);
