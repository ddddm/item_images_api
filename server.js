// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var fs        = require("fs");
var bodyParser = require('body-parser');
var Qs = require('qs');
var _ = require('lodash');
var Promise = require('bluebird');
var multer  = require('multer');
var JSZip = require("jszip");
var upload = multer({ dest: './uploads/'});

var models = require('./models');
var StatisticsService = require('./services/StatisticsService');
var excelService = require('./services/excelService');
var archiveFileService = require('./services/archiveFileService');
var changeService = require('./services/changeService');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8090;        // set our port

var changeUploadFileFields = [
    { name: 'xlsx' },
    { name: 'zip'  }];

// promisification
var readFileAsync = Promise.promisify(fs.readFile);
var reddirPromised = Promise.promisify(fs.readdir);


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
        var stats = {};

        Promise.all([
          excelService.parse(req.files.xlsx[0].path),
          archiveFileService.listFiles(req.files.zip[0].path)
        ])
            .spread(function(items, files) {
              // construct single array of items
              // which has corresponding files

                var change = _.map(items, function (item) {
                  var constructedItem = excelService.createItemObject(item);
                  var file = _.find(files, function(file) {
                    return archiveFileService.codeFromFilename(file.name) == constructedItem.code
                  })
                  // file === undefiend - if we have no file
                  constructedItem.file = file;
                  return constructedItem;
                })
                return change;
            })
            .then(function(change) {
              // save images to disk
              // ONLY images that has corresponding items
              var filePromises = [],
                  filteredItems = []
              _.each(change, function(item) {
                if(item.file) {
                  console.log('counter. Bazzinga!');
                    filteredItems.push(item);
                    filePromises.push(
                      archiveFileService.saveFile(item.file)
                    )
                }
              })
              console.log("Preparing the launch, capitan.");
              console.log("We got " + filteredItems.length + " filtered items, " + filePromises.length + " file promises.");
              return Promise.all([
                filteredItems,
                changeService.createFromItems(filteredItems),
                Promise.all(filePromises)
              ])

            })
            .spread(function(change) {
              // TODO: gather stats about unused images and
              // TODO: items without image
              _.each(change, function(item) {
                if(item.file) {
                  item.file = { name: item.file.name }
                }
              })
              return res.json(change);
            })
            .catch(function (err) {
                res.json(err);
                throw err;
            });
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
router.route('/changes/:change_id')
    .get(function (req, res) {
      var productCodes = [];
        models['Change'].findById(req.params.change_id, {
            include: [{
                model: models['Item']
            }]
        })
            .then(function(change) {
              var results = [];
              _.each(change.Items, function(item) {
                results.push(item.code);
              })
              return results;
            })
            .then(function(codes) {
              // return reddirPromised('images/')
              var promise = reddirPromised('images/');
              return Promise.all([
                codes,
                reddirPromised('images/')
              ])
            })
            .then(function(array) {
              var searchResults = [];
              _.each(array[0], function(code) {
                var result = _.find(array[1], function(file) {
                  return _.startsWith(file, code);
                })
                if(result) {
                  searchResults.push({
                    code: code,
                    fileName: result
                  })
                }
              })
              return searchResults;
            })
            .then(function(searchResults) {
              productCodes = searchResults;
              return Promise.map(searchResults, function(result) {
                return readFileAsync('images/' + result.fileName);
              })
            })
            .then(function(files) {
              var zip = new JSZip();
              for(var i=0;i<productCodes.length;i++) {
                zip.file(
                   productCodes[i].fileName + '.jpg', "Hello World\n");
              }
            })
            .then(sendResults);

        function sendResults(results) {
            res.json(results);
        }
    });
router.route('/test')
    .get(function(req, res) {
      // fs.readdir('images/', function(err, files) {
      //   if (err) return console.log(err);
      //   res.json(files);
      // })

    })

app.use('/api', router);

// START THE SERVER
// =============================================================================
models.sequelize.sync()
    .then(function () {
        var server = app.listen(port);
        console.log('Magic happens on ' + server.address().address + port);
    });
