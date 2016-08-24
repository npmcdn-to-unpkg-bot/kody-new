var express = require('express');
var router = express.Router();
var path = require('path');

var normalizedPath = path.join(__dirname, 'api');

// loop through the api route files
require("fs").readdirSync(normalizedPath).forEach(function(file) {
	if (file == 'routes.js') {
		return;
	}

	router.use('/api/' + file.slice(0, -3), require('./api/' + file));
});

router.get('/', function(req, res) {
	console.log('it happened');
  	res.send('hello world yo');
});

module.exports = router;