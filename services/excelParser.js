'use strict';
var parser = require('excel');
var Promise = require('bluebird');
var _ = require('lodash');
var lowercaseFileExtension = require('./lowercaseFileExtension');

var parseAsync = Promise.promisify(parser);

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

module.exports = {
    parse: function(fileName) {
        return parseAsync(fileName)
            .then(function (items) {
                return _.map(items, function (item) {
                    return parseItem(item)
                })
            })
            .then(function (items) {
                return _.compact(items);
            })
    },
    parseItem: parseItem
};
