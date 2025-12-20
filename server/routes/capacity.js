import express from 'express';
import pool from '../db.js';
import { verifyToken } from './auth.js';

const router = express.Router();

router.use(verifyToken);

// =============================================================================
// GET CAPACITY BLOCKS
// =============================================================================

/**
 * Get capacity blocks for a date range
 * Query params: startDate, endDate (YYYY-MM-DD format)
 */
router.get('/blocks', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const [rows] = await pool.query(`
            SELECT 
                cb.*,
                p.plan as project_plan,
                c.name as client_name
            FROM capacity_blocks cb
            LEFT JOIN projects p ON cb.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            WHERE cb.user_id = ?
            AND cb.date BETWEEN ? AND ?
            ORDER BY cb.date, cb.start_time
        `, [req.user.id, startDate, endDate]);

        const blocks = rows.map(b => ({
            id: b.id,
            projectId: b.project_id ? String(b.project_id) : null,
            title: b.title,
            blockType: b.block_type,
            date: b.date,
            hours: parseFloat(b.hours),
            startTime: b.start_time,
            isShadow: Boolean(b.is_shadow),
            notes: b.notes,
            completed: Boolean(b.completed),
            createdAt: b.created_at,
            // Related data
            projectPlan: b.project_plan,
            clientName: b.client_name,
        }));

        res.json(blocks);
    } catch (err) {
        console.error('Error fetching capacity blocks:', err);
        res.status(500).json({ error: 'Error fetching blocks' });
    }
});

// =============================================================================
// CREATE BLOCK
// =============================================================================

/**
 * Create a new capacity block (manual or production)
 */
router.post('/blocks', async (req, res) => {
    try {
        const { projectId, title, blockType, date, hours, startTime, isShadow, notes } = req.body;

        if (!title || !date || !hours) {
            return res.status(400).json({ error: 'title, date, and hours are required' });
        }

        const [result] = await pool.query(`
            INSERT INTO capacity_blocks 
            (user_id, project_id, title, block_type, date, hours, start_time, is_shadow, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.user.id,
            projectId || null,
            title,
            blockType || 'manual',
            date,
            hours,
            startTime || null,
            isShadow || false,
            notes || null
        ]);

        res.status(201).json({
            id: result.insertId,
            message: 'Block created successfully'
        });
    } catch (err) {
        console.error('Error creating capacity block:', err);
        res.status(500).json({ error: 'Error creating block' });
    }
});

// =============================================================================
// UPDATE BLOCK
// =============================================================================

router.put('/blocks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, blockType, date, hours, startTime, notes, completed } = req.body;

        // Verify ownership
        const [existing] = await pool.query(
            'SELECT id FROM capacity_blocks WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Block not found' });
        }

        await pool.query(`
            UPDATE capacity_blocks SET
                title = COALESCE(?, title),
                block_type = COALESCE(?, block_type),
                date = COALESCE(?, date),
                hours = COALESCE(?, hours),
                start_time = COALESCE(?, start_time),
                notes = COALESCE(?, notes),
                completed = COALESCE(?, completed)
            WHERE id = ? AND user_id = ?
        `, [title, blockType, date, hours, startTime, notes, completed, id, req.user.id]);

        res.json({ message: 'Block updated successfully' });
    } catch (err) {
        console.error('Error updating capacity block:', err);
        res.status(500).json({ error: 'Error updating block' });
    }
});

// =============================================================================
// DELETE BLOCK
// =============================================================================

router.delete('/blocks/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'DELETE FROM capacity_blocks WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Block not found' });
        }

        res.json({ message: 'Block deleted successfully' });
    } catch (err) {
        console.error('Error deleting capacity block:', err);
        res.status(500).json({ error: 'Error deleting block' });
    }
});

// =============================================================================
// COMPLETE SHIFT
// =============================================================================

/**
 * Mark a block's shift as completed and update project progress
 */
router.post('/complete-shift/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get the block
        const [blocks] = await pool.query(
            'SELECT * FROM capacity_blocks WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (blocks.length === 0) {
            return res.status(404).json({ error: 'Block not found' });
        }

        const block = blocks[0];

        // Mark block as completed
        await pool.query(
            'UPDATE capacity_blocks SET completed = TRUE WHERE id = ?',
            [id]
        );

        // If linked to a project, update hours_completed
        if (block.project_id) {
            await pool.query(`
                UPDATE projects 
                SET hours_completed = COALESCE(hours_completed, 0) + ?
                WHERE id = ?
            `, [block.hours, block.project_id]);
        }

        res.json({ message: 'Shift completed successfully' });
    } catch (err) {
        console.error('Error completing shift:', err);
        res.status(500).json({ error: 'Error completing shift' });
    }
});

// =============================================================================
// GET AVAILABILITY
// =============================================================================

/**
 * Get available hours per day for a date range
 * Used for delivery date calculation
 */
router.get('/availability', async (req, res) => {
    try {
        const { startDate, endDate, maxDailyHours = 8 } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        // Get all CONFIRMED (non-shadow) blocks in range
        const [blocks] = await pool.query(`
            SELECT date, SUM(hours) as total_hours
            FROM capacity_blocks
            WHERE user_id = ? 
            AND date BETWEEN ? AND ?
            AND is_shadow = FALSE
            GROUP BY date
        `, [req.user.id, startDate, endDate]);

        // Build availability map
        const availability = {};
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay();

            // Skip weekends
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                availability[dateStr] = 0;
                continue;
            }

            const occupied = blocks.find(b => {
                const blockDate = new Date(b.date).toISOString().split('T')[0];
                return blockDate === dateStr;
            });

            const occupiedHours = occupied ? parseFloat(occupied.total_hours) : 0;
            availability[dateStr] = Math.max(0, parseFloat(maxDailyHours) - occupiedHours);
        }

        res.json(availability);
    } catch (err) {
        console.error('Error fetching availability:', err);
        res.status(500).json({ error: 'Error fetching availability' });
    }
});

// =============================================================================
// CALCULATE DELIVERY DATE
// =============================================================================

/**
 * Calculate estimated delivery date based on hours and daily dedication
 */
router.post('/calculate-delivery', async (req, res) => {
    try {
        const { totalHours, dailyDedication = 4, startDate } = req.body;

        if (!totalHours) {
            return res.status(400).json({ error: 'totalHours is required' });
        }

        const start = startDate ? new Date(startDate) : new Date();

        // Get existing blocks for next 6 months
        const endSearch = new Date(start);
        endSearch.setMonth(endSearch.getMonth() + 6);

        const [blocks] = await pool.query(`
            SELECT date, SUM(hours) as total_hours
            FROM capacity_blocks
            WHERE user_id = ?
            AND date BETWEEN ? AND ?
            AND is_shadow = FALSE
            GROUP BY date
        `, [req.user.id, start.toISOString().split('T')[0], endSearch.toISOString().split('T')[0]]);

        // Build occupied map
        const occupiedDates = new Map();
        blocks.forEach(b => {
            const dateStr = new Date(b.date).toISOString().split('T')[0];
            occupiedDates.set(dateStr, parseFloat(b.total_hours));
        });

        // Calculate delivery date
        let remainingHours = totalHours;
        const currentDate = new Date(start);
        const maxIterations = 365;
        let iterations = 0;
        let workDays = 0;

        while (remainingHours > 0 && iterations < maxIterations) {
            const dayOfWeek = currentDate.getDay();

            // Skip weekends
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                currentDate.setDate(currentDate.getDate() + 1);
                iterations++;
                continue;
            }

            const dateKey = currentDate.toISOString().split('T')[0];
            const occupiedHours = occupiedDates.get(dateKey) || 0;
            const availableHours = Math.max(0, dailyDedication - occupiedHours);

            if (availableHours > 0) {
                remainingHours -= availableHours;
                workDays++;
            }

            currentDate.setDate(currentDate.getDate() + 1);
            iterations++;
        }

        // Go back one day since we advanced past the completion date
        currentDate.setDate(currentDate.getDate() - 1);

        res.json({
            estimatedDate: currentDate.toISOString().split('T')[0],
            workDays,
            totalHours,
            dailyDedication
        });
    } catch (err) {
        console.error('Error calculating delivery date:', err);
        res.status(500).json({ error: 'Error calculating delivery date' });
    }
});

// =============================================================================
// CONVERT SHADOW TO SOLID (When project is confirmed)
// =============================================================================

/**
 * Convert shadow blocks to solid blocks for a project
 */
router.post('/confirm-project-blocks/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project ownership
        const [projects] = await pool.query(
            'SELECT id FROM projects WHERE id = ? AND user_id = ?',
            [projectId, req.user.id]
        );

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Convert shadow blocks to solid
        const [result] = await pool.query(`
            UPDATE capacity_blocks 
            SET is_shadow = FALSE 
            WHERE project_id = ? AND user_id = ?
        `, [projectId, req.user.id]);

        res.json({
            message: 'Blocks confirmed',
            blocksUpdated: result.affectedRows
        });
    } catch (err) {
        console.error('Error confirming project blocks:', err);
        res.status(500).json({ error: 'Error confirming blocks' });
    }
});

// =============================================================================
// GENERATE BLOCKS FOR PROJECT
// =============================================================================

/**
 * Auto-generate capacity blocks for a project based on estimated hours
 */
router.post('/generate-project-blocks', async (req, res) => {
    try {
        const { projectId, totalHours, dailyDedication = 4, startDate, isShadow = true } = req.body;

        if (!projectId || !totalHours) {
            return res.status(400).json({ error: 'projectId and totalHours are required' });
        }

        // Verify project
        const [projects] = await pool.query(`
            SELECT p.id, c.name as client_name, p.plan
            FROM projects p
            JOIN clients c ON p.client_id = c.id
            WHERE p.id = ? AND p.user_id = ?
        `, [projectId, req.user.id]);

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = projects[0];
        const title = `${project.client_name} - ${project.plan || 'Proyecto'}`;

        // Delete existing blocks for this project (if regenerating)
        await pool.query(
            'DELETE FROM capacity_blocks WHERE project_id = ? AND user_id = ?',
            [projectId, req.user.id]
        );

        // Generate blocks
        const start = startDate ? new Date(startDate) : new Date();
        let remainingHours = totalHours;
        const currentDate = new Date(start);
        const blocksToInsert = [];
        const maxIterations = 365;
        let iterations = 0;

        while (remainingHours > 0 && iterations < maxIterations) {
            const dayOfWeek = currentDate.getDay();

            // Skip weekends
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                const hoursToday = Math.min(remainingHours, dailyDedication);
                remainingHours -= hoursToday;

                blocksToInsert.push([
                    req.user.id,
                    projectId,
                    title,
                    'production',
                    currentDate.toISOString().split('T')[0],
                    hoursToday,
                    null,
                    isShadow,
                    null
                ]);
            }

            currentDate.setDate(currentDate.getDate() + 1);
            iterations++;
        }

        // Bulk insert
        if (blocksToInsert.length > 0) {
            await pool.query(`
                INSERT INTO capacity_blocks 
                (user_id, project_id, title, block_type, date, hours, start_time, is_shadow, notes)
                VALUES ?
            `, [blocksToInsert]);
        }

        res.json({
            message: 'Blocks generated',
            blocksCreated: blocksToInsert.length,
            estimatedEndDate: currentDate.toISOString().split('T')[0]
        });
    } catch (err) {
        console.error('Error generating project blocks:', err);
        res.status(500).json({ error: 'Error generating blocks' });
    }
});

export default router;
