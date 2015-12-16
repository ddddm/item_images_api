'use strict';
var parser = require('excel');
var Promise = require('bluebird');

var parseAsync = Promise.promisify(parser);

module.exports = {
  parse: function(fileName) {
    return parseAsync(fileName)
  },
  createItemObject: function(item) {
    return {
      code: item[0],
      name: item[1],
      description: item[2],
      image_file: item[3]
    }
  }
}
