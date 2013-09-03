#!/usr/bin/env node

var path = require('path');
var program = require('commander'); // TODO: this is kinda overkill
var fs = require('fs');

var makeMetahub = require('metahub');

var initMetahub = function (file) {
  var config = require(path.join(process.cwd(), file));
  return makeMetahub(config);
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
    initMetahub(file).
      createHook().
      done(logDone);
  });

program.
  command('remove <config.js> [id]').
  description('remove hook from GitHub').
  action(function (file, id) {
    initMetahub(file).
      deleteHook(id).
      done(logDone);
  });

program.
  command('enable <config.js> [id]').
  description('enable GitHub hook').
  action(function (file, id) {
    initMetahub(file).
      enableHook(id).
      done(logDone);
  });

program.
  command('cache <config.js>').
  description('clear and repopulate the cache').
  action(function (file, id) {
    var meta = initMetahub(file);

    meta.clearCache();

    meta.
      populate().
      done(logDone);
  });

program.
  command('disable <config.js> [id]').
  description('enable GitHub hook').
  action(function (file, id) {
    initMetahub(file).
      disableHook(id).
      done(logDone);
  });

program.
  command('hooks <config.js>').
  description('list GitHub hooks').
  action(function (file) {
    var meta = initMetahub(file);
    meta.getHooks().
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
    var meta = initMetahub(file);

    meta.start();
  });

program.
  parse(process.argv);
