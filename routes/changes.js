var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var router = express.Router();

var multer = require('multer');
var upload = multer({dest: '../uploads/'});

var excelParser = require('../services/excelParser');
var zipEntriesParser = require('../services/zipEntriesParser');

router.route('/changes')
    .post(
        upload.fields([{name: 'excel'}, {name: 'zip'}]),
        function (req, res) {

            if(_.isEmpty(req.files)) {
                // handle situation where 1 or more files aint' attached to POST
            }

            Promise.all([
                excelParser.parse(req.files.excel[0].path),
                zipEntriesParser.parse(req.files.zip[0].path)
            ])
                .spread(function (items, zipEntries) {
                    _.each(items, function (item) {

                    });
                    return res.json([zipEntries,items]);
                })
                .catch(function (error) {
                    throw error;
                });
        });

module.exports = router;