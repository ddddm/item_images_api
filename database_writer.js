"use strict";

var Sequelize = require("sequelize");
var config    = require('./config.json');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
var parser = require('excel');

var Item = sequelize.define('Item', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: Sequelize.INTEGER,
    name: Sequelize.STRING,
    image_file: Sequelize.STRING,
    description: Sequelize.TEXT
},{
    timestamps: false,
    tableName: 'item'
});

parser('база картинок dump.xlsx', handleXlsxData);

function handleXlsxData(error, data) {
    if(error) throw error
    for(var i=0;i<data.length;i++) {
        saveItem(data[i]);
    }
}

function saveItem(item) {
    Item.create({
        code: item[0],
        name: item[1],
        image_file: item[2],
        description: item[3]
    }).then(
        onItemCreated
    )
}

function onItemCreated(item_obj) {
    console.log('Item id' + item_obj.code + ", name: " + item_obj.name);
}