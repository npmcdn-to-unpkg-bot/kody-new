var monk = require('monk');

var kody = monk('localhost:27017/kodygry').get('kody');

kody.find({}, { sort: { title: -1}}).each((k) => {
	console.log(k.title);
});


