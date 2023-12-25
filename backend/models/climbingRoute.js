const { Model, DataTypes } = require("sequelize");
const sequelize = require("../scripts/database");

class ClimbingRoute extends Model {}

ClimbingRoute.init({
    name: DataTypes.STRING,
    difficulty: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    difficultySign: {
        type: DataTypes.ENUM("+", "-"),
        allowNull: true,
    },
    location: DataTypes.STRING,
    type: DataTypes.STRING,
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    creators: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    archived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, { sequelize, modelName: "climbingroute" }); // Consider using singular for modelName

module.exports = ClimbingRoute;
