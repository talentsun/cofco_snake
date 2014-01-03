#!/usr/bin/env node

var util = require('util');
var express = require('express');
var handlebars = require('handlebars');
var fs = require('fs');

var app = express();
app.use(express.logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use("/libs", express.static(__dirname + '/bower_components'));

var user = {
	id: 0,
	score: 2000,
};

app.get('/test/info', function(req, res) {
	res.send({
		status: 1,
		data: user
	});
});

app.get('/test/upload', function(req, res) {
	var score = parseInt(req.query.score, 10);
	user.score += score;
	res.send({
		status: 1,
		data: {
			id: user.id,
			gift: score > 500
		}
	});
});

var _template = null;
app.get('/', function(req, res) {
	fs.readFile("templates/index.hbs", "utf-8", function(err, data) {
		if (err) {
			return console.error(err);
		}

		_template = _template || handlebars.compile(data);
		var html = _template({
		DEBUG: process.env.NODE_ENV === 'development'
		});
		res.send(html);
	});
});

app.listen(process.argv.length > 2 ? process.argv[2] : 3000);