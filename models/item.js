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
        //classMethods: {
        //    associate: function(models) {
        //        Task.belongsTo(models.User, {
        //            onDelete: "CASCADE",
        //            foreignKey: {
        //                allowNull: false
        //            }
        //        });
        //    }
        //},
        timestamps: false,
        tableName: 'item'

    });

    return Item;
};