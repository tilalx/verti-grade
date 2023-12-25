const express = require('express');
const { routeRating } = require('../../models');
const authMiddleware = require('../../middleware/authMiddleware');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const routeRating = await routeRating.findAll({
            order: [
                ['createdAt', 'DESC']
            ],
        });
        res.json(routeRating);
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.get('/climbingRoute/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const RouteRating = await routeRating.findAll({
            where: {
                routeId: id
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        res.json(RouteRating);
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.put('/', async (req, res) => {
    try {
        //check if routeId, rating and difficulty are provided
        if (!req.body.routeId || !req.body.rating || !req.body.difficulty) {
            return res.status(400).send({ message: 'Route rating creation failed: RouteId, rating and difficulty are required.' });
        }
        //create Route
        const routeRatings = await routeRating.create({
            routeId: req.body.routeId,
            rating: req.body.rating,
            difficulty: req.body.difficulty,
            difficultySign: req.body.difficultySign  || null,
            comment: req.body.comment || null, // Set comment to null if it is not provided
        });
        return res.json(routeRatings);
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const routeRatings = await routeRating.findByPk(req.params.id);
        if (!routeRatings) {
            return res.status(404).send('Route rating not found.');
        }
        await routeRatings.destroy();
        res.json({ message: 'Route rating removed' });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

module.exports = router;