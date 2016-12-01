#!/usr/bin/env node

var fs           = require('fs');
var path         = require('path');
var program      = require('commander');
var makePoppins  = require('./poppins');

var log = console.log.bind(console);

// CLI
// ---

program.
  option('-l, --log'     , 'print log messages').
  option('-p, --pretty'  , 'pretty format JSON cache').
  option('-s, --skip'    , 'skip initial scrape').
  option('-v, --verbose' , 'log full JSON responses from GitHub').
  version(require('./package.json').version);

program.
  command('install <config.js>').
  description('install hook on GitHub').
  action(withPoppins(function (poppins) {
    return poppins.createHook();
  }));
wfwefwefrw
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
        if (program.verbose) {
          log(hooks);
          return;
        }
        hooks.
          filter(function (hook) {
            return hook.name === 'web';
          }).
          forEach(function (hook) {
            log('#' + hook.id);
            log('  active: ' + hook.active);
            log('  url:    ' + hook.config.url);
          });
      });
  }));

program.
  command('start <config.js>').
  description('run hook server').
  action(withPoppins(function (poppins) {
    if (program.skip) {
      poppins._config();
      poppins.issues = poppins.cache.get('issues');
      poppins.serverInstance = poppins.server.listen(poppins.config.hook.port);
      poppins.emit('cacheBuilt');
      return poppins;
    } else {
      return poppins.start();
    }
  }));

program.
  parse(process.argv);

// --

function withPoppins (fn) {
  return function (file) {
    var poppins = arguments[0] = initPoppins(file);
    if (program.verbose) {
      poppins.server.on('hook', log);
    }
    if (program.log) {
      poppins.on('log', log);
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
  log(program.verbose ? res : 'Done.');
}
