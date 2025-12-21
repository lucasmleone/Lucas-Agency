import express from 'express';
import pool from '../db.js';
import { verifyToken } from './auth.js';

const router = express.Router();
router.use(verifyToken);

// Achievement definitions
const ACHIEVEMENTS = {
    PRODUCTIVE_DAY: { type: 'productive_day', name: 'Día Productivo', emoji: '🔥', description: 'Completaste ≥80% de tus bloques' },
    STREAK_3: { type: 'streak_3', name: 'Racha de 3 días', emoji: '🔥🔥🔥', description: '3 días productivos seguidos' },
    STREAK_7: { type: 'streak_7', name: 'Semana Imparable', emoji: '🌟', description: '7 días productivos seguidos' },
    STREAK_30: { type: 'streak_30', name: 'Maestro Estoico', emoji: '👑', description: '30 días productivos seguidos' },
    BLOCKS_10: { type: 'blocks_10', name: 'Primeros 10', emoji: '💪', description: '10 bloques completados' },
    BLOCKS_50: { type: 'blocks_50', name: 'Medio Centenar', emoji: '💪💪', description: '50 bloques completados' },
    BLOCKS_100: { type: 'blocks_100', name: 'Centurión', emoji: '🏆', description: '100 bloques completados' },
    PERFECT_DAY: { type: 'perfect_day', name: 'Día Perfecto', emoji: '🎯', description: 'Completaste 100% de tus bloques' }
};

// Get user stats
router.get('/stats', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM user_stats WHERE user_id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            // Initialize stats for new user
            await pool.query(
                'INSERT INTO user_stats (user_id) VALUES (?)',
                [req.user.id]
            );
            return res.json({
                currentStreak: 0,
                longestStreak: 0,
                totalBlocksCompleted: 0,
                totalProductiveDays: 0,
                lastProductiveDay: null
            });
        }

        const stats = rows[0];
        res.json({
            currentStreak: stats.current_streak || 0,
            longestStreak: stats.longest_streak || 0,
            totalBlocksCompleted: stats.total_blocks_completed || 0,
            totalProductiveDays: stats.total_productive_days || 0,
            lastProductiveDay: stats.last_productive_day
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Error fetching stats' });
    }
});

// Get all achievements for user
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM user_achievements WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        const achievements = rows.map(a => ({
            id: a.id,
            type: a.achievement_type,
            value: a.achievement_value,
            date: a.achievement_date,
            ...ACHIEVEMENTS[a.achievement_type.toUpperCase()] || { name: a.achievement_type, emoji: '🏅' }
        }));

        res.json(achievements);
    } catch (err) {
        console.error('Error fetching achievements:', err);
        res.status(500).json({ error: 'Error fetching achievements' });
    }
});

// Get today's progress
router.get('/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get today's blocks
        const [blocks] = await pool.query(`
            SELECT id, completed, hours 
            FROM capacity_blocks 
            WHERE user_id = ? AND DATE(date) = ? AND is_shadow = 0
        `, [req.user.id, today]);

        const totalBlocks = blocks.length;
        const completedBlocks = blocks.filter(b => b.completed).length;
        const totalHours = blocks.reduce((sum, b) => sum + (b.hours || 0), 0);
        const completedHours = blocks.filter(b => b.completed).reduce((sum, b) => sum + (b.hours || 0), 0);

        const completionRate = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
        const isProductiveDay = completionRate >= 80;
        const isPerfectDay = completionRate === 100 && totalBlocks > 0;

        // Get current streak
        const [stats] = await pool.query(
            'SELECT current_streak, longest_streak FROM user_stats WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            date: today,
            totalBlocks,
            completedBlocks,
            totalHours,
            completedHours,
            completionRate,
            isProductiveDay,
            isPerfectDay,
            currentStreak: stats[0]?.current_streak || 0,
            longestStreak: stats[0]?.longest_streak || 0
        });
    } catch (err) {
        console.error('Error fetching today progress:', err);
        res.status(500).json({ error: 'Error fetching today progress' });
    }
});

// Check and award achievements for a specific day
router.post('/check-day', async (req, res) => {
    const { date } = req.body;
    const checkDate = date || new Date().toISOString().split('T')[0];

    try {
        // Get blocks for the day
        const [blocks] = await pool.query(`
            SELECT id, completed, hours 
            FROM capacity_blocks 
            WHERE user_id = ? AND DATE(date) = ? AND is_shadow = 0
        `, [req.user.id, checkDate]);

        const totalBlocks = blocks.length;
        const completedBlocks = blocks.filter(b => b.completed).length;
        const completionRate = totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0;

        const newAchievements = [];

        // Check for productive day (≥80%)
        if (completionRate >= 80 && totalBlocks > 0) {
            const [existing] = await pool.query(
                'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_type = ? AND achievement_date = ?',
                [req.user.id, 'productive_day', checkDate]
            );

            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO user_achievements (user_id, achievement_type, achievement_date, metadata) VALUES (?, ?, ?, ?)',
                    [req.user.id, 'productive_day', checkDate, JSON.stringify({ rate: completionRate, blocks: completedBlocks })]
                );
                newAchievements.push(ACHIEVEMENTS.PRODUCTIVE_DAY);

                // Update streak
                await updateStreak(req.user.id, checkDate);
            }
        }

        // Check for perfect day (100%)
        if (completionRate === 100 && totalBlocks > 0) {
            const [existing] = await pool.query(
                'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_type = ? AND achievement_date = ?',
                [req.user.id, 'perfect_day', checkDate]
            );

            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO user_achievements (user_id, achievement_type, achievement_date) VALUES (?, ?, ?)',
                    [req.user.id, 'perfect_day', checkDate]
                );
                newAchievements.push(ACHIEVEMENTS.PERFECT_DAY);
            }
        }

        // Update total blocks completed
        const [statsRows] = await pool.query(
            'SELECT total_blocks_completed FROM user_stats WHERE user_id = ?',
            [req.user.id]
        );

        if (statsRows.length > 0) {
            const totalCompleted = statsRows[0].total_blocks_completed + completedBlocks;
            await pool.query(
                'UPDATE user_stats SET total_blocks_completed = ? WHERE user_id = ?',
                [totalCompleted, req.user.id]
            );

            // Check block milestones
            const milestones = [
                { threshold: 10, achievement: ACHIEVEMENTS.BLOCKS_10, type: 'blocks_10' },
                { threshold: 50, achievement: ACHIEVEMENTS.BLOCKS_50, type: 'blocks_50' },
                { threshold: 100, achievement: ACHIEVEMENTS.BLOCKS_100, type: 'blocks_100' }
            ];

            for (const milestone of milestones) {
                if (totalCompleted >= milestone.threshold) {
                    const [existing] = await pool.query(
                        'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_type = ?',
                        [req.user.id, milestone.type]
                    );

                    if (existing.length === 0) {
                        await pool.query(
                            'INSERT INTO user_achievements (user_id, achievement_type, achievement_date) VALUES (?, ?, ?)',
                            [req.user.id, milestone.type, checkDate]
                        );
                        newAchievements.push(milestone.achievement);
                    }
                }
            }
        }

        // Get updated stats
        const [updatedStats] = await pool.query(
            'SELECT * FROM user_stats WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            date: checkDate,
            completionRate,
            newAchievements,
            stats: updatedStats[0] || {}
        });
    } catch (err) {
        console.error('Error checking day achievements:', err);
        res.status(500).json({ error: 'Error checking achievements' });
    }
});

// Helper function to update streak
async function updateStreak(userId, productiveDate) {
    try {
        const [stats] = await pool.query(
            'SELECT current_streak, longest_streak, last_productive_day, total_productive_days FROM user_stats WHERE user_id = ?',
            [userId]
        );

        if (stats.length === 0) {
            await pool.query(
                'INSERT INTO user_stats (user_id, current_streak, longest_streak, last_productive_day, total_productive_days) VALUES (?, 1, 1, ?, 1)',
                [userId, productiveDate]
            );
            return;
        }

        const lastDay = stats[0].last_productive_day;
        let newStreak = stats[0].current_streak || 0;
        let longestStreak = stats[0].longest_streak || 0;
        let totalDays = stats[0].total_productive_days || 0;

        if (!lastDay) {
            newStreak = 1;
        } else {
            // Check if it's consecutive (consider weekends)
            const last = new Date(lastDay);
            const current = new Date(productiveDate);
            const diffDays = Math.floor((current - last) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Same day - no change
            } else if (diffDays === 1 || (diffDays <= 3 && isWeekendBetween(last, current))) {
                // Consecutive or only weekend between
                newStreak += 1;
            } else {
                // Streak broken
                newStreak = 1;
            }
        }

        totalDays += 1;
        if (newStreak > longestStreak) longestStreak = newStreak;

        await pool.query(
            'UPDATE user_stats SET current_streak = ?, longest_streak = ?, last_productive_day = ?, total_productive_days = ? WHERE user_id = ?',
            [newStreak, longestStreak, productiveDate, totalDays, userId]
        );

        // Check streak achievements
        const streakAchievements = [
            { threshold: 3, type: 'streak_3', achievement: ACHIEVEMENTS.STREAK_3 },
            { threshold: 7, type: 'streak_7', achievement: ACHIEVEMENTS.STREAK_7 },
            { threshold: 30, type: 'streak_30', achievement: ACHIEVEMENTS.STREAK_30 }
        ];

        for (const sa of streakAchievements) {
            if (newStreak >= sa.threshold) {
                const [existing] = await pool.query(
                    'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_type = ?',
                    [userId, sa.type]
                );

                if (existing.length === 0) {
                    await pool.query(
                        'INSERT INTO user_achievements (user_id, achievement_type, achievement_date) VALUES (?, ?, ?)',
                        [userId, sa.type, productiveDate]
                    );
                }
            }
        }
    } catch (err) {
        console.error('Error updating streak:', err);
    }
}

// Helper to check if only weekend days are between two dates
function isWeekendBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    for (let d = new Date(d1); d < d2; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6 && d.getTime() !== d1.getTime()) {
            return false;
        }
    }
    return true;
}

export default router;
