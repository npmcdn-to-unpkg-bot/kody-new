var express = require('express');
var router = express.Router();

var normalizedPath = __dirname; //require("path").join(__dirname, "routes");

require("fs").readdirSync(normalizedPath).forEach(function(file) {
	if (file == 'routes.js') {
		return;
	}

	router.use('/' + file.slice(0, -3), require('./' + file));
});

router.get('/', function(req, res) {
  res.send('hello world yo');
});

module.exports = router;