import express from 'express';
import pool from '../db.js';
import { verifyToken } from './auth.js';

const router = express.Router();

router.use(verifyToken);

// --- Projects ---

router.get('/projects', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT p.*, c.name as clientName, mt.monthly_tasks as maintenance_tasks_json
      FROM projects p 
      JOIN clients c ON p.client_id = c.id 
      LEFT JOIN maintenance_tasks mt ON p.id = mt.project_id
      WHERE p.user_id = ?
    `, [req.user.id]);

        // Parse JSON fields and map snake_case to camelCase
        const projects = rows.map(p => ({
            id: String(p.id),
            clientId: String(p.client_id),
            clientName: p.clientName,
            planType: p.plan || 'Single Page',
            status: p.status,
            paymentStatus: p.payment_status,
            maintenanceStatus: p.maintenance_status,
            deadline: p.end_date,
            alertNeeds: p.alert_needs,
            description: p.description,
            discoveryData: typeof p.discovery_data === 'string' ? JSON.parse(p.discovery_data) : p.discovery_data,
            checklists: typeof p.checklists === 'string' ? JSON.parse(p.checklists) : p.checklists,
            devUrl: p.dev_url,
            blockedStatus: p.blocked_status,
            blockedReason: p.blocked_reason,
            blockedSince: p.blocked_since,
            // Pricing fields
            basePrice: p.base_price,
            customPrice: p.custom_price,
            discount: p.discount,
            discountType: p.discount_type,
            finalPrice: p.final_price,
            pricingNotes: p.pricing_notes,
            // Maintenance
            nextMaintenanceDate: p.nextMaintenanceDate || (() => {
                if (!p.maintenance_tasks_json) return undefined;
                try {
                    const tasks = typeof p.maintenance_tasks_json === 'string'
                        ? JSON.parse(p.maintenance_tasks_json)
                        : p.maintenance_tasks_json;
                    const next = Array.isArray(tasks) ? tasks.find(t => !t.completed) : null;
                    return next ? next.date : undefined;
                } catch (e) { return undefined; }
            })()
        }));

        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching projects' });
    }
});

router.post('/projects', async (req, res) => {
    const p = req.body;
    try {
        const [result] = await pool.query(`
      INSERT INTO projects (user_id, client_id, name, description, start_date, end_date, status, checklists, discovery_data, plan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            req.user.id,
            p.clientId,
            p.clientName || '',
            p.description || '',
            p.startDate || null,
            p.deadline,
            p.status || '1. Discovery',
            JSON.stringify(p.checklists || {}),
            JSON.stringify(p.discoveryData || {}),
            p.planType || p.plan
        ]);
        res.json({ id: result.insertId, ...p });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating project' });
    }
});

router.put('/projects/:id', async (req, res) => {
    const p = req.body;
    const { id } = req.params;

    if (process.env.NODE_ENV === 'development') {
        console.log('[UPDATE PROJECT]', id, 'user:', req.user.id);
    }

    try {
        await pool.query(`
      UPDATE projects SET 
        status = ?, 
        payment_status = ?,
        maintenance_status = ?,
        checklists = ?, 
        discovery_data = ?,
        end_date = ?,
        plan = ?,
        dev_url = ?,
        description = ?,
        blocked_status = ?,
        blocked_reason = ?,
        blocked_since = ?,
        base_price = ?,
        custom_price = ?,
        discount = ?,
        discount_type = ?,
        final_price = ?,
        pricing_notes = ?,
        proposal_token = ?
      WHERE id = ? AND user_id = ?
    `, [
            p.status,
            p.paymentStatus,
            p.maintenanceStatus,
            JSON.stringify(p.checklists),
            JSON.stringify(p.discoveryData),
            p.deadline || p.endDate, // Fix: Frontend sends deadline
            p.planType || p.plan,    // Fix: Frontend sends planType
            p.devUrl,
            p.description,
            p.blockedStatus,
            p.blockedReason,
            p.blockedSince,
            p.basePrice,
            p.customPrice,
            p.discount,
            p.discountType,
            p.finalPrice,
            p.pricingNotes,
            p.proposalToken, // Add token
            id,
            req.user.id
        ]);

        // Trigger Maintenance Task Creation if Delivered
        if (p.status === '7. Entregado') {
            const [existing] = await pool.query('SELECT id FROM maintenance_tasks WHERE project_id = ?', [id]);
            if (existing.length === 0) {
                const checklist = [
                    { id: '1', text: 'Verificar estado online (Uptime)' },
                    { id: '2', text: 'Backup Manual (UpdraftPlus) a nube externa' },
                    { id: '3', text: 'Revisión de Logs de Seguridad (Bloqueos/Intentos de login)' },
                    { id: '4', text: 'Actualización de Plugins (Uno a uno/Lote)' },
                    { id: '5', text: 'Actualización de WordPress Core y Tema' },
                    { id: '6', text: 'Limpieza de SPAM y vaciado de Caché' },
                    { id: '7', text: 'Test visual en incógnito y prueba de formularios' }
                ];

                const monthlyTasks = [];
                const now = Date.now();
                // Generate only 2 months initially (Free Period)
                for (let i = 1; i <= 2; i++) {
                    monthlyTasks.push({
                        id: String(now + i),
                        month: i,
                        date: new Date(now + i * 30 * 24 * 60 * 60 * 1000).toISOString(),
                        completed: false,
                        checklist: checklist.map(c => ({ ...c, completed: false })),
                        reportSent: false
                    });
                }

                const createdAt = new Date().toISOString();
                const freeUntil = new Date(now + 60 * 24 * 60 * 60 * 1000).toISOString();

                await pool.query(`
                    INSERT INTO maintenance_tasks (user_id, project_id, created_at, free_until, status, monthly_tasks)
                    VALUES (?, ?, ?, ?, ?, ?)
                 `, [req.user.id, id, createdAt, freeUntil, 'active', JSON.stringify(monthlyTasks)]);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating project' });
    }
});

router.delete('/projects/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting project' });
    }
});

// --- Clients ---

router.get('/clients', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clients WHERE user_id = ?', [req.user.id]);

        const safeDate = (d) => {
            try {
                if (!d) return new Date().toISOString().split('T')[0];
                return new Date(d).toISOString().split('T')[0];
            } catch (e) {
                return new Date().toISOString().split('T')[0];
            }
        };

        const clients = rows.map(c => ({
            id: String(c.id),
            name: c.name,
            email: c.email,
            phone: c.phone,
            company: c.company,
            registeredAt: safeDate(c.created_at),
            notes: c.notes
        }));
        res.json(clients);
    } catch (err) {
        console.error('Error fetching clients:', err);
        res.status(500).json({ error: 'Error fetching clients' });
    }
});

router.post('/clients', async (req, res) => {
    const c = req.body;
    try {
        const [result] = await pool.query(`
      INSERT INTO clients (user_id, name, email, phone, company, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, [req.user.id, c.name, c.email, c.phone, c.company]);
        res.json({ id: result.insertId, ...c });
    } catch (err) {
        res.status(500).json({ error: 'Error creating client' });
    }
});

router.put('/clients/:id', async (req, res) => {
    const c = req.body;
    const { id } = req.params;
    try {
        await pool.query(`
      UPDATE clients 
      SET name = ?, email = ?, phone = ?, company = ?
      WHERE id = ? AND user_id = ?
    `, [c.name, c.email, c.phone, c.company, id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error updating client' });
    }
});

router.delete('/clients/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM clients WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting client' });
    }
});

// --- Finance ---

router.get('/finances', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM finance WHERE user_id = ?', [req.user.id]);
        const finances = rows.map(f => ({
            id: String(f.id),
            projectId: f.project_id ? String(f.project_id) : undefined,
            type: f.type,
            amount: f.amount,
            description: f.description,
            date: f.date
        }));
        res.json(finances);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching finances' });
    }
});

router.post('/finances', async (req, res) => {
    const f = req.body;
    try {
        const [result] = await pool.query(`
      INSERT INTO finance (user_id, project_id, type, amount, description, date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'completed')
    `, [req.user.id, f.projectId || null, f.type, f.amount, f.description, f.date]);
        res.json({ id: result.insertId, ...f });
    } catch (err) {
        res.status(500).json({ error: 'Error creating finance record' });
    }
});

router.delete('/finances/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM finance WHERE id = ? AND user_id = ?', [id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting finance record' });
    }
});

// --- Logs ---

router.get('/logs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM project_logs WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        const logs = rows.map(l => ({
            id: String(l.id),
            projectId: String(l.project_id),
            comment: l.message,
            createdAt: l.created_at,
            author: 'Admin'
        }));
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching logs' });
    }
});

router.post('/logs', async (req, res) => {
    const l = req.body;
    try {
        const [result] = await pool.query(`
      INSERT INTO project_logs (user_id, project_id, message)
      VALUES (?, ?, ?)
    `, [req.user.id, l.projectId, l.comment]);
        res.json({ id: result.insertId, ...l });
    } catch (err) {
        res.status(500).json({ error: 'Error creating log' });
    }
});

router.put('/logs/:id', async (req, res) => {
    const l = req.body;
    try {
        await pool.query('UPDATE project_logs SET message = ? WHERE id = ? AND user_id = ?', [l.comment, req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error updating log' });
    }
});

export default router;
