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

// Rate Limiting Strategies

// 1. Strict Limiter for Public Routes (Auth, Public Links)
// Prevents brute force attacks and abuse of public endpoints
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

// 2. Relaxed Limiter for Internal API (Authenticated Users)
// Allows intensive usage (auto-refresh, dashboard) without blocking legitimate work
const internalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // High limit: ~5 requests per second sustained for 15 mins
    standardHeaders: true,
    legacyHeaders: false,
});

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
app.use('/api/public', process.env.NODE_ENV === 'production' ? publicLimiter : (req, res, next) => next(), publicRoutes);
app.use('/api/auth', process.env.NODE_ENV === 'production' ? publicLimiter : (req, res, next) => next(), authRoutes);

// Apply relaxed limits to internal routes
const internalMiddleware = process.env.NODE_ENV === 'production' ? internalLimiter : (req, res, next) => next();

app.use('/api', internalMiddleware, dataRoutes);
app.use('/api/config', internalMiddleware, configRoutes);
app.use('/api/maintenance', internalMiddleware, maintenanceRoutes);

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
