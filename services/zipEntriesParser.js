'use strict';
var Promise = require('bluebird');
var StreamZip = require('node-stream-zip');
var _ = require('lodash');

function buildFilesHash(rawFiles) {
    var filesHash = {};

    _.each(rawFiles, function (file) {
        if(file.isDirectory) return;
        filesHash[normalizeFilename(file.name)] = file;
    });

    return filesHash;

}

function normalizeFilename(filename) {
    if(!filename) return null;

    var _filename, extension;
    var array = filename.split('/');

    _filename = array[array.length - 1];
    array = _filename.split('.');
    extension = _.toLower(array[array.length - 1]);

    array[array.length - 1] = extension;

    return array.join('.');
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