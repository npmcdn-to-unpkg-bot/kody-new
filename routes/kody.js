var express = require('express');
var router = express.Router();
var kodyController = require('../controllers/kody');

router.get('/:id', kodyController.get); 

router.get('/', function(req, res) {
	res.send('kodyyy');
});

module.exports = router;