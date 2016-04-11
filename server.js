var Promise = require('bluebird');
var express = require('express');
var app = express();

// replace real fs module globally
var realFs = require('fs');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

var bodyParser = require('body-parser');
var _ = require('lodash');


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/api/', require('./routes/changes'));
app.use('/api/', require('./routes/singleChange'));
app.use('/api/', require('./routes/checkChange'));

// START THE SERVER
var models = require('./models');
models.sequelize.sync()
    .then(function () {
        var server = app.listen(8090);
        console.log('Magic happens on ' + server.address().address + 8090);
    });
