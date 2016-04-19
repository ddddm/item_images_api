var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var router = express.Router();

var multer = require('multer');
var upload = multer({dest: './uploads/'});

var excelParser = require('../services/excelParser');
var zipEntriesParser = require('../services/zipEntriesParser');
var changeService = require('../services/changeService');
var filenameWithoutExtension = require('../services/filenameWithoutExtension');

var models = require('../models');

router.route('/changes/check')
    .post(
    upload.fields([{name: 'excel'}, {name: 'zip'}]),
    function (req, res) {

        if(_.isEmpty(req.files)) {
            // handle situation where 1 or more files aint' attached to POST
            return res.json(
                {
                    status:'error',
                    message: 'Both zip and excel files must be attached to the request'
                }
            );
        }

        var unusedFiles = [],
            unusedItems = [],
            invalidItems = [],
            validItems = [];

        Promise.all([
            excelParser.parse(req.files.excel[0].path),
            zipEntriesParser.parse(req.files.zip[0].path)
        ])
            .spread(function (items, zipEntries) {
                _.each(items, function processItem(item) {
                    // Step 1: check this item is valid
                    if(!item.valid) return invalidItems.push(item);

                    // Step 2:
                    // check this item has a corresponding
                    // image file attached
                    var image = changeService.findImage(item, zipEntries);

                    if(!image) {
                        return unusedItems.push(item);
                    }

                    item.image_file = image.name;
                    
                    // Step 3:
                    // delete files from zip entries
                    // to count unused images
                    if(
                        image.name !== 'no-picture.jpg' &&
                        image.name !== 'no-image.jpg'
                    ) {
                        // we used this item
                        delete zipEntries[image.name];
                    }

                    // store item for database insertion
                    return validItems.push(item);
                });

                // do not need them any more
                delete zipEntries['no-picture.jpg'];
                delete zipEntries['no-image.jpg'];

                // convert to array
                unusedFiles = _.values(zipEntries);
            })
            .then(function () {
                return res.json(
                    {
                        status:'ok',
                        stats: {
                            unusedFiles: unusedFiles.length,
                            unusedItems: unusedItems.length,
                            invalidItems: invalidItems.length,
                            validItems: validItems.length
                        },
                        result: {
                            unusedFiles: {
                                total: unusedFiles.length,
                                files: _.map(unusedFiles, function(file) {
                                    return file.name;
                                })
                            },
                            unusedItems: {
                                total: unusedItems.length,
                                items: _.map(unusedItems, function (item) {
                                    return item.code + ', ' + item.image_file;
                                })
                            },
                            invalidItems: {
                                total: invalidItems.length,
                                items:  _.map(invalidItems, function (item) {
                                    return item.code + ', ' + item.image_file;
                                })}
                            //validItems: {total: validItems.length, items: validItems}
                        }
                        //https://jsbin.com/fesuduzavo/edit?html,js,console,output
                    }
                );
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });
    }
);

module.exports = router;