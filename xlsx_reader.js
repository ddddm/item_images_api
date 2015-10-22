"use strict";

var parser = require('excel');


parser('база картинок dump.xlsx', dataParsed);

function dataParsed(err, data) {
    if(err) throw err;

    for(var i=0;i<data.length;i++) {
        printData(data[i]);
    }

}

function printData(item) {
    console.log('Item id' + item[0] + ", name: " + item[1])

}