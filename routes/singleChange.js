var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var fs = require('fs');
var router = express.Router();

var models = require('../models');
var Excel = require('exceljs');

router.route('/changes/:change_id')
    .get(function (req, res) {
        var params = {
            include: [{
                model: models['Item']
            }]
        };

        models['Change'].findById(req.params.change_id, params)
            .then(function (change) {
                res.json({status: 'ok', result: change})
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });
    });

router.route('/changes/:change_id/excel')
    .get(function (req, res) {
        var options = {
            useStyles: false,
            useSharedStrings: true
        };

        var params = {
            include: [{
                model: models['Item']
            }]
        };

        models['Change'].findById(req.params.change_id, params)
            .then(function (change) {
                var workbook = new Excel.stream.xlsx.WorkbookWriter(options);
                var file = fs.createWriteStream('excels/' + change.id + '.xlsx');
                workbook.zip.pipe(file);
                var worksheet = workbook.addWorksheet("Sheet");

                worksheet.columns = [
                    { header: "Код", key: "code", width: 10 },
                    { header: "ТМЦ", key: "name", width: 32 },
                    { header: "Описание", key: "description", width: 32 },
                    { header: "Картинка", key: "image_file", width: 10 }
                ];

                _.each(change.Items, function (item) {
                    worksheet.addRow({
                        code: item.code,
                        name: item.name,
                        description: item.description,
                        image_file: item.image_file
                    }).commit();
                });

                return [workbook, worksheet]

            })
            .spread(function (workbook, worksheet) {
                worksheet.commit();
                workbook.commit();
                res.json({status: 'ok'})
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });
    });

router.route('/changes/:change_id/zip')
    .get(function (req, res) {
        res.json({'status': 'ok'})
    });

module.exports = router;