import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { verifyToken } from './auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, '../pricingConfig.json');

// GET pricing config
router.get('/pricing', verifyToken, (req, res) => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const config = fs.readFileSync(CONFIG_FILE, 'utf8');
            res.json(JSON.parse(config));
        } else {
            // Default config if file doesn't exist
            const defaultConfig = {
                "Single Page": 300,
                "Multipage": 600,
                "E-commerce": 900,
                "Personalizado": 0
            };
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
            res.json(defaultConfig);
        }
    } catch (error) {
        console.error('Error reading pricing config:', error);
        res.status(500).json({ error: 'Failed to load pricing configuration' });
    }
});

// POST update pricing config
router.post('/pricing', verifyToken, (req, res) => {
    try {
        const newConfig = req.body;
        // Basic validation
        if (!newConfig || typeof newConfig !== 'object') {
            return res.status(400).json({ error: 'Invalid configuration data' });
        }

        fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
        res.json({ message: 'Pricing configuration updated successfully', config: newConfig });
    } catch (error) {
        console.error('Error saving pricing config:', error);
        res.status(500).json({ error: 'Failed to save pricing configuration' });
    }
});

export default router;
