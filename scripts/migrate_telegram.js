// Migration: Add Telegram fields to users table
// Run this script manually: node scripts/migrate_telegram.js

import pool from '../server/db.js';

async function migrate() {
    try {
        console.log('Adding telegram columns to users table...');

        // Add telegram_chat_id column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50) NULL,
            ADD COLUMN IF NOT EXISTS telegram_link_code VARCHAR(32) NULL
        `).catch(() => {
            // MySQL syntax differs, try alternative
            console.log('Trying MySQL syntax...');
        });

        // For MySQL, check if columns exist first
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('telegram_chat_id', 'telegram_link_code')
        `);

        const existingColumns = columns.map(c => c.COLUMN_NAME);

        if (!existingColumns.includes('telegram_chat_id')) {
            await pool.query(`ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(50) NULL`);
            console.log('Added telegram_chat_id column');
        } else {
            console.log('telegram_chat_id column already exists');
        }

        if (!existingColumns.includes('telegram_link_code')) {
            await pool.query(`ALTER TABLE users ADD COLUMN telegram_link_code VARCHAR(32) NULL`);
            console.log('Added telegram_link_code column');
        } else {
            console.log('telegram_link_code column already exists');
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrate();
