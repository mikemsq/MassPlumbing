var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

var port = 8081;
var url = '/scrape';

var filename = 'plumbing.csv';

var page = 0;
var maxPages = 5000;
var done = false;

var processCell = function(cell, $) {
	var data = [];
    $(cell).contents().each(function () {
    	var txt = $(this).text().trim();
    	if (txt) {
    		data.push(txt);
    	}
    });
    return data.join(', ');
};

var processPage = function (root, url, res) {
   	page++;
   	var u = root + url + page;
	res.write('Processing page ' + page + '. Url: ' + u + '<br/>');
	console.log('Processing page ' + page + '. Url: ' + u);
	    	
	request(u, function (error, response, html) {
	    if (!error) {
	        var $ = cheerio.load(html);

		    var item = '';
		    $('#tableresults tbody > tr').each(function () {
		        var row = $(this);
		        var cells = row.children();
		        if (cells.length > 0) {
			        var description = processCell(cells[0], $);
			        var manufacturer = processCell(cells[1], $);
			        var model = processCell(cells[2], $);

			        item += '"' + description.replace(/"/g, '\\"') + '","' + manufacturer.replace(/"/g, '\\"') + '","' + model.replace(/"/g, '\\"') + '"\n';
			    }
		    });

			fs.appendFile(filename, item, function (err) {
			});

			var lastPage = parseInt($($('.rezult')[2]).text());
			if (page < lastPage && page < maxPages) {
				setTimeout(function () {
					processPage(root, url, res);
				}, 100 + Math.random() * 100 );
		    } else {

				res.write('Done!');
				res.end();
				console.log('Done!');
			}

		} else {

			res.send('Error: ' + error)

		}
    });
};

app.get('/scrape', function (req, res) {

	fs.unlink(filename);
	fs.appendFile(filename, 'description,manufacturer,model\n');

	res.type('html');

	var root = 'http://license.reg.state.ma.us';
	var url = '/pubLic/pl_products/pb_search.asp?type=P&manufacturer=&model=&product=&description=&psize=2000&pagenum=';
	processPage(root, url, res);
});


app.listen(port)
console.log('Go to http://localhost:' + port + url);
exports = module.exports = app;
