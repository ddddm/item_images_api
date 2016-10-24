var Promise = require('bluebird');
var _ = require('lodash');
var moment = require('moment');
var express = require('express');
var router = express.Router();
var xl = require('excel4node');

var multer = require('multer');
var upload = multer({dest: './uploads/'});

var excelParser = require('../services/excelParser');
var config = require('../config');

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

                var fileName = [
                    'task',
                    moment().format('MM-DD-YYYY_kk-mm'),
                    'xlsx'
                ].join('.');

                var absFilePath = path.join(
                    config.CHANGE_TASK_EXCEL_FILE.ABS_PATH,
                    fileName
                );

                var relFilePath = path.join(
                    config.CHANGE_TASK_EXCEL_FILE.LOCAL_PATH,
                    fileName
                );

                return new Promise(function (resolve, reject) {

                    var wb = new xl.WorkBook();
                    var ws = wb.WorkSheet('Sheet');
                    var i = 2;

                    ws.Cell(1, 1).String('Код');
                    ws.Cell(1, 2).String("ТМЦ");
                    ws.Cell(1, 3).String("Описание");
                    ws.Cell(1, 4).String("Картинка");
                    ws.Cell(1, 5).String("В базе");
                    ws.Cell(1, 6).String("В базе - картинка");

                    _.forIn(items, function (item) {
                        ws.Cell(i, 1).String(item.code.toString());
                        ws.Cell(i, 2).String(item.name);
                        ws.Cell(i, 3).String(item.description? item.description : '');

                        if(item.image_file) {
                            ws.Cell(i, 4).String(item.image_file);
                        }

                        ws.Cell(i, 5).String(foundItems[item.code] ? 'true' : 'false');
                        ws.Cell(i, 6).String(foundItems[item.code] && foundItems[item.code].image_file ? foundItems[item.code].image_file : '');

                        i++;
                    });

                    wb.write(absFilePath, function (err) {
                        // done writing
                        if(err) reject(err);
                        resolve(relFilePath);

                    });
                });
            })
            .then(function (downloadPath) {

                res.json({
                    status: 'ok',
                    file_path: downloadPath
                })
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });
    }
);

module.exports = router;