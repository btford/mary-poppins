module.exports = [
  {
    message: "Contributor [signed CLA](http://docs.angularjs.org/misc/contribute#CLA) now or in the past\n  - If you just signed, leave a comment here with your real name"
  },
  {
    message: "PR's commit messages follow the [commit message format](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#))",

    // what is passed into the "condition" function
    target: 'commits',
    condition: function (commits) {
      return !commits.some(function (commit) {
        var match = commit.commit.message.match(/^(.*)\((.*)\)\:\s(.*)$/);
        return !match || !match[1] || !match[3];
      });
    }
  }
];
