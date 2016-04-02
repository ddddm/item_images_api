var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var fs = require('fs');
var router = express.Router();

var models = require('../models');
var Excel = require('exceljs');
var archiver = require('archiver');

var imageService = require('../services/imageService');
var imageExportTypes = require('../services/imageExportTypes');

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

                return [workbook, worksheet, 'excels/' + change.id + '.xlsx']

            })
            .spread(function (workbook, worksheet, filename) {
                worksheet.commit();
                workbook.commit();
                res.json({status: 'ok', filename: filename})
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });
    });

router.route('/changes/:change_id/zip')
    .get(function (req, res) {

        var type = req.query.type;
        var size = imageExportTypes[type]? imageExportTypes[type].size: imageExportTypes['pricelist'].size;

        var params = {
            include: [{
                model: models['Item']
            }]
        };
        Promise.all([
            models['Change'].findById(req.params.change_id, params),
            imageService.cacheFolder(size)
        ])
            .spread(function (change) {
                return new Promise(function (resolve, reject) {
                    // create stream to write files into archive
                    var archive = archiver('zip');
                    // create disk stream to write archive
                    var file = fs.createWriteStream("zip/" + change.id + ".zip");

                    archive.pipe(file);

                    file.on('close', function() {
                        // stream done writing the file
                        resolve("zip/" + change.id + ".zip")
                    });

                    archive.on('error', function(err) {
                        reject(err);
                    });

                    // use Promise.map with "concurrency" to avoid gm errors,
                    // processing only 30 images simultaneously
                    Promise.map(change.Items, function (item) {
                        return imageService.jpg(item.image_file, size)
                            //adding to achive queue
                            .then(function (file) {
                                return archive.file(file.path, { name: file.filename });
                            });
                    }, {concurrency: 30})
                        // all images added to queue!
                        // close the queue
                        .then(function () {
                            archive.finalize();
                        })
                });
            })
            .then(function (filepath) {
                res.json({'status': 'ok', filepath: filepath})
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });

    });

module.exports = router;