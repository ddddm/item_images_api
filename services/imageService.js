var Promise = require('bluebird');
var gm = require('gm');
// Promise.promisifyAll(gm.prototype);
var fs = Promise.promisifyAll(require('fs'));

var imageFolder = 'images/';
var cacheFolder = 'cache/';

module.exports = {
  jpg: function(fileName, size) {

    var width = size.split('x')[0] !== ''? parseInt(size.split('x')[0]) : null;
    var height = size.split('x')[1] !== ''? parseInt(size.split('x')[1]) : null;

    return new Promise(function(resolve, reject) {

      var _fileName = size? cacheFolder + size + '/' + fileName : imageFolder + fileName;

      return fs.statAsync(_fileName)
        .catch(function(err) {
          return new Promise(function(resolve, reject) {
            gm(imageFolder + fileName)
              .setFormat('jpg')
              .resize(width, height, '>')
              .write(cacheFolder  + size + '/' + fileName, function(err){
                if (err) return reject(err);
                return resolve();
              })

          })
        })
        .then(function() {
          console.log('ImageServer:exists', _fileName);
          fs.readFileAsync(_fileName)
            .then(function(fileContent) {
              resolve(fileContent);
            })
        })

    })
  }
}
