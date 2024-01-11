const express = require('express');
const ClimbingRoute = require('../../models/climbingRoute');
const User = require('../../models/User');
const authMiddleware = require('../../middleware/authMiddleware');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const climbingRoutes = await ClimbingRoute.findAll({
            order: [
                ['createdAt', 'DESC']
            ],
        });
        res.json(climbingRoutes);
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.get('/creators', authMiddleware, async (req, res) => {
    try {
        // Fetch all climbing routes
        const climbingRoutes = await ClimbingRoute.findAll({
            attributes: ['creators'], // Select only the 'creators' column
        });

        // Extract creators and flatten the array of arrays
        let allCreators = climbingRoutes.map(cr => cr.creators).flat();

        // Filter out null or undefined values if any exist
        allCreators = allCreators.filter(cr => cr);

        // Create a unique set of creators
        const uniqueCreators = [...new Set(allCreators)];

        // Return the unique creators as JSON
        res.json({ uniqueCreators });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});


router.get('/route', async (req, res) => {
    try {
        if (!req.query.id) {
            return res.status(400).send('No ID provided.');
        }
        const climbingRoute = await ClimbingRoute.findByPk(req.query.id);
        if (!climbingRoute) {
            return res.status(404).send('Climbing route not found.');
        }
        res.json(climbingRoute);
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.put('/', authMiddleware, async (req, res) => {
    try {
        //check if name, difficulty, location and type are provided
        if (!req.body.name || !req.body.difficulty || !req.body.location || !req.body.type || !req.body.creators || !req.body.screwDate || !req.body.color) {
            return res.status(400).send({ message: 'Climbing route creation failed: Name, difficulty, location and type are required.' });
        }
        //create Route
        const climbingRoute = await ClimbingRoute.create({
            name: req.body.name,
            difficulty: req.body.difficulty,
            difficultySign: req.body.difficultySign || null,
            location: req.body.location,
            type: req.body.type,
            creatorId: req.user.id,
            comment: req.body.comment || null,
            creators: req.body.creators || null,
            screwDate: req.body.screwDate,
            color: req.body.color,
        });
        return res.json(climbingRoute);
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        id = req.body.id;
        const climbingRoute = await ClimbingRoute.findByPk(req.body.id);
        if (!climbingRoute) {
            return res.status(404).send('Climbing route not found.');
        }
        //check if name, difficulty, location and type are provided
        if (!req.body.name || !req.body.difficulty || !req.body.location || !req.body.type) {
            return res.status(400).send({ message: 'Climbing route creation failed: Name, difficulty, location and type are required.' });
        }
        climbingRoute.name = req.body.name;
        climbingRoute.difficulty = req.body.difficulty;
        climbingRoute.difficultySign = req.body.difficultySign || null;
        climbingRoute.location = req.body.location;
        climbingRoute.type = req.body.type;
        climbingRoute.comment = req.body.comment || null;
        climbingRoute.creators = req.body.creators || null;
        climbingRoute.screwDate = req.body.screwDate;
        climbingRoute.color = req.body.color;
        climbingRoute.archived = req.body.archived || false;
        await climbingRoute.save();
        return res.json(climbingRoute);
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.delete('/', authMiddleware, async (req, res) => {
    try {
        const ids = req.query.id.split(','); // Split the comma-separated IDs
        const deletePromises = ids.map(async (id) => {
            const climbingRoute = await ClimbingRoute.findByPk(id);
            if (!climbingRoute) {
                return; // Skip if the climbing route is not found
            }
            await climbingRoute.destroy();
        });
        await Promise.all(deletePromises);
        res.json({ message: 'Climbing routes deleted.' });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.post('/archive', authMiddleware, async (req, res) => {
    try {
        const ids = req.query.id.split(','); // Split the comma-separated IDs
        const deletePromises = ids.map(async (id) => {
            const climbingRoute = await ClimbingRoute.findByPk(id);
            if (!climbingRoute) {
                return; // Skip if the climbing route is not found
            }
            climbingRoute.archived = true;
            await climbingRoute.save();
        });
        await Promise.all(deletePromises);
        res.json({ message: 'Climbing routes archived.' });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.get('/pdf', authMiddleware, async (req, res) => {
    try {
        const ids = req.query.id ? req.query.id.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
        if (ids.length === 0) {
            return res.status(400).send('No IDs provided.');
        }
        const doc = new PDFDocument({ size: [595.28, 841.89] });
        doc.pipe(res);

        let entryCount = 0; // Keep track of entries for new page logic

        for (let i = 0; i < ids.length; i++) {
            const climbingRoute = await ClimbingRoute.findByPk(ids[i]);
            if (!climbingRoute) {
                continue; // Skip if the climbing route is not found
            }

            // Every 8 entries, add a new page
            if (entryCount % 8 === 0 && entryCount > 0) {
                doc.addPage();
            }

            const x = entryCount % 2 === 0 ? 25 : 310; // Position for 2 columns
            const y = (Math.floor(entryCount / 2) % 4) * 180 + 40; // Position for 4 rows

            // Draw a border around the entry
            doc.rect(x - 10, y - 10, 280, 170).stroke();
            
            // add color
            doc.circle(x + 80, y + 5, 10).fill(climbingRoute.color);

            //set text color black
            doc.fillColor('black');
            
            // Set text positions
            const textOptions = { align: 'left', width: 200 };
            doc.text(climbingRoute.name, calculateStartX(x + 80, climbingRoute.name, doc), y + 25, textOptions);
            doc.fontSize(25).text(climbingRoute.difficulty + climbingRoute.difficultySign , x+ 70, y + 45, textOptions);
            doc.text(climbingRoute.comment, calculateStartX(x + 80, climbingRoute.comment, doc), y + 75, textOptions);

            // Search for first and last name based on creatorId
            const creators = climbingRoute.creators || [];
            if (Array.isArray(creators)) {
                doc.fontSize(8).text(creators.join(' / '), calculateStartX(x + 80, creators.join(' / '), doc), y + 120, textOptions);
            }
            const screwDate = climbingRoute.screwDate.toLocaleDateString('de-DE');
            doc.fontSize(8).text(screwDate, calculateStartX(x + 80 , screwDate, doc), y + 140, textOptions);

            // QR code positioning and scaling
            const qrX = x + 155; // X position for QR code (to the right of the text)
            const qrY = y -15; // Y position for QR code
            const qrSize = 120;  // Size of the QR code, adjust as necessary

            // Generate QR code with the server URL
            const serverUrl = process.env.SERVER_URL + `/route?id=${ids[i]}` || `http://localhost:8080/route?id=${ids[i]}`;
            const qrCodeBuffer = await QRCode.toBuffer(serverUrl, {
                color: {
                    light: '#0000' // Transparent background
            }});
            doc.image(qrCodeBuffer, qrX, qrY, { fit: [qrSize, qrSize] });

            doc.image('assets/logo.png', {
                fit: [100, 100],
                y: y + 100,
                x: x + 165,
              });

            entryCount++;
        }

        doc.end();
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.get('/xlsx', authMiddleware, async (req, res) => {
    try {
        const ids = req.query.id ? req.query.id.split(',') : []; // Assuming IDs are comma-separated
        if (ids.length === 0) {
            return res.status(400).send('No IDs provided.');
        }
        const climbingRoutes = await ClimbingRoute.findAll({
            where: {
                id: ids,
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        const xlsx = require('xlsx');
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(climbingRoutes.map(cr => {
            return {
                'Name': cr.name,
                'Schwierigkeit': cr.difficulty,
                'Schrauber': cr.creators.join(', '),
                'Schraubdatum': cr.screwDate.toLocaleDateString('de-DE'),
                'Ort': cr.location,
                'Typ': cr.type,
                'Kommentar': cr.comment,
            };
        }));
        
        xlsx.utils.book_append_sheet(wb, ws, 'Climbing Routes');
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const timestamp = Date.now();
        res.setHeader('Content-Disposition', `attachment; filename="climbing-routes-${timestamp}.xlsx"`);
        res.send(buffer);
        
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

router.get('/json', authMiddleware, async (req, res) => {
    //export as json if no route is given all routes are exported, otherwise only the given route
    const ids = req.query.id ? req.query.id.split(',') : [];

    if (ids.length === 0) {
        try {
            const climbingRoutes = await ClimbingRoute.findAll({
                order: [
                    ['createdAt', 'DESC']
                ],
                attributes: {exclude: ['id', 'createdAt', 'updatedAt']}
            });
            res.json(climbingRoutes);
        } catch (e) {
            console.error(e);
            res.status(500).send('Server error');
        }
    }
    else {
        try {
            const climbingRoutes = await ClimbingRoute.findAll({
                where: {
                    id: ids,
                },
                order: [
                    ['createdAt', 'DESC']
                ],
                attributes: {exclude: ['id', 'createdAt', 'updatedAt']}
            });
            res.json(climbingRoutes);
        } catch (e) {
            console.error(e);
            res.status(500).send('Server error');
        }
    }
});

router.put('/json' , authMiddleware, async (req, res) => {
    //import climbing routes from json file and create new routes
    if (!req.body.length > 0) {
        return res.status(400).send({ message: 'No climbing routes provided.' });
    }
    try {
        const climbingRoutes = req.body;
        const createPromises = climbingRoutes.map(async (cr) => {
            await ClimbingRoute.create({
                name: cr.name,
                difficulty: cr.difficulty,
                difficultySign: cr.difficultySign || null,
                location: cr.location,
                type: cr.type,
                creatorId: req.user.id,
                comment: cr.comment || null,
                creators: cr.creators || null,
                screwDate: cr.screwDate,
                color: cr.color,
            });
        });
        await Promise.all(createPromises);
        res.json({ message: 'Climbing routes imported.', count: climbingRoutes.length });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

// Function to calculate the starting X-coordinate for centered text
function calculateStartX(desiredXCenter, text, doc) {
    if (text !== null) {
        // Choose a font and font size for measuring
        doc.font('Helvetica').fontSize(12);
      
        // Measure the width of the text
        const textWidth = doc.widthOfString(text);
      
        // Calculate and return the starting X position for the centered text
        return desiredXCenter - (textWidth / 2);
    }
    return 0;
}


module.exports = router;