var express = require('express');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');

var router = require('./routes/routes');

var app = express();

// Mongoose config
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/kodygry');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));   

app.use(router);

// start the server
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
