var Promise = require('bluebird');
var _ = require('lodash');
var moment = require('moment');
var express = require('express');
var router = express.Router();
var xl = require('excel4node');

var multer = require('multer');
var upload = multer({dest: './uploads/'});

var excelParser = require('../services/excelParser');

var models = require('../models');

router.route('/changes/task/')
    .post(
    upload.fields([{name: 'excel'}]),
    function (req, res) {

        var validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];

        if(_.isEmpty(req.files)) {
            // handle situation where 1 or more files aint' attached to POST
            return res.json(
                {
                    status:'error',
                    message: 'Excel file must be attached to the request'
                }
            );
        }

        excelParser.parsePricelist(req.files.excel[0].path)
            .then(function (items) {
                var itemsHash = _.keyBy(items, function (item) {
                        return item.code;
                });
                return [
                    itemsHash,
                    Promise.props(
                        _.mapValues(itemsHash, function(item) {
                            return models['Item'].findOne({ where: {code: item.code} });
                        })
                    )
                ];
            })
            .spread(function(items, foundItems) {

                var fileName = moment().format('MM-DD-YYYY_kk-mm');

                return new Promise(function (resolve, reject) {
                    _.forIn(items, function (item) {
                        if(foundItems[item.code]) {
                            item.exits = true;
                        }
                    });

                    var wb = new xl.WorkBook();
                    var ws = wb.WorkSheet('Sheet');
                    var i = 2;

                    ws.Cell(1, 1).String('Код');
                    ws.Cell(1, 2).String("ТМЦ");
                    ws.Cell(1, 3).String("Описание");
                    ws.Cell(1, 4).String("Картинка");
                    ws.Cell(1, 5).String("В базе");

                    _.forIn(items, function (item) {
                        ws.Cell(i, 1).String(item.code.toString());
                        ws.Cell(i, 2).String(item.name);
                        ws.Cell(i, 3).String(item.description);
                        ws.Cell(i, 4).String(item.image_file);
                        ws.Cell(i, 5).String(foundItems[item.code] ? 'true' : 'false');

                        i++;
                    });

                    wb.write('excels/task' + fileName + '.xlsx', function (err) {
                        // done writing
                        if(err) reject(err);
                        resolve('excels/task' + fileName + '.xlsx');

                    });
                });
            })
            .then(function (filename) {

                res.json({
                    status: 'ok',
                    filename: filename
                })
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });
    }
);

module.exports = router;