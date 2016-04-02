'use strict';
var xlsx = require('xlsx');
var Promise = require('bluebird');
var _ = require('lodash');
var lowercaseFileExtension = require('./lowercaseFileExtension');

//var parseAsync = Promise.promisify(parser);

// column order which they appear in excel file
var parserConfig = {
    code: 0,
    name: 1,
    description: 2,
    image_file: 3
};

function parseItem(itemArray) {
    var item = {
        valid: true
    };

    for(var prop in parserConfig) {
        if(itemArray[parserConfig[prop]] && _.isString(itemArray[parserConfig[prop]])) {
            item[prop] = itemArray[parserConfig[prop]];
        } else {
            item.valid = false;
        }
    }

    if(item.valid) item.image_file = lowercaseFileExtension(item.image_file);

    return item;
}
function parseItemObject(itemObj) {
    var item = {
        valid: true
    };

    if(itemObj.code) item.code = parseInt(itemObj.code); else item.valid = false;
    if(itemObj.name && _.isString(itemObj.name)) item.name = itemObj.name; else item.valid = false;
    if(itemObj.image_file && _.isString(itemObj.image_file)) item.image_file = itemObj.image_file; else item.valid = false;
    if(itemObj.description && _.isString(itemObj.description)) item.description = itemObj.description;

    if(item.valid) item.image_file = lowercaseFileExtension(item.image_file);

    return item;
}

module.exports = {
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



        //return parseAsync(fileName)
        //    .then(function (items) {
        //        return _.map(items, function (item) {
        //            return parseItem(item)
        //        })
        //    })
        //    .then(function (items) {
        //        return _.compact(items);
        //    })
    },
    parseItem: parseItem
};
