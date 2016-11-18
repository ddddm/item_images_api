"use strict";

var fs = require("fs");
var Promise = require('bluebird');

var writeFileAsync = Promise.promisify(fs.writeFile);

var imagesDirectory = 'images';

module.exports = {
  codeFromFilename: function(fileName) {
    if(!fileName) return false;
    var code = fileName.split('/');
    return code = code[code.length-1].split('.')[0]
  },
  saveFile: function(file) {
    var fileName = file.name.split('/');
    fileName = fileName[fileName.length-1];
    return writeFileAsync(imagesDirectory + "/" + fileName, file.asNodeBuffer())
  }
};
