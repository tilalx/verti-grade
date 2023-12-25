const { Model, DataTypes } = require("sequelize");
const sequelize = require("../scripts/database");
const climbingRoute = require("./climbingRoute");

const RouteRating = sequelize.define(
  "routeratings",
  {
    routeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: climbingRoute,
            key: 'id'
        }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    difficulty: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    difficultySign: {
        type: DataTypes.ENUM("+", "-"),
        allowNull: true,
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "routeratings",
  }
);

module.exports = RouteRating;
