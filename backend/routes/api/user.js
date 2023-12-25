const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../../models/User');
const authMiddleware = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/all', authMiddleware, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        res.json(users);
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.get('/:id',  authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).send('User not found.');
        }
        res.json(user);
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.post('/create', authMiddleware, async (req, res) => {
    try {
        //check if firstname, lastname, email and password are provided
        if (!req.body.firstname || !req.body.lastname || !req.body.email || !req.body.password) {
            return res.status(400).send({ message: 'Registration failed: Firstname, lastname, email and password are required.' });
        }

        // Find user by email
        if (await User.findOne({ where: { email: req.body.email } })) {
            return res.status(400).send({ message: 'Registration failed: Email already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create user
        const user = await User.create({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: hashedPassword
        });

        res.status(201).send({ message: 'Registration successful.' });

    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.put('/edit', authMiddleware, async (req, res) => {
    try {
        //check if firstname, lastname, email and password are provided
        if (!req.body.firstname || !req.body.lastname || !req.body.email) {
            return res.status(400).send({ message: 'User edit failed: Firstname, lastname and email are required.' });
        }
        //hash password if provided
        let hashedPassword;
        if (req.body.password) {
            hashedPassword = await bcrypt.hash(req.body.password, 10);
        }
        //update user
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).send('User not found.');
        }
        user.firstname = req.body.firstname;
        user.lastname = req.body.lastname;
        user.email = req.body.email;
        if (hashedPassword) {
            user.password = hashedPassword;
        }
        await user.save();
        return res.json({
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });

    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).send('User not found.');
        }
        await user.destroy();
        res.json({ message: 'User removed' });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

module.exports = router;