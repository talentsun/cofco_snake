#!/usr/bin/env node

var util = require('util');
var express = require('express');
var useragent = require('express-useragent');
var handlebars = require('handlebars');
var fs = require('fs');

var app = express();
app.use(express.logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use(useragent.express());
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
			gift: score > 50
		}
	});
});

app.get('/', function(req, res) {
	res.redirect(req.useragent.isDesktop ? '/desktop' : 'mobile');
});

var _desktop_template = null;
app.get('/desktop', function(req, res, next) {
	fs.readFile("templates/desktop.hbs", "utf-8", function(err, data) {
		if (err) {
			return next(err);
		}

		_desktop_template = _desktop_template || handlebars.compile(data);
		var html = _desktop_template({
			DEBUG: process.env.NODE_ENV === 'development'
		});
		res.send(html);
	});
});

var _mobile_template = null;
app.get('/mobile', function(req, res, next) {
	fs.readFile("templates/mobile.hbs", "utf-8", function(err, data) {
		if (err) {
			return next(err);
		}

		_mobile_template = _mobile_template || handlebars.compile(data);
		var html = _mobile_template({
			DEBUG: process.env.NODE_ENV === 'development'
		});
		res.send(html);
	});
});

app.listen(process.argv.length > 2 ? process.argv[2] : 3000);