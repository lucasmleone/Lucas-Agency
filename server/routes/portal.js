import express from 'express';
import pool from '../db.js';
import { verifyToken } from './auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

router.use(verifyToken);

// --- Portal Management ---

// Ensure milestones table exists
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS project_milestones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                status ENUM('pending', 'active', 'completed') DEFAULT 'pending',
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        `);
    } catch (err) {
        console.error('Error initializing DB:', err);
    }
};
initDb();

// Generate Portal Token & PIN
router.post('/projects/:id/portal/generate', async (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.id;

    try {
        // Verify ownership
        const [projects] = await pool.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
        if (projects.length === 0) return res.status(404).json({ error: 'Project not found' });

        const token = randomUUID();
        const pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit PIN

        await pool.query(
            'UPDATE projects SET portal_token = ?, portal_pin = ?, portal_enabled = TRUE, portal_expires_at = NULL WHERE id = ?',
            [token, pin, projectId]
        );

        res.json({ token, pin, enabled: true });
    } catch (err) {
        console.error('Error generating portal:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Revoke Portal Access
router.post('/projects/:id/portal/revoke', async (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.id;

    try {
        const [projects] = await pool.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
        if (projects.length === 0) return res.status(404).json({ error: 'Project not found' });

        await pool.query(
            'UPDATE projects SET portal_enabled = FALSE, portal_token = NULL, portal_pin = NULL WHERE id = ?',
            [projectId]
        );

        res.json({ success: true, enabled: false });
    } catch (err) {
        console.error('Error revoking portal:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Portal Config (Drive, Requirements)
router.post('/projects/:id/portal/config', async (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { driveLink, requirements } = req.body;

    try {
        const [projects] = await pool.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
        if (projects.length === 0) return res.status(404).json({ error: 'Project not found' });

        await pool.query(
            'UPDATE projects SET drive_link = ?, requirements = ? WHERE id = ?',
            [driveLink, JSON.stringify(requirements || []), projectId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating portal config:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Milestone Management ---

// Get Milestones
router.get('/projects/:id/milestones', async (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.id;

    try {
        const [projects] = await pool.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
        if (projects.length === 0) return res.status(404).json({ error: 'Project not found' });

        const [milestones] = await pool.query(
            'SELECT * FROM project_milestones WHERE project_id = ? ORDER BY sort_order ASC',
            [projectId]
        );

        res.json(milestones);
    } catch (err) {
        console.error('Error fetching milestones:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Milestone
router.post('/projects/:id/milestones', async (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { title, status } = req.body;

    try {
        const [projects] = await pool.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
        if (projects.length === 0) return res.status(404).json({ error: 'Project not found' });

        // Get max sort order
        const [rows] = await pool.query('SELECT MAX(sort_order) as maxOrder FROM project_milestones WHERE project_id = ?', [projectId]);
        const nextOrder = (rows[0].maxOrder || 0) + 1;

        const [result] = await pool.query(
            'INSERT INTO project_milestones (project_id, title, status, sort_order) VALUES (?, ?, ?, ?)',
            [projectId, title, status || 'pending', nextOrder]
        );

        res.json({ id: result.insertId, title, status, sort_order: nextOrder });
    } catch (err) {
        console.error('Error adding milestone:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Milestone (Status, Title, Order)
router.put('/projects/:id/milestones/:milestoneId', async (req, res) => {
    const projectId = req.params.id;
    const milestoneId = req.params.milestoneId;
    const userId = req.user.id;
    const { title, status, sort_order } = req.body;

    try {
        const [projects] = await pool.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
        if (projects.length === 0) return res.status(404).json({ error: 'Project not found' });

        // Build update query dynamically
        const updates = [];
        const values = [];
        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }
        if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }

        if (updates.length === 0) return res.json({ success: true });

        values.push(milestoneId);
        values.push(projectId); // Ensure milestone belongs to project

        await pool.query(
            `UPDATE project_milestones SET ${updates.join(', ')} WHERE id = ? AND project_id = ?`,
            values
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating milestone:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete Milestone
router.delete('/projects/:id/milestones/:milestoneId', async (req, res) => {
    const projectId = req.params.id;
    const milestoneId = req.params.milestoneId;
    const userId = req.user.id;

    try {
        const [projects] = await pool.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
        if (projects.length === 0) return res.status(404).json({ error: 'Project not found' });

        await pool.query('DELETE FROM project_milestones WHERE id = ? AND project_id = ?', [milestoneId, projectId]);

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting milestone:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
