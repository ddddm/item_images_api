"use strict";

var fs = require("fs");
var JSZip = require("jszip");
var _ = require('lodash');



fs.readFile("test_change_images.zip", function(err, data) {
    if (err) throw err;
    var zip = new JSZip(data);
    _.each(zip.files, function (file) {
        if(!file.dir) {
            var fileName = file.name.split('/');
            fileName = fileName[fileName.length-1];
            console.log('images/' + fileName);
            fs.writeFile("images/" + fileName, file.asNodeBuffer(), function(err) {
                if (err) throw err;
            });
        }

    })
});


