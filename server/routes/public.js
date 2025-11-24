import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Accept Proposal
router.post('/accept-proposal', async (req, res) => {
    const { projectId } = req.body;

    if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
    }

    try {
        // Find project by ID
        const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
        const project = projects[0];

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Update status to WAITING_RESOURCES (Stage 3)
        await pool.query('UPDATE projects SET status = ? WHERE id = ?', ['3. Espera Recursos', project.id]);

        // Add Log
        await pool.query('INSERT INTO project_logs (user_id, project_id, message) VALUES (?, ?, ?)',
            [project.user_id, project.id, 'Cliente aceptó presupuesto vía web (Automático)']
        );

        res.json({ success: true, clientName: project.clientName || project.name || 'Cliente' });

    } catch (err) {
        console.error('Error accepting proposal:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
