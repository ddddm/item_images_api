var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var router = express.Router();

var multer = require('multer');
var upload = multer({dest: '../uploads/'});

var excelParser = require('../services/excelParser');
var zipEntriesParser = require('../services/zipEntriesParser');
var changeService = require('../services/changeService');

var models = require('../models');

router.route('/changes')
    .post(
        upload.fields([{name: 'excel'}, {name: 'zip'}]),
        function (req, res) {

            if(_.isEmpty(req.files)) {
                // handle situation where 1 or more files aint' attached to POST
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

                    _.each(items, processItem);

                    function processItem(item) {

                        if(!item.valid) return invalidItems.push(item);

                        // no image for this item
                        if(!zipEntries[item.image_file]) {
                            return unusedItems.push(item);
                        }

                        // write file to disk
                        var entry = zipEntries[item.image_file];
                        entry.stream(entry.name, function (err, stm) {
                            if(err) console.error('Error extracting stream for file: ' + entry.name);
                            zipEntriesParser.toDisk(item, stm);

                            // we used this item
                            delete zipEntries[item.image_file];
                        });

                        // store item for database insertion
                        return validItems.push(item);
                    }
                    // convert to array
                    unusedFiles = _.values(zipEntries);
                })
                .then(function () {
                    // create new Change
                    return changeService.createFromItems(validItems);
                })
                .then(function () {

                })
                .then(function () {
                    return res.json(
                        {
                            status:'ok',
                            result: {
                                unusedFiles: unusedFiles,
                                unusedItems: unusedItems,
                                invalidItems: invalidItems,
                                validItems: validItems
                            }
                        }
                    );
                })
                .catch(function (error) {
                    process.nextTick(function() { throw error; });
                    res.json({status: 'error'})
                });
        });

module.exports = router;