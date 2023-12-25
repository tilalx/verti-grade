const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const router = express.Router();

// Login Route
router.post('/login', async (req, res) => {
    try {
        // Check if email and password are provided
        if (!req.body.email || !req.body.password) {
            return res.status(400).send({ message: 'Login failed: Email and password are required.' });
        }

        // Find user by email
        const user = await User.findOne({ where: { email: req.body.email } });

        if (!user) {
            return res.status(401).send({ message: 'Login failed: User not found.' });
        }
        
        // Compare password with hashed password in the database
        const isMatch = await bcrypt.compare(req.body.password, user.password);

        if (!isMatch) {
            return res.status(401).send({ message: 'Login failed: Incorrect password.' });
        }

        // User matched, create JWT Payload
        const payload = {
            id: user.id,
            name: user.name
        };

        // Sign token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,  // Make sure to have a JWT_SECRET in your .env
            { expiresIn: 2 * 24 * 60 * 60 },     // Token expires in 2 days (2 * 24 * 60 * 60 seconds)
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token: `Bearer ${token}`,
                });
            }
        );

    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

module.exports = router;