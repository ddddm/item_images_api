var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var router = express.Router();
var Excel = require('exceljs');
var fs = require('fs');
var jsesc = require('jsesc');
var xl = require('excel4node');

var multer = require('multer');
var upload = multer({dest: './uploads/'});

var excelParser = require('../services/excelParser');
var zipEntriesParser = require('../services/zipEntriesParser');
var changeService = require('../services/changeService');
var filenameWithoutExtension = require('../services/filenameWithoutExtension');

var models = require('../models');

router.route('/change-task/')
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

        var unusedFiles = [],
            unusedItems = [],
            invalidItems = [],
            validItems = [];

        //Promise.all([
        excelParser.parseRaw(req.files.excel[0].path)
        //])
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
                var options = {
                    useStyles: false,
                    useSharedStrings: false
                };
                var date = '1';

                _.forIn(items, function (item) {
                    if(foundItems[item.code]) {
                        item.exits = true;
                    }
                });

                console.log('Items', _.size(items));

                var workbook = new Excel.stream.xlsx.WorkbookWriter(options);
                var file = fs.createWriteStream('excels/task' + date + '.xlsx');
                workbook.zip.pipe(file);
                var worksheet = workbook.addWorksheet("Sheet");

                worksheet.columns = [
                    { header: "Код", key: "code", width: 10 },
                    { header: "ТМЦ", key: "name", width: 32 },
                    { header: "Описание", key: "description", width: 32 },
                    { header: "Картинка", key: "image_file", width: 10 },
                    { header: "В базе", key: "exits", width: 10 }
                ];

                _.forIn(items, function (item) {
                    //if(item.code == 58282) {
                    //    //console.log(1,item);
                    //    //item.name = item.name.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '')
                    //
                    //    //item.name = item.name.replace('(', ' error ');
                    //    //item.name = item.name.replace(')', ' error ');
                    //    //item.name = item.name.replace('+', ' error ');
                    //    //console.log(2,item);
                    //    worksheet.addRow({
                    //        code: item.code,
                    //        name: item.name.toString(),
                    //        description: item.description.toString(),
                    //        image_file: item.image_file,
                    //        exits: foundItems[item.code]? 'true': 'false'
                    //    }).commit();
                    //} else {
                        worksheet.addRow({
                            code: item.code,
                            name: item.name.toString(),
                            description: item.description.toString(),
                            image_file: item.image_file,
                            exits: foundItems[item.code] ? 'true' : 'false'
                        }).commit();
                    //}
                });
                return [workbook, worksheet, 'excels/task' + date + '.xlsx'];
            })
            .spread(function (workbook, worksheet, filename) {
                worksheet.commit();
                workbook.commit();

                res.json({
                    status: 'ok',
                    filename: filename
                })
            })
            //.then(function () {
            //    return res.json(
            //        {
            //            status:'ok',
            //            stats: {
            //                unusedFiles: unusedFiles.length,
            //                unusedItems: unusedItems.length,
            //                invalidItems: invalidItems.length,
            //                validItems: validItems.length
            //            },
            //            result: {
            //                unusedFiles: {
            //                    total: unusedFiles.length,
            //                    files: _.map(unusedFiles, function(file) {
            //                        return file.name;
            //                    })
            //                },
            //                unusedItems: {
            //                    total: unusedItems.length,
            //                    items: _.map(unusedItems, function (item) {
            //                        return item.code + ', ' + item.image_file;
            //                    })
            //                },
            //                invalidItems: {
            //                    total: invalidItems.length,
            //                    items:  _.map(invalidItems, function (item) {
            //                        return item.code + ', ' + item.image_file;
            //                    })}
            //                //validItems: {total: validItems.length, items: validItems}
            //            }
            //            //https://jsbin.com/fesuduzavo/edit?html,js,console,output
            //        }
            //    );
            //})
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });
    }
);

module.exports = router;