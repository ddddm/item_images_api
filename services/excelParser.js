'use strict';
var xlsx = require('xlsx');
var encoding = require("encoding");
var Promise = require('bluebird');
var _ = require('lodash');
var lowercaseFileExtension = require('./lowercaseFileExtension');

function parseItemObject(itemObj) {
    var item = {
        valid: true
    };

    if(itemObj.code) {
        item.code = parseInt(itemObj.code);
    } else {
        item.valid = false;
    }

    if(itemObj.name && _.isString(itemObj.name)) {
        item.name = itemObj.name;
    } else {
        item.valid = false;
    }

    if(itemObj.image_file) {
        item.image_file = _.toString(itemObj.image_file);
    } else {
        item.valid = false;
    }

    if(itemObj.description && _.isString(itemObj.description)) {
        item.description = itemObj.description;
    }

    if(item.valid) {
        item.image_file = lowercaseFileExtension(item.image_file);
    }

    return item;
}

module.exports = {
    /**
     * Parse excel document with column names in first row
     * @param fileName - full path to the local file
     * @returns {Promise}
     */
    parse: function(fileName) {
        return new Promise(function (resolve, reject) {
            var wb = xlsx.readFile(fileName);
            var sheet = wb.Sheets[wb.SheetNames[0]];
            var array = xlsx.utils.sheet_to_row_object_array(sheet,{raw:true});

            var items = _.map(array, function(itemObj) {
                return parseItemObject(itemObj);
            });

            resolve(items);
        });
    },
    /**
     * Parse pricelist
     * @param fileName
     * @returns {Promise}
     */
    parsePricelist: function (fileName, documentType) {
        return new Promise(function(resolve, reject) {
            var wb = xlsx.readFile(fileName, {cellStyles: true});
            var sheet = wb.Sheets[wb.SheetNames[0]];

            var result = [];
            documentType = {
                startFromRow: 10,
                columns: {
                    'A': 'code',
                    'D': 'name',
                    'E': 'description',
                    'J': 'image_file'
                }
            };


            for(
                var i = documentType.startFromRow;
                sheet['A' + (i).toString()] || (
                    !sheet['A' + (i).toString()] &&
                    sheet['A' + (i + 1).toString()]
                );
                i++) {

                var item = {};
                _.each(documentType.columns, function(column, symbol) {
                    if(sheet[symbol + i.toString()]) {
                        var resultBuffer = encoding.convert(sheet[symbol + i.toString()].v, 'utf8', 'cp1251');
                        item[column] = resultBuffer.toString('utf8');
                    }
                });

                item = parseItemObject(item);
                if(item.valid) result.push(item);
            }

            resolve(result);
        })
    }
};
