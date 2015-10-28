'use strict';

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
            }
        },
        timestamps: false,
        tableName: 'item'

    });

    return Item;
};