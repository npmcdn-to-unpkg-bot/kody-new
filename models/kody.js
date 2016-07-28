var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var Kody   = new Schema({
    title: String,
    content: String,
    slug: String
}, { collection: 'kody'});

module.exports = mongoose.model('Kody', Kody);

