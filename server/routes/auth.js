import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import pool from '../db.js';
import { validateLogin, validateRegistration } from '../middleware/validators.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_12345';

// Rate limiter for auth routes
// Rate limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 5 : 1000, // 5 requests per windowMs in prod, 1000 in dev
    message: { error: 'Too many attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware to verify token
export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Login
router.post('/login', authLimiter, validateLogin, async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Disabled for HTTP testing (enable with HTTPS in production)
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ success: true, user: { id: user.id, email: user.email, agent_code: user.agent_code } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register
router.post('/register', authLimiter, validateRegistration, async (req, res) => {
    const { email, password } = req.body;
    const agentCode = 'AGENT_' + Math.random().toString(36).substr(2, 9).toUpperCase();

    try {
        // Check if email already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Registration failed' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        await pool.query('INSERT INTO users (email, password_hash, agent_code) VALUES (?, ?, ?)', [email, hashedPassword, agentCode]);
        res.json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// Check Auth
router.get('/check', verifyToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, email, agent_code FROM users WHERE id = ?', [req.user.id]);
        res.json({ user: users[0] });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
