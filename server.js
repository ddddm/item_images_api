var Promise = require('bluebird');
var express = require('express');
var app = express();

// replace real fs module globally
var realFs = require('fs');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

var fs = Promise.promisifyAll(require("fs"));
var bodyParser = require('body-parser');
var Qs = require('qs');
var _ = require('lodash');

var multer = require('multer');
var JSZip = require("jszip");
var upload = multer({dest: './uploads/'});

var models = require('./models');
var StatisticsService = require('./services/StatisticsService');
var changeMetaService = require('./services/excelParser');
var changeImagesService = require('./services/changeImagesService');
var changeService = require('./services/changeService');
var imageService = require('./services/imageService');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var changeUploadFileFields = [
    {name: 'xlsx'},
    {name: 'zip'}
];

// router
// item
// -- GET item?filters=f
// -- GET item/:id/
// -- POST item
// change
// -- GET change?filters=f
// -- GET change/:id
// -- POST item

var router = express.Router();

router.route('/items')
    .get(function (req, res) {
        var params = {
            limit: 10
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
            .then(res.json);
    });

router.route('/changes')
    .post(upload.fields(changeUploadFileFields), function (req, res) {
        var stats = {
            unusedItems: {
                items: []
            }
        };

        Promise.all([
            changeMetaService.parse(req.files.xlsx[0].path),
            changeImagesService.listFiles(req.files.zip[0].path)
        ])
            .spread(function (items, files) {
                // construct single array of items
                // which has corresponding files
                var change = _.map(items, function (item) {
                    // TODO: extract knowledge about excel structure to changeMetaService
                    // with defaultOptions and overwriteable GET params
                    var constructedItem = changeMetaService.createItemObject(item);
                    // file === undefiend - if we have no file
                    constructedItem.file = _.find(files, function (file) {
                        return file.name === item.image_file ||
                            changeImagesService.codeFromFilename(file.name) == constructedItem.code
                    });
                    return constructedItem;
                })
                return change;
            })
            .then(function (change) {
                // save images to disk
                // ONLY images that has corresponding items
                var filePromises = [],
                    filteredItems = [];

                _.each(change, function (item) {
                    if (item.file) {
                        filteredItems.push(item);
                        filePromises.push(
                            changeImagesService.saveFile(item.file)
                        )
                    } else {
                        stats.unusedItems.items.push(item)
                    }
                });

                return Promise.all([
                    filteredItems,
                    changeService.createFromItems(filteredItems),
                    Promise.all(filePromises)
                ])

            })
            .spread(function (change) {
                // TODO: gather stats about unused images
                _.each(change, function (item) {
                    if (item.file) {
                        item.file = {name: item.file.name}
                    }
                })
                // stats
                stats.unusedItems.results = stats.unusedItems.length;
                return res.json({
                    change: change,
                    stats: stats
                });
            })
            .catch(function (err) {
                res.json(err);
                throw err;
            });
    })
    .get(function (req, res) {
        var params = {
            limit: 10,
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
router.route('/changes/:change_id')
    .get(function (req, res) {
        var _change,
            _archive = new JSZip(),
            imageSize = '100x';

        // load Change from database
        models['Change'].findById(req.params.change_id, {
            include: [{
                model: models['Item']
            }]
        })

            // create promises for each image file of Change item
            .then(function (change) {
                _change = change;
                return Promise.map(change.Items, function (item) {
                    return imageService.jpg(item.image_file, imageSize)
                        .then(function (fileContent) {
                            return _archive.file(item.image_file, fileContent);
                        })
                })
            })

            // generate archive and save it
            .then(function (files) {
                var buffer = _archive.generate({type: "nodebuffer"});
                return fs.writeFileAsync("change_id" + _change.id + ".zip", buffer)
            })

            .then(function () {
                // generate xlsx
            })

            // end request
            .then(function () {
                return res.json({
                    change: _change,
                    archive: "change_id" + _change.id + ".zip"
                })
            });
    });
router.route('/image/')
    .get(function (req, res) {
        imageService.jpg(req.params.filename, req.params.size)
            .then(function (res1) {
                return res.json(res1);
            })


    });

router.route('/test')
    .get(function (req, res) {

            //return imageService.jpg('57752.jpg', {
            //    width: null,
            //    height: null
            //})
        return imageService.jpg('57752.jpg')
                .then(function (content) {
                    res.json(content)
                });

    });

app.use('/api/', router);
app.use('/api/v2/', require('./routes/changes'));
app.use('/api/v2/', require('./routes/singleChange'));
app.use('/api/v2/', require('./routes/checkChange'));

// START THE SERVER
// =============================================================================
models.sequelize.sync()
    .then(function () {
        var server = app.listen(8090);
        console.log('Magic happens on ' + server.address().address + 8090);
    });
