'use strict';

var Promise = require('bluebird');
var gm = require('gm');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
const config = require(path.resolve(__dirname, '../config'));

var cacheFolder = 'cache/';

const self = {
    jpg: function (fileName, size) {

        var normalizedSizeObject = normalizeSizeObject(size);
        var outputFormat = 'jpg';
        var filePath;

        var shoudBeResized = !!(normalizedSizeObject.width || normalizedSizeObject.height);
        const isPlaceholder = fileName === self.placeholderImage;

        // if should be resized:
        // 1. check cache size folder
        // 2. check cached file
        // 3. create new one if needed

        // if shoudnt be resized
        // 1. check cached file
        // 2. create new one if needed


        // construct filename from original, replacing the extension
        var fileNameJpg = fileName.split('.');
        fileNameJpg.length = fileNameJpg.length - 1;
        fileNameJpg = fileNameJpg.join('.') + '.' + outputFormat;

        // construct source filePath
        var sourcePath = path.join(
            isPlaceholder ? config.PLACEHOLDER_IMAGE : config.IMAGE_FILE.ABS_PATH,
            fileName
        );

        // construct cached filePath
        filePath = config.IMAGE_CACHE_FILE.ABS_PATH;
        if(shoudBeResized) {
            filePath =  path.join(
                filePath,
                getCacheFolderName(normalizedSizeObject)
            ); // 'cached/100x100
        }
        filePath = path.join(filePath, fileNameJpg);

        // check cached file
        return fs.statAsync(filePath)
            .catch(function () {
                // cached file doesnt exist
                // creating the missing cached image
                return create(sourcePath, filePath, normalizedSizeObject)
            })
            .then(function () {
                return {
                    filename: fileNameJpg,
                    path: filePath
                };
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
    },
    cacheFolder: function (size) {
        var normalizedSizeObject = normalizeSizeObject(size);

        return fs.statAsync(
            path.join(
                config.IMAGE_CACHE_FILE.ABS_PATH,
                getCacheFolderName(normalizedSizeObject)
            )
        )
            .catch(function () {

                // cache folder doesnt exists, creating
                console.log(
                    'ImageServer: folder didnt existed, created',
                    path.join(
                        cacheFolder,
                        getCacheFolderName(normalizedSizeObject)
                    )
                );

                return fs.mkdirAsync(
                    path.join(
                        config.IMAGE_CACHE_FILE.ABS_PATH,
                        getCacheFolderName(normalizedSizeObject)
                    )
                )
            })

    }
};
function normalizeSizeObject(size) {
    return {
        width: size && size.width? parseInt(size.width) : null,
        height: size && size.height? parseInt(size.height) : null
    }
}

function getCacheFolderName(size) {

    var width = size.width? parseInt(size.width) : "";
    var height = size.height? parseInt(size.height) : "";

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

module.exports = self;