var express = require('express');
var router = express.Router();
var KodyModel = require('../models/kody');

var KodyController = function() {

	this.get = function(req, res) {
		console.log('found kody');
		KodyModel.findById(req.params.id, function(err, kody) {
	        if (err) {
	            res.send(err);
	        }

	        res.json(kody);
	    });
	}
}

module.exports = new KodyController;

// router.get('/:id', function(req, res) {
// 	Kody.findById(req.params.id, function(err, kody) {
//         if (err) {
//             res.send(err);
//         }

//         res.json(kody);
//     });
// });

// router.get('/', function(req, res) {
// 	res.send('kodyyy');
// });

// module.exports = new KodyController;