#!/usr/bin/env node

var express = require('express');

var app = express();
app.use(express.logger());
app.use(express.static(__dirname + '/demo'));
app.use("/libs", express.static(__dirname + '/bower_components'));

app.listen(11111);
console.log('Listening on port 11111');

