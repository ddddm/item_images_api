'use strict';

var Sequelize = require("sequelize");
var config    = require('../config.json');
var sequelize = new Sequelize(config.database, config.username, config.password, config);

module.exports = sequelize.define('Item', {
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