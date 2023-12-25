const { Sequelize } = require('sequelize');
const Umzug = require('umzug');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Setup Sequelize
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
});

// Setup Umzug for migrations
const migrator = new Umzug({
  migrations: {
    path: path.join(__dirname, '../migrations'),
    params: [
      sequelize.getQueryInterface(),
      Sequelize
    ],
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize,
  },
});

// Setup Umzug for seeders
const seeder = new Umzug({
  migrations: {
    path: path.join(__dirname, '../seeders'), // Adjust if your seeders are in a different directory
    params: [
      sequelize.getQueryInterface(),
      Sequelize
    ],
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize,
    modelName: 'SequelizeData',  // Use a different table for seeders
    tableName: 'SequelizeData',  // This too, to avoid conflicts with migration data
  },
});

// A function to run both migrations and seeders
async function migrateAndSeed() {
  try {
    // Execute all pending migrations
    await migrator.up();
    console.log('All migrations performed successfully');

    // Execute all pending seeders
    await seeder.up();
    console.log('All seeders performed successfully');
  } catch (error) {
    console.error('Error during migration and seeding:', error);
  }
}

module.exports = migrateAndSeed;
