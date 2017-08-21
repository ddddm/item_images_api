var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var router = express.Router();

var excelParser = require('../services/excelParser');
var zipEntriesParser = require('../services/zipEntriesParser');
var changeService = require('../services/changeService');

var models = require('../models');

router.route('/changes')
    .post(
        function (req, res) {

            if(_.isEmpty(req.files) || _.isEmpty(req.files.excel) || _.isEmpty(req.files.zip)) {
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

                        // Step 3: write corresponding file to disk
                        image.entry.stream(image.entry.name, function (err, stm) {
                            if(err) console.error('Error extracting stream for file: ' + image.entry.name);
                            zipEntriesParser.toDisk(item, stm);
                        });

                        // Step 4:
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
                    // create new Change
                    return changeService.createFromItems(validItems);
                })
                .then(function (change) {
                    return res.json(
                        {
                            status:'ok',
                            changeId: change.get().id,
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
    )
     .get(function (req, res) {
        var params = {
            //limit: 20,
        };
        models['Change'].findAll(params)
            .then(function (changes) {
                return Promise.map(changes, function (change) {
                    return change.countItems()
                        .then(function (itemCount) {
                            return _.assign({}, change.get(), {
                                itemCount: itemCount
                            });
                        })
                })
            })
            .then(function (changes) {
                return res.json(
                    {
                        status:'ok',
                        result: changes
                    }
                );
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });

    });


module.exports = router;