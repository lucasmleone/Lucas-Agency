import express from 'express';
import pool from '../db.js';
import { verifyToken } from './auth.js';

const router = express.Router();

router.use(verifyToken);

// --- Templates (Library) ---

// Get all templates
router.get('/templates', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM add_on_templates WHERE user_id = ? ORDER BY name ASC', [req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching templates' });
    }
});

// Create template
router.post('/templates', async (req, res) => {
    const { name, description, defaultPrice } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO add_on_templates (user_id, name, description, default_price) VALUES (?, ?, ?, ?)',
            [req.user.id, name, description, defaultPrice || 0]
        );
        res.json({ id: result.insertId, name, description, defaultPrice });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating template' });
    }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM add_on_templates WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting template' });
    }
});

// --- Project Add-ons ---

// Get add-ons for a project
router.get('/projects/:projectId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM project_add_ons WHERE project_id = ?', [req.params.projectId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching project add-ons' });
    }
});

// Add add-on to project
router.post('/projects/:projectId', async (req, res) => {
    const { name, description, price } = req.body;
    const { projectId } = req.params;
    try {
        const [result] = await pool.query(
            'INSERT INTO project_add_ons (project_id, name, description, price) VALUES (?, ?, ?, ?)',
            [projectId, name, description, price || 0]
        );
        res.json({ id: result.insertId, projectId, name, description, price });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding add-on to project' });
    }
});

// Remove add-on from project
router.delete('/projects/:projectId/:addonId', async (req, res) => {
    try {
        await pool.query('DELETE FROM project_add_ons WHERE id = ? AND project_id = ?', [req.params.addonId, req.params.projectId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error removing add-on from project' });
    }
});

export default router;
