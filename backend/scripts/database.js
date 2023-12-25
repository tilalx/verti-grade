const { Sequelize } = require('sequelize');

// Load environment variables
require('dotenv').config();

// Define the environment
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// Create a Sequelize instance using environment variables
const sequelize = new Sequelize(
  process.env.DB_DATABASE || config.database || 'vertigrade',
  process.env.DB_USERNAME || config.username || 'vertigrade',
  process.env.DB_PASSWORD || config.password, {                
    host: process.env.DB_HOST || config.host,                  
    port: process.env.DB_PORT || config.port || 5432,          
    dialect: 'postgresql',                                     // Hardcoded to 'postgresql'
    logging: false,                                            
  });

// Export the sequelize instance
module.exports = sequelize;