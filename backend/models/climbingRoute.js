const { Model, DataTypes } = require("sequelize");
const sequelize = require("../scripts/database");

class ClimbingRoute extends Model {}

ClimbingRoute.init({
    name: DataTypes.STRING,
    color: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "#000000",
    },
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
    screwDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, { sequelize, modelName: "climbingroute" }); // Consider using singular for modelName

module.exports = ClimbingRoute;
