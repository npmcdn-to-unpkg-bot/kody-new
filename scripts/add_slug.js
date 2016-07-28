var mongoose     = require('mongoose');
var kodyModel = require('./../models/kody');
var slug = require('slug');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/kodygry');

kodyModel.find().exec().then(function(kody) {

    kody.forEach(function (k) {
    	k.slug = slug(k.title, { lower: true });
		k.save();    
    });
});

// query.exec().then(function(kody) {
// 	console.log('got it');
// 	kody.forEach(function(k) {
// 		console.log(k.title);
// 	});
// });