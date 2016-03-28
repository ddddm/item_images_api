'use strict';

var Promise = require('bluebird');
var gm = require('gm');
var fs = Promise.promisifyAll(require('fs'));

var imageFolder = 'images/';
var cacheFolder = 'cache/';

module.exports = {
    jpg: function (fileName, size) {

        var normalizedSizeObject = normalizeSizeObject(size);
        var outputFormat = 'jpg';
        var path;

        var shoudBeResized = !!(normalizedSizeObject.width || normalizedSizeObject.height);

        // if should be resized:
        // 1. check cache size folder
        // 2. check cached file
        // 3. create new one if needed

        // if shoudnt be resized
        // 1. check cached file
        // 2. create new one if needed

        var fileNameJpg = fileName.split('.');
        fileNameJpg.length = fileNameJpg.length - 1;
        fileNameJpg = fileNameJpg.join('.') + '.' + outputFormat;

        var sourcePath = imageFolder + fileName;

        path = cacheFolder; // 'cached/'
        if(shoudBeResized) {
            path +=  getCacheFolderName(normalizedSizeObject); // 'cached/100x100
        }
        path += '/' + fileNameJpg;

        // check cached file
        return fs.statAsync(path)
            .then(function () {
                return fs.readFileAsync(path)
            })
            .catch(function () {
                // cached file doesnt exist
                console.log('ImageServer:File ' + path + ' didnt existed');
                if(shoudBeResized) {
                    // check if cache folder for this size exists
                    return fs.statAsync(cacheFolder + getCacheFolderName(normalizedSizeObject))
                        .catch(function () {
                            // cache folder doesnt exists, creating
                            console.log('ImageServer: folder didnt existed, created' + cacheFolder + size);
                            return fs.mkdirAsync(cacheFolder + getCacheFolderName(normalizedSizeObject))
                        })
                        .then(function () {
                            // creating the missing cached image
                            return create(sourcePath, path, normalizedSizeObject)
                                .then(function () {
                                    console.log('ImageServer:File ' + path + ' didnt existed, created')
                                })
                        })
                }
                // creating the missing cached image
                return create(sourcePath, path, normalizedSizeObject)
                    .then(function () {
                        console.log('ImageServer:File ' + path + ' didnt existed, created')
                    })
            })
            .then(function () {
                return fs.readFileAsync(path)
            });

        function create(originalPath, jpgPath, size) {
            return new Promise(function (resolve, reject) {
                gm(originalPath)
                    .setFormat(outputFormat)
                    .resize(size.width, size.height, '>')
                    .write(jpgPath, function (err) {
                        if (err) return reject(err);
                        return resolve();
                    })

            })
        }
    }
};
function normalizeSizeObject(size) {
    return {
        width: size && size.width? parseInt(size.width) : null,
        height: size && size.height? parseInt(size.height) : null
    }
}

function getCacheFolderName(size) {

    var width = size.width? size.width : "";
    var height = size.height? size.height : "";

    return width + 'x' + height;
}
function parseImageSize(size) {
    if(!size) return null;

    var splited = size.split('x');

    // @example size = '100x', 'x600', '120x120'

    var width = splited[0] !== ''? parseInt(splited[0]) : null;
    var height = splited[1] !== ''? parseInt(splited[1]) : null;

    return {
        width: width,
        height: height
    }
}