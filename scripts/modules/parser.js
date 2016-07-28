
var Parser = function Parser(collection)
{
	this.collection = collection;
	this.title = '';
	this.content = '';
}
	
Parser.prototype = 
{

	parse: function(page, $, callback)
	{
		var title = $('td.srodek h3').html();

		if(title !== null)
		{
			this.title = title.match(/^.*<br>(.*)$/)[1];
		}

		this.content = $('td.srodek').first().contents().filter(function() {
		    return (this.nodeType == 3 || ['b', 'i'].indexOf(this.name) !== -1);
		}).text();
		

		callback();
	},

	insert: function(callback)
	{
		if(this.title.length && this.content.length)
		{
			var insertdb = this;

			this.collection.count({ title: this.title }, function(e, count)
			{
				if(count == 0)
				{
					insertdb.collection.insert(
					{
						title: insertdb.title,
						content: insertdb.content
					}, function(err, doc)
					{
						callback(err, true);
					});

				}else{

					callback(e, false);
				}
			});
			

		}

	}
}

module.exports = Parser;