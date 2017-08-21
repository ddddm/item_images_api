'use strict';

var self = {};
var path = require('path');
const fs = require('fs');

self = {
    PORT: process.env.ITEMS_API_PORT || 8090,
    CHANGE_EXCEL_FILE: {
        LOCAL_PATH: 'excels',
        ABS_PATH: path.join(__dirname, 'excels')
    },
    CHANGE_TASK_EXCEL_FILE: {
        LOCAL_PATH: path.join('excels', 'tasks'),
        ABS_PATH: path.join(__dirname, 'excels', 'tasks')
    },
    CHANGE_ZIP_FILE: {
        LOCAL_PATH: 'zip',
        ABS_PATH: path.join(__dirname, 'zip')
    },
    IMAGE_FILE: {
        LOCAL_PATH: 'images',
        ABS_PATH: path.join(__dirname, 'images')
    },
    IMAGE_CACHE_FILE: {
        LOCAL_PATH: 'cache',
        ABS_PATH: path.join(__dirname, 'cache')
    },
    "dialect": "sqlite",
    "storage": "database/database.sqlite",
    "logging": null
};

fs.mkdirSync(self.CHANGE_EXCEL_FILE.ABS_PATH)
fs.mkdirSync(self.CHANGE_TASK_EXCEL_FILE.ABS_PATH)
fs.mkdirSync(self.CHANGE_ZIP_FILE.ABS_PATH)
fs.mkdirSync(self.IMAGE_FILE.ABS_PATH)
fs.mkdirSync(self.IMAGE_CACHE_FILE.ABS_PATH)

module.exports = self;