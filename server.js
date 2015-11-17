// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var fs        = require("fs");
var bodyParser = require('body-parser');
var Qs = require('qs');
var _ = require('lodash');
var Promise = require('bluebird');
var parser = require('excel');
var multer  = require('multer');
var JSZip = require("jszip");
var upload = multer({ dest: './uploads/'});

var models = require('./models');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

var changeUploadFileFields = [
    {
        name: 'xlsx'
    },
    {
        name: 'zip'
    }
    ];

// promisification
var readFileAsync = Promise.promisify(fs.readFile);
var parseAsync = Promise.promisify(parser);


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.route('/items')
    .get(function(req, res) {
        var params = {
            limit : 10
        };
        models['Item'].findAll(params)
            .then(sendResults);

        function sendResults(results) {
            res.json(results);
        }

});

router.route('/items/:item_id')
    .get(function (req, res) {
        models['Item'].findById(req.params.item_id)
            .then(sendResults);

        function sendResults(results) {
            res.json(results);
        }
    });

router.route('/changes')
    .post(upload.fields(changeUploadFileFields), function (req, res) {

        Promise.all(
            createChangeFromExcelFile(),
            saveImagesFromArchive()
        )
            .then(function(array) {
                res.json(array);
            })
            .catch(function (err) {
                res.json(err);
                throw err;
            });

        function createChangeFromExcelFile() {
            return parseAsync(req.files.xlsx[0].path)
                .then(function (parsedTable) {
                    return _.map(parsedTable, function (item) {
                        return {
                            code: item[0],
                            name: item[1]
                        }
                    });
                })
                .then(function (items) {
                    //deal with each item synchronously
                    return models['Item'].createFromList(items);
                })
                .then(function (items) {
                    return models['Change']
                        .create()
                        .then(function (change) {
                            return change.setItems(_.map(items, function (item) {
                                return item.item
                            }));
                        })
                });
        }
        function saveImagesFromArchive() {
            return readFileAsync(req.files.zip[0].path)
                .then(function (fileData) {
                    var zip = new JSZip(fileData);
                    return Promise.all(_.map(zip.files, function (file) {
                        return saveFileToDisk(file);
                    }))
                });

            function saveFileToDisk(file) {
                return new Promise(function(resolve, reject) {
                    if(!file.dir) {
                        var fileName = file.name.split('/');
                        fileName = fileName[fileName.length-1];
                        fs.writeFile("images/" + fileName, file.asNodeBuffer(), function(err) {
                            if (err) reject(err);
                            resolve(file);
                        });
                    }
                })

            }
        }
    })
    .get(function (req, res) {
        var params = {
            limit : 10,
            include: [{
                model: models['Item']
            }]
        };
        models['Change'].findAll(params)
            .then(sendResults);

        function sendResults(results) {
            res.json(results);
        }

    });

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
models.sequelize.sync()
    .then(function () {
        var server = app.listen(port);
        console.log('Magic happens on ' + server.address().address + port);
    });
