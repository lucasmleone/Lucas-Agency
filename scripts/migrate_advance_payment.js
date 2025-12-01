import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || process.env.DB_PASS || 'password',
        database: process.env.DB_NAME || 'agency_db'
    });

    try {
        console.log('🔄 Adding advance payment columns to projects table...');

        await connection.execute(`
            ALTER TABLE projects 
            ADD COLUMN advance_percentage INT DEFAULT 50
        `);
        console.log('✅ Added advance_percentage column');

        await connection.execute(`
            ALTER TABLE projects 
            ADD COLUMN advance_payment_info TEXT
        `);
        console.log('✅ Added advance_payment_info column');

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

migrate().catch(console.error);
