var _ = require('lodash');


module.exports = function (filename) {
    if(!filename || !_.isString(filename)) return filename;

    var array = filename.split('.');
    array.length = array.length - 1;
    return array.join('.');
};