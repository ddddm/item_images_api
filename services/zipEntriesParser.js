'use strict';
var Promise = require('bluebird');
var StreamZip = require('node-stream-zip');
var _ = require('lodash');
var path = require('path');
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
    parse: function(fileName) {
        return new Promise(function (resolve, reject) {
            var zip = new StreamZip({
                file: fileName,
                storeEntries: true
            });

            zip.on('error', function(err) {
                reject(err)
            });

            zip.on('ready', function() {
                console.log('Entries read: ' + _.size(zip.entries()));
                resolve(buildFilesHash(zip.entries()));
            });
        })
    }

};