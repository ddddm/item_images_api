var fileExtension = require('file-extension');
var _ = require('lodash');


module.exports = function (filename) {
    if(!filename || !_.isString(filename)) return filename;
    var array = filename.split('.');
    array[array.length - 1] = fileExtension(filename);
    return array.join('.');
};