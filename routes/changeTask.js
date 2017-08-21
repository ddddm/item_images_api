var Promise = require('bluebird');
var _ = require('lodash');
var debug = require('debug')
var moment = require('moment');
var express = require('express');
var router = express.Router();
var xl = require('excel4node');
var path = require('path');

var multer = require('multer');
var upload = multer({dest: './uploads/'});

var excelParser = require('../services/excelParser');
var config = require('../config');

var models = require('../models');

var logger = debug('vitekApi:createTask')

router.route('/changes/task/')
    .post(
    function (req, res) {

        const files = req.files.excel;

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

        logger(`Got ${files.length} files from request`);

        Promise.all(
            files.map((file) => {
                return excelParser.parseAutodetectHeaders(file.path)
            })
        )
            .then( pricelists => {
                logger(`Pricelists are parsed.`)
                logger(`There are ${pricelists.length} price lists`);

                let items = [];

                _.each(pricelists, pricelist => {
                    items = _.unionBy(items, pricelist, item => item.code)
                })

                return items
            })
            .then(function (items) {

                logger(`Got ${items.length} items after union`)

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
            .spread(function(items, foundedItems) {

                items = _.filter(items, (item) => foundedItems[item.code] === null)

                logger(`${items.length} items are not found in the database`);
                
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

                    ws.Cell(1, 1).String('code');
                    ws.Cell(1, 2).String("name");
                    ws.Cell(1, 3).String("description");
                    ws.Cell(1, 5).String("image_file");

                    _.each(
                        items,
                        function (item) {
                            var thisItem = item;
                            ws.Cell(i, 1).String(thisItem.code.toString());
                            ws.Cell(i, 2).String(thisItem.name);
                            ws.Cell(i, 3).String(thisItem.description? thisItem.description : '');
                            i++;
                    });

                    wb.write(absFilePath, function (err) {
                        // done writing
                        if(err) reject(err);
                        resolve([relFilePath, items]);

                    });
                });
            })
            .spread(function (downloadPath, notFoundedItems) {

                res.json({
                    status: 'ok',
                    file_path: downloadPath,
                    result: notFoundedItems
                })
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });
    }
);

module.exports = router;