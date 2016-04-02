var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var fs = require('fs');
var router = express.Router();

var models = require('../models');
var Excel = require('exceljs');
var archiver = require('archiver');

var imageService = require('../services/imageService');

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

        var type = req.params.type;


        var params = {
            include: [{
                model: models['Item']
            }]
        };
        models['Change'].findById(req.params.change_id, params)
            .then(function (change) {
                return Promise.all([
                    change,
                    Promise.all(_.map(change.Items, function (item) {
                        return imageService.jpg(item.image_file, {width: 100, height: 100});
                    }))
                ]);
            })
            .spread(function (change, files) {
                var archive = archiver('zip');
                var changeZip = fs.createWriteStream("zip/" + change.id + ".zip");

                archive.pipe(changeZip);
                _.each(files, function (file) {
                    archive.file(file.path, { name: file.filename });

                });
                archive.finalize();

            })
            .then(function () {
                res.json({'status': 'ok'})
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });

    });

module.exports = router;