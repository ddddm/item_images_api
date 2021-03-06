'use strict';
var Promise = require('bluebird');
var StreamZip = require('node-stream-zip');
var _ = require('lodash');
var config = require('../config');
var path = require('path');
var fs = require('fs');
var lowercaseFileExtension = require('./lowercaseFileExtension');


function buildFilesHash(rawFiles) {
    var filesHash = {};

    _.each(rawFiles, function (file) {
        if(file.isDirectory) return;
        filesHash[path.basename(lowercaseFileExtension(file.name))] = file;
    });

    return filesHash;

}

module.exports = {
    parse: function(path) {
        return new Promise(function (resolve, reject) {
            var zip = new StreamZip({
                file: path,
                storeEntries: true
            });

            zip.on('error', function(err) {
                reject(err)
            });

            zip.on('entry', function(entry) {
                entry.stream = zip.stream;
            });

            zip.on('ready', function() {
                resolve(buildFilesHash(zip.entries()));
            });
        })
    },
    toDisk: function (item, fileStream) {
        var toDiskStream = fs.createWriteStream(
            path.join(config.IMAGE_FILE.ABS_PATH, item.image_file)
        );
        fileStream.pipe(toDiskStream);
    }

};