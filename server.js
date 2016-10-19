var Promise = require('bluebird');
var express = require('express');
var app = express();

// replace real fs module globally
var realFs = require('fs');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

var bodyParser = require('body-parser');
var _ = require('lodash');


app.use(bodyParser.urlencoded({limit: '128mb', extended: true}));
app.use(bodyParser.json({limit: '128mb'}));

app.use('/api/', require('./routes/changes'));
app.use('/api/', require('./routes/singleChange'));
app.use('/api/', require('./routes/checkChange'));
app.use('/api/', require('./routes/changeTask'));
app.use('/api/', require('./routes/export'));

// START THE SERVER
var models = require('./models');
models.sequelize.sync()
    .then(function () {
        var server = app.listen(8090);
        console.log('Magic happens on ' + server.address().address + 8090);
    });
