"use strict";

var fs = require("fs");
var JSZip = require("jszip");
var Promise = require('bluebird');

var readFileAsync = Promise.promisify(fs.readFile);
var writeFileAsync = Promise.promisify(fs.writeFile);

var imagesDirectory = 'images';

module.exports = {
  listFiles: function(fileName) {
    return readFileAsync(fileName)
      .then(function (fileData) {
        return new JSZip(fileData).files;
      })
  },
  
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

}
