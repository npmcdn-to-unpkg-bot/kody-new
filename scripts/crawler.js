// load modules

var Crawler = require("crawler");
var url = require('url');
var mongo = require('mongodb');
var monk = require('monk');
var async = require('async');


// load custom modules

var Parser = require('./modules/parser');

// start connection

var collection = monk('localhost:27017/kodygry').get('import');


var urls = [];
var main_url = 'http://kody.info.pl/';
var added = 0;

var c = new Crawler({
    maxConnections : 10,
    incomingEncoding: 'iso-8859-2',
    forceUTF8: true,
    // This will be called for each crawled page
    callback : function (error, result, $)
    {

        var url = result.uri;
        var domain_regex = new RegExp("^http:\/\/kody\.info\.pl\/.*");
        var url_regex = new RegExp("^http:\/\/");
        var page_regex = new RegExp("^http:\/\/kody\.info\.pl\/Kody\-do\-");
        var parser = new Parser(collection);

        if(page_regex.test(url))
        {
            async.series([
                function(callback){ parser.parse(url, $, callback); },
                function(callback){ parser.insert(callback) }
            ], function(err, results)
            {
                if(!err && results[1] === true)
                {
                    added++;

                    // shows current status
                    process.stdout.write("\u001b[2J\u001b[0;0H");
                    console.log("imported: " + added);
                }
            });

        }

        $('a').each(function(index, a)
        {
            var toQueueUrl = $(a).attr('href');

            if(!url_regex.test(toQueueUrl))
            {
                toQueueUrl = main_url + toQueueUrl;
            }

            if((domain_regex.test(toQueueUrl)) && urls.indexOf(toQueueUrl) == -1)
            {
                c.queue(toQueueUrl);
            }
            
        });

        urls[urls.length] = url;

    }
});

// Queue just one URL, with default callback
c.queue(main_url);