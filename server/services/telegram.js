import TelegramBot from 'node-telegram-bot-api';
import pool from '../db.js';

// Motivational and threatening quotes
const QUOTES = [
    // Motivational
    "💪 Cada bloque completado te acerca a la grandeza.",
    "🔥 Hoy es el día para demostrar de qué estás hecho.",
    "⚡ La disciplina es el puente entre metas y logros.",
    "🚀 Pequeños pasos, grandes resultados. A trabajar!",
    "✨ Tu futuro yo te agradecerá el esfuerzo de hoy.",
    "🎯 Enfocate, ejecuta, conquista.",
    "💎 La consistencia crea excelencia.",
    "🌟 Hoy es una oportunidad de ser mejor que ayer.",
    // Threatening / Intense
    "☠️ Si no completás las tareas, perdés la racha. Sin excusas.",
    "😈 La mediocridad está esperando que te rindas. No le des el gusto.",
    "🔪 O terminás vos las tareas, o las tareas te terminan a vos.",
    "💀 Cada tarea sin completar es un clavo en el ataúd de tus sueños.",
    "👊 Dejá de procrastinar o te saco del WhatsApp.",
    "🦁 Los leones no toman siestas cuando hay caza pendiente.",
    "⚔️ La guerra la ganan los que no abandonan el campo de batalla.",
    "🐺 Los lobos no negocian con la pereza. EXECUTE."
];

class TelegramService {
    constructor() {
        this.bot = null;
        this.isInitialized = false;
    }

    // Initialize bot with token
    initialize(token) {
        if (!token) {
            console.log('[Telegram] No token provided, bot disabled');
            return;
        }

        this.bot = new TelegramBot(token, { polling: true });
        this.isInitialized = true;

        this.setupCommands();
        console.log('[Telegram] Bot initialized and polling');
    }

    // Setup command handlers
    setupCommands() {
        // /start - Link account (simplified: auto-link to main user)
        this.bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
            const chatId = msg.chat.id;

            try {
                // Check if already linked
                const [existingUsers] = await pool.query(
                    'SELECT id FROM users WHERE telegram_chat_id = ?',
                    [chatId.toString()]
                );

                if (existingUsers.length > 0) {
                    this.bot.sendMessage(chatId,
                        `✅ *Ya estás vinculado!*\n\n` +
                        `Comandos:\n` +
                        `• /win - Completar todas las tareas del día\n` +
                        `• /status - Ver estado actual`,
                        { parse_mode: 'Markdown' }
                    );
                    return;
                }

                // Auto-link to user_id 2 (main user - single user system)
                const [result] = await pool.query(
                    'UPDATE users SET telegram_chat_id = ? WHERE id = 2',
                    [chatId.toString()]
                );

                if (result.affectedRows > 0) {
                    this.bot.sendMessage(chatId,
                        `✅ *¡Cuenta vinculada!*\n\n` +
                        `Vas a recibir:\n` +
                        `• Tus tareas del día a las 9am\n` +
                        `• Tu racha actual\n` +
                        `• Frases motivadoras/amenazadoras\n\n` +
                        `*Comandos:*\n` +
                        `• /win - Completar todas las tareas del día\n` +
                        `• /status - Ver estado actual\n\n` +
                        `🔥 A trabajar!`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    this.bot.sendMessage(chatId, '❌ Error al vincular. Contactá al administrador.');
                }
            } catch (err) {
                console.error('[Telegram] Error linking account:', err);
                this.bot.sendMessage(chatId, '❌ Error al vincular. Intentá de nuevo.');
            }
        });

        // /win - Complete all tasks
        this.bot.onText(/\/win/, async (msg) => {
            const chatId = msg.chat.id;

            try {
                // Get user by chat_id
                const [users] = await pool.query(
                    'SELECT id FROM users WHERE telegram_chat_id = ?',
                    [chatId.toString()]
                );

                if (users.length === 0) {
                    this.bot.sendMessage(chatId, '❌ Cuenta no vinculada. Usá /start CODIGO');
                    return;
                }

                const userId = users[0].id;

                // Argentina timezone
                const argentinaOffset = -3 * 60;
                const now = new Date();
                const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
                const today = argentinaTime.toISOString().split('T')[0];

                // Update all blocks for today as completed
                const [result] = await pool.query(
                    `UPDATE capacity_blocks 
                     SET completed = 1, completed_at = NOW() 
                     WHERE user_id = ? AND DATE(date) = ? AND is_shadow = 0 AND completed = 0`,
                    [userId, today]
                );

                if (result.affectedRows > 0) {
                    // Also trigger achievement check
                    await this.triggerAchievementCheck(userId);

                    this.bot.sendMessage(chatId,
                        `🏆 *¡VICTORIA!*\n\n` +
                        `✅ ${result.affectedRows} tareas completadas\n\n` +
                        `${this.getRandomQuote()}`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    this.bot.sendMessage(chatId, `✅ Ya completaste todas las tareas de hoy o no hay tareas pendientes.`);
                }
            } catch (err) {
                console.error('[Telegram] Error completing tasks:', err);
                this.bot.sendMessage(chatId, '❌ Error al completar tareas.');
            }
        });

        // /status - Current status
        this.bot.onText(/\/status/, async (msg) => {
            const chatId = msg.chat.id;
            await this.sendDailyStatus(chatId);
        });
    }

    // Send daily status to a chat
    async sendDailyStatus(chatId) {
        try {
            const [users] = await pool.query(
                'SELECT id FROM users WHERE telegram_chat_id = ?',
                [chatId.toString()]
            );

            if (users.length === 0) {
                this.bot.sendMessage(chatId, '❌ Cuenta no vinculada.');
                return;
            }

            const userId = users[0].id;

            // Get streak
            const [stats] = await pool.query(
                'SELECT current_streak FROM user_stats WHERE user_id = ?',
                [userId]
            );
            const streak = stats[0]?.current_streak || 0;

            // Get today's blocks
            const blocks = await this.getTodayBlocks(userId);

            let message = `📅 *Estado actual*\n\n`;
            message += `🔥 *Racha: ${streak} días*\n\n`;

            if (blocks.length === 0) {
                message += `No hay tareas programadas para hoy.\n`;
            } else {
                const completed = blocks.filter(b => b.completed).length;
                message += `*Progreso: ${completed}/${blocks.length}*\n\n`;

                blocks.forEach((block, i) => {
                    const icon = block.completed ? '✅' : '⬜';
                    message += `${icon} *${block.hours}h* - ${block.projectName}\n`;
                    if (block.notes) {
                        message += `   📝 ${block.notes}\n`;
                    }
                });
            }

            this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('[Telegram] Error sending status:', err);
        }
    }

    // Send daily morning message to all linked users
    async sendMorningMessages() {
        if (!this.isInitialized) return;

        try {
            const [users] = await pool.query(
                'SELECT id, telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL'
            );

            for (const user of users) {
                await this.sendMorningMessage(user.id, user.telegram_chat_id);
            }

            console.log(`[Telegram] Sent morning messages to ${users.length} users`);
        } catch (err) {
            console.error('[Telegram] Error sending morning messages:', err);
        }
    }

    // Send morning message to specific user
    async sendMorningMessage(userId, chatId) {
        try {
            // Get streak
            const [stats] = await pool.query(
                'SELECT current_streak FROM user_stats WHERE user_id = ?',
                [userId]
            );
            const streak = stats[0]?.current_streak || 0;

            // Get today's blocks
            const blocks = await this.getTodayBlocks(userId);

            let message = `☀️ *Buenos días! Es hora de trabajar*\n\n`;
            message += `🔥 *Racha actual: ${streak} días* ${streak >= 7 ? '🏆' : ''}\n\n`;

            if (blocks.length === 0) {
                message += `📋 No tenés tareas programadas para hoy.\n`;
                message += `Aprovechá para planificar o adelantar trabajo!\n`;
            } else {
                const totalHours = blocks.reduce((sum, b) => sum + b.hours, 0);
                message += `📋 *${blocks.length} tareas* (${totalHours}h total)\n\n`;

                blocks.forEach((block, i) => {
                    message += `${i + 1}. *${block.hours}h* - ${block.projectName}\n`;
                    if (block.notes) {
                        message += `   📝 _${block.notes}_\n`;
                    }
                });
            }

            message += `\n---\n`;
            message += `${this.getRandomQuote()}\n\n`;
            message += `_Respondé /win cuando termines todo_ 💪`;

            await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error(`[Telegram] Error sending to ${chatId}:`, err);
        }
    }

    // Get today's blocks for user
    async getTodayBlocks(userId) {
        const argentinaOffset = -3 * 60;
        const now = new Date();
        const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
        const today = argentinaTime.toISOString().split('T')[0];

        const [blocks] = await pool.query(`
            SELECT cb.id, cb.hours, cb.notes, cb.completed, p.name as projectName
            FROM capacity_blocks cb
            LEFT JOIN projects p ON cb.project_id = p.id
            WHERE cb.user_id = ? AND DATE(cb.date) = ? AND cb.is_shadow = 0
            ORDER BY cb.id
        `, [userId, today]);

        return blocks;
    }

    // Trigger achievement check after completing tasks
    async triggerAchievementCheck(userId) {
        try {
            const argentinaOffset = -3 * 60;
            const now = new Date();
            const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
            const today = argentinaTime.toISOString().split('T')[0];

            // Get completion rate
            const [blocks] = await pool.query(`
                SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
                FROM capacity_blocks 
                WHERE user_id = ? AND DATE(date) = ? AND is_shadow = 0
            `, [userId, today]);

            const total = blocks[0].total;
            const completed = blocks[0].completed;
            const rate = total > 0 ? (completed / total) * 100 : 0;

            // If 80%+ completed, update streak
            if (rate >= 80) {
                // Logic similar to achievements.js recalculate-streak
                // Simplified: just increment streak
                await pool.query(`
                    INSERT INTO user_stats (user_id, current_streak, longest_streak, last_productive_day, total_productive_days)
                    VALUES (?, 1, 1, ?, 1)
                    ON DUPLICATE KEY UPDATE 
                        current_streak = current_streak + 1,
                        longest_streak = GREATEST(longest_streak, current_streak + 1),
                        last_productive_day = VALUES(last_productive_day),
                        total_productive_days = total_productive_days + 1
                `, [userId, today]);
            }
        } catch (err) {
            console.error('[Telegram] Error triggering achievement check:', err);
        }
    }

    // Get random quote
    getRandomQuote() {
        return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }

    // Send app notification to all linked users
    async sendNotification(message, projectName = null) {
        if (!this.isInitialized) return;

        try {
            // Get all users with telegram linked
            const [users] = await pool.query(
                'SELECT telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL'
            );

            const header = projectName
                ? `🔔 *Notificación: ${projectName}*\n\n`
                : `🔔 *Notificación*\n\n`;

            const fullMessage = header + message;

            for (const user of users) {
                try {
                    await this.bot.sendMessage(user.telegram_chat_id, fullMessage, { parse_mode: 'Markdown' });
                } catch (sendErr) {
                    console.error(`[Telegram] Failed to send to ${user.telegram_chat_id}:`, sendErr.message);
                }
            }

            console.log(`[Telegram] Sent notification to ${users.length} users`);
        } catch (err) {
            console.error('[Telegram] Error sending notification:', err);
        }
    }
}

// Singleton instance
const telegramService = new TelegramService();

export default telegramService;
