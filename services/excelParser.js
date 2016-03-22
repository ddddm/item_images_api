'use strict';
var parser = require('excel');
var Promise = require('bluebird');
var _ = require('lodash');

var parseAsync = Promise.promisify(parser);

var parserConfig = {
    code: 0,
    name: 1,
    description: 2,
    imageFile: 3
};

function parseItem(itemArray) {
    if(!itemArray) return null;

    for(var i in parserConfig) {
        if(!itemArray[i] || !_.isString(itemArray[i])) return null;
    }

    var array = itemArray[3].split('.');
    array[array.length - 1] = _.toLower(array[array.length - 1]);
    var image_file = array.join('.');

    return {
        code: itemArray[0],
        name: itemArray[1],
        description: itemArray[2],
        image_file: image_file
    }
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
