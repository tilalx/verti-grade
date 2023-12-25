const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (authHeader) {
      const token = authHeader.split(' ')[1];  // Extract the token
  
      // Verify the token
      jwt.verify(token, process.env.JWT_SECRET, async (err, userData) => {  // Note: userData is the payload from the token
        if (err) {
          return res.sendStatus(403);  // Invalid token
        }
  
        try {
          const dbUser = await User.findByPk(userData.id);  // Assuming userData contains an id
          if (!dbUser) {
            return res.status(404).send('User not found.');
          }
          req.user = dbUser;  // Attach the user to the request object
          next();
        } catch (dbError) {
          console.error(dbError);
          res.sendStatus(500); // Internal server error
        }
      });
    } else {
      res.sendStatus(401);  // No token provided
    }
  };  

module.exports = authMiddleware;