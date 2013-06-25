#!/usr/bin/env node

var path = require('path');
var program = require('commander'); // TODO: this is kinda overkill
var server = require('./lib/hook')();

// CLI
// ---

program.
  usage('<config-file.js>').
  version(require('./package.json').version).
  parse(process.argv);

if (program.args.length !== 1) {
  console.log('Error: should be run with one argument');
  program.help();
}


// Config
// ------

var config = require(path.join(process.cwd(), program.args[0]));

var gh = require('./lib/github')(config);
gh.log = console.log;
gh.populate();

server.on('hook', function (data) {
  gh.merge(data);
});

gh.on('pullRequestOpened', function (data) {
  var number = data.payload.pull_request.number;
  gh.getCommits(number).then(function (commits) {
    if (commits.some(function (commit) {
      var match = commit.commit.message.match(/^(.*)\((.*)\)\:\s(.*)$/);
      return !match || !match[1] || !match[3];
    })) {
      gh.comment(number, fs.readFileSync('./messages/commit.md'));
    }
  });
});
