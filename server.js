var Promise = require('bluebird');
var express = require('express');
var cors = require('cors');
const multer = require('multer');
var app = express();

// replace real fs module globally
var realFs = require('fs');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

var bodyParser = require('body-parser');
var _ = require('lodash');

var config = require('./config');
const upload = multer({dest: './uploads/'});
app.use(bodyParser.urlencoded({limit: '128mb', extended: true}));
app.use(bodyParser.json({limit: '128mb'}));
app.use(cors());

app.use('/api/',
    upload.fields([{name: 'excel'}, {name: 'zip'}]),
    require('./routes/changes')
);
app.use('/api/', require('./routes/singleChange'));
app.use('/api/',
    upload.fields([{name: 'excel'}, {name: 'zip'}]),
    require('./routes/checkChange'));
app.use('/api/',
    upload.fields([{name: 'excel'}]),
    require('./routes/changeTask')
);
app.use('/api/',
    upload.fields([{name: 'excel'}]),
    require('./routes/export')
);

// START THE SERVER
var models = require('./models');
models.sequelize.sync()
    .then(function () {
        var server = app.listen(config.PORT);
        console.log('Magic happens on ' + server.address().address + config.PORT);
    });
