
var isPlusOne = function (message) {
  return message.indexOf('+1') !== -1;
}

module.exports = function (issue) {
  return issue.comments.reduce(function (sum, comment) {
    return sum + ~~isPlusOne(comment.body);
  }, 0);
};
