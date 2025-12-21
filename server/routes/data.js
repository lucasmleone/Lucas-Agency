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
            endDate: p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : null,
            alertNeeds: p.alert_needs,
            description: p.description,
            discoveryData: typeof p.discovery_data === 'string' ? JSON.parse(p.discovery_data) : p.discovery_data,
            deliveryData: typeof p.delivery_data === 'string' ? JSON.parse(p.delivery_data) : p.delivery_data,
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
            finalPrice: p.final_price,
            pricingNotes: p.pricing_notes,
            isHourlyQuote: Boolean(p.is_hourly_quote),
            customHours: p.custom_hours,
            hourlyRate: p.hourly_rate,
            advancePercentage: p.advance_percentage,
            advancePaymentInfo: p.advance_payment_info,
            // Portal fields
            portalToken: p.portal_token,
            portalPin: p.portal_pin,
            portalEnabled: Boolean(p.portal_enabled),
            portalExpiresAt: p.portal_expires_at,
            driveLink: p.drive_link,
            requirements: typeof p.requirements === 'string' ? JSON.parse(p.requirements) : p.requirements,
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
            })(),
            // Time Tracking
            estimatedHours: p.estimated_hours ? parseFloat(p.estimated_hours) : undefined,
            hoursCompleted: p.hours_completed ? parseFloat(p.hours_completed) : 0,
            quotedDeliveryDate: p.quoted_delivery_date,
            confirmedDeliveryDate: p.confirmed_delivery_date,
            dailyDedication: p.daily_dedication ? parseFloat(p.daily_dedication) : 4,
            bufferPercentage: p.buffer_percentage !== null && p.buffer_percentage !== undefined ? parseInt(p.buffer_percentage) : 30,
        }));

        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching projects' });
    }
});

router.post('/projects', async (req, res) => {
    const p = req.body;

    // Helper to convert date to MySQL DATE format
    // If already in YYYY-MM-DD format, return as-is to avoid timezone issues
    const toMySQLDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            // Check if already in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }
            // Otherwise convert ISO datetime to date
            return new Date(dateStr).toISOString().split('T')[0];
        } catch (e) {
            return null;
        }
    };

    try {
        const [result] = await pool.query(`
      INSERT INTO projects (user_id, client_id, name, description, start_date, end_date, status, checklists, discovery_data, plan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            req.user.id,
            p.clientId,
            p.clientName || '',
            p.description || '',
            toMySQLDate(p.startDate),
            toMySQLDate(p.deadline),
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

    // Helper to convert date to MySQL DATE format
    // If already in YYYY-MM-DD format, return as-is to avoid timezone issues
    const toMySQLDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            // Check if already in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }
            // Otherwise convert ISO datetime to date
            return new Date(dateStr).toISOString().split('T')[0];
        } catch (e) {
            return null;
        }
    };

    if (process.env.NODE_ENV === 'development' || true) { // Force log for debugging

    }

    try {
        // Auto-expiry logic temporarily disabled to fix 500 error
        // let portalExpiresAt = null;
        // if (p.status === '7. Entregado' || p.status === ProjectStatus?.DELIVERED) {
        //     const expiryDate = new Date();
        //     expiryDate.setDate(expiryDate.getDate() + 10); // 10 days from now
        //     portalExpiresAt = expiryDate.toISOString().slice(0, 19).replace('T', ' '); // MySQL DATETIME format
        // }

        // Dynamic Update Query Builder
        const updates = [];
        const values = [];

        // Auto-cleanup: If project is marked as DELIVERED, remove future production blocks
        if (p.status === '7. Entregado' || p.status === 'Delivered') {
            try {
                const today = new Date().toISOString().split('T')[0];
                await pool.query(`
                    DELETE FROM capacity_blocks 
                    WHERE project_id = ? 
                    AND block_type = 'production' 
                    AND date > ?
                `, [id, today]);
                console.log(`Cleaned up future production blocks for project ${id}`);
            } catch (cleanupErr) {
                console.error('Error auto-cleaning blocks:', cleanupErr);
            }
        }

        const addUpdate = (field, value, isJson = false, isDate = false) => {
            // Special handling: if value is explicitly null, set to NULL in DB
            // This allows clearing fields like customPrice
            if (value === null) {
                updates.push(`${field} = NULL`);
            } else if (value !== undefined) {
                updates.push(`${field} = ?`);
                if (isJson) values.push(JSON.stringify(value));
                else if (isDate) values.push(toMySQLDate(value));
                else values.push(value);
            }
        };

        addUpdate('status', p.status);
        addUpdate('payment_status', p.paymentStatus);
        addUpdate('maintenance_status', p.maintenanceStatus);
        addUpdate('checklists', p.checklists, true);
        addUpdate('discovery_data', p.discoveryData, true);
        addUpdate('delivery_data', p.deliveryData, true); // Add delivery_data
        addUpdate('end_date', p.deadline || p.endDate, false, true);
        addUpdate('plan', p.planType || p.plan);
        addUpdate('dev_url', p.devUrl);
        addUpdate('description', p.description);
        addUpdate('blocked_status', p.blockedStatus);
        addUpdate('blocked_reason', p.blockedReason);
        addUpdate('blocked_since', p.blockedSince, false, true);
        addUpdate('base_price', p.basePrice);
        addUpdate('custom_price', p.customPrice);
        addUpdate('discount', p.discount);
        addUpdate('discount_type', p.discountType);
        addUpdate('final_price', p.finalPrice);
        addUpdate('final_price', p.finalPrice);
        addUpdate('pricing_notes', p.pricingNotes);
        addUpdate('is_hourly_quote', p.isHourlyQuote);
        addUpdate('custom_hours', p.customHours);
        addUpdate('hourly_rate', p.hourlyRate);
        addUpdate('advance_percentage', p.advancePercentage);
        addUpdate('advance_payment_info', p.advancePaymentInfo);
        addUpdate('portal_token', p.portalToken);
        addUpdate('portal_pin', p.portalPin);
        addUpdate('portal_enabled', p.portalEnabled);
        addUpdate('drive_link', p.driveLink);
        addUpdate('requirements', p.requirements, true); // JSON field
        // Time Tracking Fields
        addUpdate('estimated_hours', p.estimatedHours);
        addUpdate('hours_completed', p.hoursCompleted);
        addUpdate('quoted_delivery_date', p.quotedDeliveryDate, false, true);
        addUpdate('confirmed_delivery_date', p.confirmedDeliveryDate, false, true);
        addUpdate('daily_dedication', p.dailyDedication);
        addUpdate('buffer_percentage', p.bufferPercentage);

        if (updates.length === 0) return res.json({ success: true, message: 'No updates provided' });

        values.push(id);
        values.push(req.user.id);

        await pool.query(`UPDATE projects SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, values);

        // SYNC BLOCK SHADOW STATUS BASED ON PROJECT STAGE
        if (p.status) {
            const productionStages = ['5. Producción', '6. Cancelado', '7. Entregado'];
            const isProductionOrLater = productionStages.includes(p.status);

            if (p.status === '7. Entregado') {
                // Delivered: Complete today's block, delete future blocks
                const today = new Date().toISOString().split('T')[0];

                // Mark today's block as completed
                await pool.query(`
                    UPDATE capacity_blocks 
                    SET completed = TRUE, is_shadow = FALSE 
                    WHERE project_id = ? AND user_id = ? AND date = ?
                `, [id, req.user.id, today]);

                // Delete future blocks
                await pool.query(`
                    DELETE FROM capacity_blocks 
                    WHERE project_id = ? AND user_id = ? AND date > ?
                `, [id, req.user.id, today]);

                // Update end_date to today
                await pool.query(`
                    UPDATE projects SET end_date = ? WHERE id = ? AND user_id = ?
                `, [today, id, req.user.id]);

                console.log(`Project ${id} delivered: completed today's block, deleted future blocks`);
            } else if (isProductionOrLater) {
                // Production or Cancelled: Blocks should be solid (not shadow)
                await pool.query(`
                    UPDATE capacity_blocks SET is_shadow = FALSE 
                    WHERE project_id = ? AND user_id = ?
                `, [id, req.user.id]);
                console.log(`Project ${id} in production: blocks set to solid`);
            } else {
                // Before Production: Blocks should be shadow
                await pool.query(`
                    UPDATE capacity_blocks SET is_shadow = TRUE 
                    WHERE project_id = ? AND user_id = ?
                `, [id, req.user.id]);
                console.log(`Project ${id} before production: blocks set to shadow`);
            }
        }

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

                const createdAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
                const freeUntil = new Date(now + 60 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

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

        const clients = rows.map(c => ({
            id: String(c.id),
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            registeredAt: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            notes: c.notes || ''
        }));

        res.json(clients);
    } catch (err) {
        console.error('Error fetching clients:', err);
        res.status(500).json({ error: 'Error fetching clients', details: err.message });
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
            amount: Number(f.amount),
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
    `, [req.user.id, f.projectId || null, f.type, Number(f.amount), f.description, f.date]);
        res.json({ id: result.insertId, ...f, amount: Number(f.amount) });
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
