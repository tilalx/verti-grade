const { Model, DataTypes } = require('sequelize');
const sequelize = require('../scripts/database');

class User extends Model {}

User.init({
  firstname: DataTypes.STRING,
  lastname: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING
}, { sequelize, modelName: 'users' });


module.exports = User;