module.exports = function (sequelize, DataTypes) {
    var Change = sequelize.define("Change", {
    }, {
        classMethods: {
            associate: function(models) {
                Change.belongsToMany(models['Item'], {through: 'ItemChange'});
            }
        },
        timestamps: true,
        tableName: 'change'

    });

    return Change;
};