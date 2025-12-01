import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const migrate = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || process.env.DB_PASS || 'password',
        database: process.env.DB_NAME || 'agency_db'
    });

    console.log('✅ Connected to database');

    try {
        // Check if columns already exist
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'projects' 
            AND COLUMN_NAME IN ('is_hourly_quote', 'custom_hours', 'hourly_rate')
        `, [process.env.DB_NAME || 'agency_db']);

        if (columns.length === 3) {
            console.log('⏭️  Columns already exist, skipping migration');
            await connection.end();
            return;
        }

        console.log('🔄 Adding hourly quote columns to projects table...');

        // Add new columns for hourly quotes
        if (!columns.find(c => c.COLUMN_NAME === 'is_hourly_quote')) {
            await connection.query(`
                ALTER TABLE projects 
                ADD COLUMN is_hourly_quote BOOLEAN DEFAULT FALSE
            `);
            console.log('✅ Added is_hourly_quote column');
        }

        if (!columns.find(c => c.COLUMN_NAME === 'custom_hours')) {
            await connection.query(`
                ALTER TABLE projects 
                ADD COLUMN custom_hours DECIMAL(10,2) DEFAULT 0
            `);
            console.log('✅ Added custom_hours column');
        }

        if (!columns.find(c => c.COLUMN_NAME === 'hourly_rate')) {
            await connection.query(`
                ALTER TABLE projects 
                ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 25
            `);
            console.log('✅ Added hourly_rate column');
        }

        console.log('✅ Migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await connection.end();
    }
};

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
