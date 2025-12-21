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
import notesRoutes from './routes/notes.js';
import portalRoutes from './routes/portal.js';
import publicPortalRoutes from './routes/public_portal.js';
import addonsRoutes from './routes/addons.js';
import capacityRoutes from './routes/capacity.js';
import achievementsRoutes from './routes/achievements.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import rateLimit from 'express-rate-limit';

// ... imports

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Proxy for Nginx
app.set('trust proxy', 1); // Trust first proxy (Nginx) for correct IP in rate limiter


// Rate Limiting Strategies - DISABLED TEMPORARILY
const publicLimiter = (req, res, next) => next();
const internalLimiter = (req, res, next) => next();

// Middleware
// app.use(helmet()); // Disabled for HTTP testing
// Note: Global limiter removed in favor of route-specific limiters

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
// Apply strict limits to public/auth routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portal', publicPortalRoutes);

// Apply relaxed limits to internal routes
const internalMiddleware = (req, res, next) => next();

app.use('/api', internalMiddleware, dataRoutes);
app.use('/api/config', internalMiddleware, configRoutes);
app.use('/api/config', internalMiddleware, configRoutes);
app.use('/api/maintenance', internalMiddleware, maintenanceRoutes);
app.use('/api/notes', internalMiddleware, notesRoutes);
app.use('/api', internalMiddleware, portalRoutes);
app.use('/api/addons', internalMiddleware, addonsRoutes);
app.use('/api/capacity', internalMiddleware, capacityRoutes);
app.use('/api/achievements', internalMiddleware, achievementsRoutes);

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
    console.log(`Server running on port ${PORT}`);
    console.log('NODE_ENV:', process.env.NODE_ENV);
});
