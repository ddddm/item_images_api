var Promise = require('bluebird');
var express = require('express');
var cors = require('cors');
const multer = require('multer');
const path = require('path');
var app = express();

// replace real fs module globally
var realFs = require('fs');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

var bodyParser = require('body-parser');
var _ = require('lodash');

var config = require('./config');
const upload = multer({
    dest: './uploads/',
    fileFilter: function fileFilter (req, file, cb) {
        if(path.extname(file.originalname) === '.xls') {
            return cb(new Error('Old excel formats are not allowed. Convert to new one through Google Drive.'))
        } else {
            cb(null, true);
        }
    }
});

app.use('/excels', express.static('excels'));
app.use('/images', express.static('images'));
app.use(bodyParser.urlencoded({limit: '128mb', extended: true}));
app.use(bodyParser.json({limit: '128mb'}));
app.use(cors());
app.use(upload.fields([{name: 'excel'}, {name: 'zip'}]));

app.use('/api/',
    require('./routes/changes')
);
app.use('/api/', require('./routes/singleChange'));
app.use('/api/',
    require('./routes/checkChange'));
app.use('/api/',
    require('./routes/changeTask')
);
app.use('/api/',
    require('./routes/export')
);
app.get('/api/deploy-test', function( req, res) {
    res.json({
        status: 'ok',
        message: 'test'
    })
})
app.use((error, req, res, next) => {
    if(error) {
        res.status(400).send(
            error.message || ''
        )
    }
})

// START THE SERVER
var models = require('./models');
models.sequelize.sync()
    .then(function () {
        var server = app.listen(config.PORT);
        console.log('Magic happens on ' + server.address().address + config.PORT);
    });
