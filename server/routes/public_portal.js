import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify Portal Token (JWT)
const verifyPortalAuth = (req, res, next) => {
    const token = req.headers['x-portal-token'];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.portalToken = decoded.portalToken;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Check Portal Status (Public)
router.get('/:token/check', async (req, res) => {
    const { token } = req.params;

    try {
        const [projects] = await pool.query(
            'SELECT id, portal_enabled, portal_expires_at, name, client_id FROM projects WHERE portal_token = ?',
            [token]
        );

        if (projects.length === 0 || !projects[0].portal_enabled) {
            return res.status(404).json({ error: 'Portal not found or disabled' });
        }

        const project = projects[0];

        // Check expiration
        if (project.portal_expires_at && new Date(project.portal_expires_at) < new Date()) {
            // Auto-disable if expired
            await pool.query('UPDATE projects SET portal_enabled = FALSE WHERE id = ?', [project.id]);
            return res.status(410).json({ error: 'Portal expired', contact: 'admin@agency.com' }); // TODO: Get real contact info
        }

        // Get Client Name
        const [clients] = await pool.query('SELECT name FROM clients WHERE id = ?', [project.client_id]);
        const clientName = clients[0]?.name || 'Cliente';

        res.json({
            exists: true,
            project: project.name,
            client: clientName,
            requiresPin: true
        });

    } catch (err) {
        console.error('Error checking portal:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Authenticate with PIN (Public)
router.post('/:token/auth', async (req, res) => {
    const { token } = req.params;
    const { pin } = req.body;

    try {
        const [projects] = await pool.query(
            'SELECT id, portal_pin, portal_enabled FROM projects WHERE portal_token = ?',
            [token]
        );

        if (projects.length === 0 || !projects[0].portal_enabled) {
            return res.status(404).json({ error: 'Portal not found' });
        }

        if (projects[0].portal_pin !== pin) {
            return res.status(401).json({ error: 'Invalid PIN' });
        }

        // Generate Session Token
        const sessionToken = jwt.sign({ portalToken: token, projectId: projects[0].id }, process.env.JWT_SECRET, { expiresIn: '2h' });

        res.json({ token: sessionToken });

    } catch (err) {
        console.error('Error authenticating portal:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Portal Data (Protected by Session Token)
router.get('/:token/data', verifyPortalAuth, async (req, res) => {
    const { token } = req.params; // URL token (UUID)
    // req.portalToken is from JWT

    if (token !== req.portalToken) {
        return res.status(403).json({ error: 'Token mismatch' });
    }

    try {
        const [projects] = await pool.query(`
            SELECT p.id, p.name, p.description, p.status, p.start_date, p.end_date, 
                   p.drive_link, p.requirements, p.portal_expires_at,
                   p.base_price, p.custom_price, p.discount, p.discount_type, 
                   p.final_price, p.plan as planType,
                   p.delivery_data,
                   p.is_hourly_quote, p.custom_hours, p.hourly_rate
            FROM projects p 
            WHERE p.portal_token = ?
        `, [token]);

        if (projects.length === 0) return res.status(404).json({ error: 'Project not found' });
        const project = projects[0];

        // Get Milestones
        const [milestones] = await pool.query(
            'SELECT title, status, sort_order FROM project_milestones WHERE project_id = ? ORDER BY sort_order ASC',
            [project.id]
        );

        // Get Add-ons
        const [addOns] = await pool.query(
            'SELECT name, price FROM project_add_ons WHERE project_id = ?',
            [project.id]
        );
        const addOnsTotal = addOns.reduce((sum, addon) => sum + parseFloat(addon.price || 0), 0);

        // Calculate final price
        const basePrice = parseFloat(project.base_price || 0);
        const customPrice = project.custom_price ? parseFloat(project.custom_price) : null;
        const discount = parseFloat(project.discount || 0);
        const discountType = project.discount_type || 'percentage';
        const isHourlyQuote = Boolean(project.is_hourly_quote);
        const customHours = parseFloat(project.custom_hours || 0);
        const hourlyRate = parseFloat(project.hourly_rate || 0);

        let startingPrice = 0;

        if (isHourlyQuote) {
            // Hourly Quote Calculation
            startingPrice = customHours * hourlyRate;
        } else {
            // Standard Plan Calculation
            const subtotal = basePrice + addOnsTotal;
            startingPrice = customPrice && customPrice > 0 ? customPrice : subtotal;
        }

        let calculatedFinalPrice = startingPrice;
        if (discount > 0) {
            if (discountType === 'percentage') {
                calculatedFinalPrice = startingPrice * (1 - discount / 100);
            } else {
                calculatedFinalPrice = startingPrice - discount;
            }
        }
        calculatedFinalPrice = Math.max(0, Math.round(calculatedFinalPrice * 100) / 100);

        // Check if resources were confirmed
        const [logs] = await pool.query(
            'SELECT id FROM project_logs WHERE project_id = ? AND message = ? LIMIT 1',
            [project.id, 'Cliente confirmó envío de recursos y pago desde el Portal']
        );
        const resourcesSent = logs.length > 0;

        // Filter milestones for "Fog of War"
        // Show all 'completed' and 'active'.
        // If 'active' exists, show it.
        // If no 'active', show next 'pending' as 'active' (or handled by admin).
        // Admin manages status manually. So we just return what's in DB, but maybe filter out 'pending' if we want strictly invisible future?
        // User requirement: "Futuro: INVISIBLE".
        // So we filter out 'pending' milestones?
        // "Presente: Hito actual con animación de pulso (Trabajando)".
        // "Pasado: Hitos completados (Verde)".
        // So we return 'completed' and 'active'. 'pending' should be hidden.

        const visibleMilestones = milestones.filter(m => m.status === 'completed' || m.status === 'active');

        res.json({
            project: {
                ...project,
                finalPrice: calculatedFinalPrice, // Calculated price including add-ons
                isHourlyQuote: Boolean(project.is_hourly_quote),
                customHours: parseFloat(project.custom_hours || 0),
                hourlyRate: parseFloat(project.hourly_rate || 0),
                addOns: addOns, // Include full add-ons list
                advancePercentage: project.advance_percentage || 50,
                advancePaymentInfo: project.advance_payment_info,
                driveLink: project.drive_link,  // Convert to camelCase
                requirements: typeof project.requirements === 'string' ? JSON.parse(project.requirements) : project.requirements,
                deliveryData: typeof project.delivery_data === 'string' ? JSON.parse(project.delivery_data) : project.delivery_data,
                resourcesSent
            },
            milestones: visibleMilestones
        });

    } catch (err) {
        console.error('Error fetching portal data:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handle Actions (Approve, Resources Sent)
router.post('/:token/action', verifyPortalAuth, async (req, res) => {
    const { token } = req.params;
    const { action } = req.body; // 'approve_proposal', 'confirm_resources'

    try {
        const [projects] = await pool.query('SELECT id, user_id, status FROM projects WHERE portal_token = ?', [token]);
        if (projects.length === 0) return res.status(404).json({ error: 'Project not found' });
        const project = projects[0];

        if (action === 'approve_proposal') {
            // Advance to Stage 3 (Waiting Resources)
            // Assuming current stage is Proposal (Stage 2?)
            await pool.query('UPDATE projects SET status = ? WHERE id = ?', ['3. Espera Recursos', project.id]);
            await pool.query('INSERT INTO project_logs (user_id, project_id, message) VALUES (?, ?, ?)',
                [project.user_id, project.id, 'Cliente aprobó propuesta desde el Portal']);

            return res.json({ success: true, newStatus: '3. Espera Recursos' });
        }


        if (action === 'confirm_resources') {
            // Notify Admin (Log)
            await pool.query('INSERT INTO project_logs (user_id, project_id, message) VALUES (?, ?, ?)',
                [project.user_id, project.id, 'Cliente confirmó envío de recursos y pago desde el Portal']);

            // Do NOT advance status automatically (as per requirements)
            return res.json({ success: true, message: 'Notified' });
        }

        if (action === 'confirm_advance') {
            const { paymentInfo } = req.body;

            // Save advance payment info
            await pool.query('UPDATE projects SET advance_payment_info = ? WHERE id = ?', [paymentInfo, project.id]);

            // Log the action
            await pool.query('INSERT INTO project_logs (user_id, project_id, message) VALUES (?, ?, ?)',
                [project.user_id, project.id, `Cliente confirmó anticipo: ${paymentInfo}`]);

            return res.json({ success: true, message: 'Advance payment info saved' });
        }

        res.status(400).json({ error: 'Invalid action' });

    } catch (err) {
        console.error('Error handling portal action:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
