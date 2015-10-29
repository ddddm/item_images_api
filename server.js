// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var Qs = require('qs');
var _ = require('lodash');
var Promise = require('bluebird');
var parser = require('excel');
var multer  = require('multer')
var upload = multer({ dest: './uploads/'});

var models = require('./models');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use(multer({ dest: './uploads/'}));

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
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
    .post(upload.single('xlsx'), function (req, res) {

        var parserAsync = Promise.promisify(parser);
        parserAsync(req.file.path)
            .then(function (result) {
                res.json(result);
            })
        //models['Change']
        //    .create()
        //    .then(function (change) {
        //        Promise.all(
        //            _.map(items, function (item) {
        //            return models['Item'].findAll({
        //                where: {code: item}
        //            })
        //                .then(function (item) {
        //                     return change.addItem(item);
        //                })
        //        })
        //        )
        //    })
        //    .then(function (smth) {
        //        res.ok(smth)
        //    })

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
