const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./scripts/database');
const migrateAndSeed = require('./scripts/migrate');
const path = require('path');
const app = express();
const logger = require('./scripts/winston')

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test database connection
async function assertDatabaseConnection() {
  try {
    await sequelize.authenticate();
    logger.log('Connection to the database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
assertDatabaseConnection();

// Serve static files for Vue frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/users', require('./routes/api/user'));
app.use('/api/climbingroute', require('./routes/api/climbingRoute'));
app.use('/api/routeRating', require('./routes/api/routeRating'));


// Start server
migrateAndSeed().then(() => {
    app.listen(process.env.PORT || 3001, () => {
      logger.log(`Server is running on port ${process.env.PORT || 3001}`);
    });
  });