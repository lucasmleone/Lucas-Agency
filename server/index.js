import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import configRoutes from './routes/config.js';
import maintenanceRoutes from './routes/maintenance.js';
import publicRoutes from './routes/public.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import rateLimit from 'express-rate-limit';

// ... imports

const app = express();
const PORT = process.env.PORT || 3001;

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
// app.use(helmet()); // Disabled for HTTP testing
if (process.env.NODE_ENV === 'production') {
    app.use(limiter); // Apply rate limiting only in production
}
app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins for now (testing purposes)
        // In production with HTTPS, you'd want to restrict this
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
// API Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', dataRoutes);
app.use('/api/config', configRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Serve Static Files (Production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Server running on port ${PORT}`);
    }
});
