const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./scripts/database');  // Import the sequelize instance
const migrateAndSeed = require('./scripts/migrate');     // Import the migrate function
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test database connection
async function assertDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
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

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));


// Start server
migrateAndSeed().then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
  });