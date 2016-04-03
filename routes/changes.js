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

router.route('/changes')
    .post(
        upload.fields([{name: 'excel'}, {name: 'zip'}]),
        function (req, res) {

            var validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];

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
                        //

                        if(!item.valid) return invalidItems.push(item);


                        // Step 2:
                        // check this item has a corresponding
                        // image file attached

                        var entry, entryName;

                        if(zipEntries[item.image_file]) {
                            entry = zipEntries[item.image_file];
                            entryName = item.image_file;
                        }

                        // if the image doesn't have the exact name
                        // search for file using naming convention:
                        // item code + validExtension

                        _.each(validExtensions, function(ext) {
                            if(!entry && zipEntries[item.code + ext]) {
                                entry = zipEntries[item.code + ext];
                                entryName = item.code + ext;
                            }
                        });

                        if(!entry) {
                            return unusedItems.push(item);
                        }

                        item.image_file = entryName;


                        // Step 3: write corresponding file to disk
                        //

                        entry.stream(entry.name, function (err, stm) {
                            if(err) console.error('Error extracting stream for file: ' + entry.name);
                            zipEntriesParser.toDisk(item, stm);
                        });


                        // Step 4:
                        // delete files from zip entries
                        // to count unused images

                        if(
                            zipEntries[entryName] !== 'no-picture.jpg' &&
                            zipEntries[entryName] !== 'no-image.jpg'
                        ) {
                            // we used this item
                            delete zipEntries[entryName];
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
                            //result: {
                            //    unusedFiles: {total: unusedFiles.length, files: unusedFiles},
                            //    unusedItems: {total: unusedItems.length, items: unusedItems},
                            //    invalidItems: {total: invalidItems.length, items: invalidItems},
                            //    validItems: {total: validItems.length, items: validItems}
                            //}
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
            limit: 10,
            //include: [{
            //    model: models['Item']
            //}]
        };
        models['Change'].findAll(params)
            .then(function (change) {
                return res.json(
                    {
                        status:'ok',
                        result: change
                    }
                );
            })
            .catch(function (error) {
                process.nextTick(function() { throw error; });
                res.json({status: 'error'})
            });

    })


module.exports = router;