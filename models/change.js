module.exports = function (sequelize, DataTypes) {
    var Change = sequelize.define("Change", {
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
        //timestamps: false,
        //tableName: 'item'

    });

    return Change;
};