var mongoose     = require('mongoose');
var kodyModel = require('./../models/kody');
var slug = require('slug');
var async = require('async');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/kodygry');

kodyModel.find().exec().then(function(kody) {

	async.eachSeries(kody, function (k, callbackEach) {
    	
    	let kodyslug = slug(k.title, { lower: true });

    	var i = 0;
    	var suffix = '';

    	async.during(function(callback) {

    		suffix = i === 0 ? '' : '-' + i;

    		kodyModel.count({slug: kodyslug + suffix})

	    	.then((count) => { callback(null, count > 0); });
    	}, 
    	function(callback) {

    		i++; 

    		callback(); 
    	}, 
    	function(err) {

    		console.log(kodyslug + suffix);
    		if (err) {
    			throw err;
    		}

    		k.slug = kodyslug + suffix; 
    		k.save().then(() => { console.log('done'); callbackEach() }); 
    	});


    }, function(err) {

    	if (err) {
    		throw err;
    	}

    	console.log('finished');
    	mongoose.connection.close();
    });
});




// query.exec().then(function(kody) {
// 	console.log('got it');
// 	kody.forEach(function(k) {
// 		console.log(k.title);
// 	});
// });