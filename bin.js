#!/usr/bin/env node

var fs           = require('fs');
var path         = require('path');
var program      = require('commander');
var makePoppins  = require('./poppins');


// CLI
// ---

program.
  option('-j, --json', 'log full JSON response from GitHub').
  option('-p, --pretty', 'pretty format cached JSON').
  option('-v, --verbose', 'Print log messages').
  version(require('./package.json').version);

program.
  command('install <config.js>').
  description('install hook on GitHub').
  action(withPoppins(function (poppins) {
    return poppins.createHook();
  }));

program.
  command('init [file]').
  description('create a new poppins config file').
  action(function (file) {
    file = file || 'poppins.config.js';
    fs.writeFileSync(
        path.join(process.cwd(), file),
        fs.readFileSync(path.join(__dirname, 'example-config.js')));
  });

program.
  command('remove <config.js> [id]').
  description('remove hook from GitHub').
  action(withPoppins(function (poppins, id) {
    return poppins.deleteHook(id);
  }));

program.
  command('enable <config.js> [id]').
  description('enable GitHub hook').
  action(withPoppins(function (poppins, id) {
    return poppins.enableHook(id);
  }));

program.
  command('cache <config.js>').
  description('clear and repopulate the cache').
  action(withPoppins(function (poppins) {
    poppins.clearCache();
    return poppins.populate();
  }));

program.
  command('disable <config.js> [id]').
  description('disable GitHub hook').
  action(withPoppins(function (poppins, id) {
    return poppins.disableHook(id);
  }));

program.
  command('hooks <config.js>').
  description('list GitHub hooks').
  action(withPoppins(function (poppins) {
    poppins.getHooks().
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
  }));

program.
  command('start <config.js>').
  description('run hook server').
  action(withPoppins(function (poppins) {
    return poppins.start();
  }));

program.
  parse(process.argv);

// --

function withPoppins (fn) {
  return function (file) {
    var poppins = arguments[0] = initPoppins(file);
    if (program.verbose) {
      poppins.on('log', console.log.bind(console));
      poppins.server.on('hook', console.log.bind(console));
    }
    var promise = fn.apply(null, arguments);
    if (promise && promise.then) {
      promise.done(logDone);
    }
    return promise;
  };
}

function initPoppins (file) {
  var config = require(path.join(process.cwd(), file));
  var poppins = makePoppins();
  config(poppins);
  poppins._config();
  return poppins;
}

function logDone (res) {
  console.log(program.json ? res : 'Done.');
}
