var express = require('express');
var router = express.Router();
var path = require('path');

var normalizedPath = path.join(__dirname, 'api'); //require("path").join(__dirname, "routes");

require("fs").readdirSync(normalizedPath).forEach(function(file) {
	if (file == 'routes.js') {
		return;
	}

	router.use('/api/' + file.slice(0, -3), require('./api/' + file));
});

router.get('/', function(req, res) {
  res.send('hello world yo');
});

module.exports = router;