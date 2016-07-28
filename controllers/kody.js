var express = require('express');
var router = express.Router();
var KodyModel = require('../models/kody');

var KodyController = function() {

	this.get = function(req, res) {
		KodyModel.find({ slug: req.params.slug }).then((kody) => { res.json(kody); },
		(error) => { res.json(error); });
	}
}

module.exports = new KodyController;