#!/usr/bin/env node

var express = require('express');

var app = express();
app.use(express.static(__dirname + '/demo'));

app.listen(11111);
console.log('Listening on port 11111');

