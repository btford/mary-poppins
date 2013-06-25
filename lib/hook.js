var express = require('express');

module.exports = function () {

  // create express instance
  var hookshot = express();

  // middleware
  hookshot.use(express.bodyParser());

  // main POST handler
  hookshot.post('/', function (req, res, next) {
    var payload = JSON.parse(req.body);
    hookshot.emit('hook', payload);
    res.send(202, 'Accepted\n');
  });

  return hookshot;
};
