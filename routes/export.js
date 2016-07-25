'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var fs = require('fs');

var express = require('express');
var router = express.Router();
var multer = require('multer');

var upload = multer({dest: './uploads/'});
var excelParser = require('../services/excelParser');

var models = require('../models');
var Excel = require('exceljs');
var archiver = require('archiver');

var imageService = require('../services/imageService');
var imageExportTypes = require('../services/imageExportTypes');
var filenameWithoutExtension = require('../services/filenameWithoutExtension');



router.route('/export')
    .post(
    upload.fields([{name: 'excel'}]),
    function(req, res) {

        var size = imageExportTypes['web'].size;

        if(_.isEmpty(req.files)) {
            // handle situation where 1 or more files aint' attached to POST
            return res.json(
                {
                    status:'error',
                    message: 'Excel file must be attached to the request'
                }
            );
        }

        Promise.all([
            excelParser.parsePricelist(req.files.excel[0].path),
            imageService.cacheFolder(size)
        ]).
            spread(function (items) {
                // use Promise.map with "concurrency" to avoid gm errors,
                // processing only 30 images simultaneously
                return Promise.map(items, function (item) {
                    return models['Item'].findOne({where:{code:item.code}})
                }, {concurrency: 30})

            })
            .then(function (items) {
                items = _.compact(items);
                return Promise.all([
                    exportItemsToZip(items),
                    createExcelFile(items)
                ]);

            })
            .spread(function (zipFilename, excelFilename) {
                res.json({'status': 'ok', zip_filepath: zipFilename, excel_filepath: excelFilename})
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });

        function exportItemsToZip(items) {
            return new Promise(function (resolve, reject) {
                var _filename = filename();

                // create stream to write files into archive
                var archive = archiver('zip');
                // create disk stream to write archive
                var file = fs.createWriteStream(_filename);

                archive.pipe(file);

                file.on('close', function() {
                    // stream done writing the file
                    resolve(_filename)
                });

                archive.on('error', function(err) {
                    reject(err);
                });

                // use Promise.map with "concurrency" to avoid gm errors,
                // processing only 30 images simultaneously
                Promise.map(items, function (item) {
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
                    });

                function filename() {
                    var filename = '';
                    filename += "zip/";
                    filename += new Date().toString();
                    filename += "_";
                    filename += "export";
                    filename += ".zip";

                    return filename;
                }
            });
        }
        function createExcelFile(items) {
            var options = {
                useStyles: false,
                useSharedStrings: true
            };
            return new Promise(function (resolve, reject) {
                var filename = 'excels/' + new Date() + '_export.xlsx';
                var workbook = new Excel.stream.xlsx.WorkbookWriter(options);
                var file = fs.createWriteStream(filename);
                workbook.zip.pipe(file);
                var worksheet = workbook.addWorksheet("Sheet");

                worksheet.columns = [
                    { header: "Код", key: "code", width: 10 },
                    { header: "ТМЦ", key: "name", width: 32 },
                    { header: "Описание", key: "description", width: 32 },
                    { header: "Картинка", key: "image_file", width: 10 }
                ];

                _.each(items, function (item) {
                    worksheet.addRow({
                        code: item.code,
                        name: item.name,
                        description: item.description,
                        image_file: filenameWithoutExtension(item.image_file) + '.jpg'
                    }).commit();
                });

                resolve([worksheet, workbook, filename])
            })
                .spread(function (worksheet, workbook, filename) {
                    worksheet.commit();
                    workbook.commit();
                    return filename;
                })

        }
    });

module.exports = router;