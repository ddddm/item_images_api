"use strict";

var parser = require('excel');
var fs = require('fs');


parser('Остатки для сайта.xls', dataParsed);

function dataParsed(err, data) {
    if(err) throw err;

    // for(var i=0;i<data.length;i++) {
    //     printData(data[i]);
    // }
    fs.writeFile('output.json', dataParsed, function(err) {
      if(err) console.log(err);
      return console.log('File parsed to output.json.');
    })

}

function printData(item) {
    console.log('Item id' + item[0] + ", name: " + item[1])

}
