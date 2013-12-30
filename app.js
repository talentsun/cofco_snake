#!/usr/bin/env node

var util = require('util');

var express = require('express');
var mu = require('mu2');
mu.root = __dirname + "/templates";


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

app.get('/', function(req, res) {
	var stream = mu.compileAndRender('index.html', {
		DEBUG: process.env.NODE_ENV === 'development'
	});
	util.pump(stream, res);
});

app.listen(11111);