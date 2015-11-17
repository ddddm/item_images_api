'use strict';
var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
    var Item = sequelize.define("Item", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        code: DataTypes.INTEGER,
        name: DataTypes.STRING,
        image_file: DataTypes.STRING,
        description: DataTypes.TEXT
    }, {
        classMethods: {
            associate: function(models) {
                Item.belongsToMany(models['Change'], {through: 'ItemChange'});
            },
            createFromList: function(items) {
                return Promise.reduce(
                    items,
                    function (total, item) {
                        return Item
                            .findOrCreate({
                                where: {
                                    code: item.code
                                },
                                defaults: {
                                    name: item.name
                                }

                            })
                            .spread(function (item, created) {
                                return _.union(total, [{
                                    isCreated: created,
                                    item: item
                                }])
                            })
                    },
                    []
                )
            }
        },
        timestamps: false,
        tableName: 'item'

    });

    return Item;
};