import express from 'express';
const router = express.Router();
import { verifyToken } from './auth.js';
import pool from '../db.js';

/**
 * GET /api/maintenance/:projectId
 * Obtener tarea de mantenimiento de un proyecto
 */
router.get('/:projectId', verifyToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM maintenance_tasks WHERE project_id = ? AND user_id = ?',
            [projectId, req.user.id]
        );

        if (rows.length === 0) {
            return res.json(null);
        }

        const task = rows[0];
        const monthlyTasks = typeof task.monthly_tasks === 'string'
            ? JSON.parse(task.monthly_tasks || '[]')
            : (task.monthly_tasks || []);

        res.json({
            id: String(task.id),
            projectId: String(task.project_id),
            createdAt: task.created_at,
            freeUntil: task.free_until,
            status: task.status,
            monthlyTasks: monthlyTasks
        });
    } catch (err) {
        console.error('Error fetching maintenance:', err);
        res.status(500).json({ error: 'Error fetching maintenance task' });
    }
});

/**
 * POST /api/maintenance
 * Crear nueva tarea de mantenimiento (trigger automático)
 */
router.post('/', verifyToken, async (req, res) => {
    const { projectId, createdAt, freeUntil, status, monthlyTasks } = req.body;

    try {
        const [result] = await pool.query(`
            INSERT INTO maintenance_tasks (user_id, project_id, created_at, free_until, status, monthly_tasks)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            req.user.id,
            projectId,
            createdAt,
            freeUntil,
            status,
            JSON.stringify(monthlyTasks)
        ]);

        res.json({
            id: String(result.insertId),
            projectId,
            createdAt,
            freeUntil,
            status,
            monthlyTasks
        });
    } catch (err) {
        console.error('Error creating maintenance:', err);
        res.status(500).json({ error: 'Error creating maintenance task' });
    }
});

/**
 * PUT /api/maintenance/:id
 * Actualizar tarea de mantenimiento (checklist)
 */
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { monthlyTasks, status } = req.body;

    try {
        await pool.query(
            'UPDATE maintenance_tasks SET monthly_tasks = ?, status = ? WHERE id = ? AND user_id = ?',
            [JSON.stringify(monthlyTasks), status, id, req.user.id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating maintenance:', err);
        res.status(500).json({ error: 'Error updating maintenance task' });
    }
});

/**
 * POST /api/maintenance/:id/complete-task
 * Marcar tarea mensual como completada
 */
router.post('/:id/complete-task', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { monthIndex } = req.body;

    console.log('[COMPLETE-TASK] Received:', { id, monthIndex });

    try {
        // Get current task
        const [rows] = await pool.query(
            'SELECT monthly_tasks, created_at FROM maintenance_tasks WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Maintenance task not found' });
        }

        const monthlyTasks = typeof rows[0].monthly_tasks === 'string'
            ? JSON.parse(rows[0].monthly_tasks || '[]')
            : (rows[0].monthly_tasks || []);
        console.log('[COMPLETE-TASK] Before:', {
            taskCount: monthlyTasks.length,
            monthIndexTask: monthlyTasks[monthIndex]?.month,
            completed: monthlyTasks[monthIndex]?.completed
        });

        if (monthlyTasks[monthIndex]) {
            monthlyTasks[monthIndex].completed = true;

            // Check if this is the last month in the current set
            const maxMonth = Math.max(...monthlyTasks.map(t => t.month));

            // Logic: If we are completing the last available month, deactivate maintenance.
            // This applies to both the initial 2-month period and any manually added periods.
            if (monthlyTasks[monthIndex].month === maxMonth) {
                console.log('[COMPLETE-TASK] Last month completed. Deactivating maintenance.');

                // Update project status to inactive
                await pool.query(
                    'UPDATE projects SET maintenance_status = ? WHERE id = ?',
                    ['inactive', rows[0].project_id]
                );

                // Update maintenance task status to inactive
                await pool.query(
                    'UPDATE maintenance_tasks SET status = ? WHERE id = ?',
                    ['inactive', id]
                );
            }
        }

        console.log('[COMPLETE-TASK] After:', { taskCount: monthlyTasks.length });

        await pool.query(
            'UPDATE maintenance_tasks SET monthly_tasks = ? WHERE id = ?',
            [JSON.stringify(monthlyTasks), id]
        );

        console.log('[COMPLETE-TASK] Saved successfully');
        res.json({ success: true });
    } catch (err) {
        console.error('Error completing task:', err);
        res.status(500).json({ error: 'Error completing task' });
    }
});

/**
 * POST /api/maintenance/:id/reactivate
 * Reactivar mantenimiento (agregar meses + pago)
 */
router.post('/:id/reactivate', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { monthsToAdd, amount } = req.body;

    try {
        // Get current task
        const [rows] = await pool.query(
            'SELECT * FROM maintenance_tasks WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Maintenance task not found' });
        }

        const task = rows[0];
        const monthlyTasks = typeof task.monthly_tasks === 'string'
            ? JSON.parse(task.monthly_tasks || '[]')
            : (task.monthly_tasks || []);

        const maxMonth = Math.max(...monthlyTasks.map(t => t.month), 0);
        const checklist = [
            { id: '1', text: 'Verificar estado online (Uptime)', completed: false },
            { id: '2', text: 'Backup Manual (UpdraftPlus) a nube externa', completed: false },
            { id: '3', text: 'Revisión de Logs de Seguridad (Bloqueos/Intentos de login)', completed: false },
            { id: '4', text: 'Actualización de Plugins (Uno a uno/Lote)', completed: false },
            { id: '5', text: 'Actualización de WordPress Core y Tema', completed: false },
            { id: '6', text: 'Limpieza de SPAM y vaciado de Caché', completed: false },
            { id: '7', text: 'Test visual en incógnito y prueba de formularios', completed: false }
        ];

        const createdAt = new Date(task.created_at);

        for (let i = 1; i <= monthsToAdd; i++) {
            const nextMonth = maxMonth + i;
            const nextDate = new Date(createdAt.getTime() + nextMonth * 30 * 24 * 60 * 60 * 1000);

            monthlyTasks.push({
                id: String(Date.now() + i),
                month: nextMonth,
                date: nextDate.toISOString(),
                completed: false,
                checklist: checklist.map(c => ({ ...c })),
                reportSent: false
            });
        }

        // Update maintenance tasks
        await pool.query(
            'UPDATE maintenance_tasks SET monthly_tasks = ?, status = ? WHERE id = ?',
            [JSON.stringify(monthlyTasks), 'active', id]
        );

        // Update project status
        await pool.query(
            'UPDATE projects SET maintenance_status = ? WHERE id = ?',
            ['active', task.project_id]
        );

        // Create Finance Record
        await pool.query(`
            INSERT INTO finance (user_id, project_id, type, amount, description, date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            req.user.id,
            task.project_id,
            'Ingreso',
            amount,
            `Pago Mantenimiento (${monthsToAdd} meses)`,
            new Date().toISOString().split('T')[0],
            'completed'
        ]);

        res.json({ success: true });
    } catch (err) {
        console.error('Error reactivating maintenance:', err);
        res.status(500).json({ error: 'Error reactivating maintenance' });
    }
});

export default router;
