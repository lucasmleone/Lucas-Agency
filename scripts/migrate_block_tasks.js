import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'Opalina.1884',
    database: process.env.DB_NAME || 'agency_flow'
};

async function migrate() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        // Add tasks column to capacity_blocks if it doesn't exist
        console.log('Adding "tasks" column to capacity_blocks...');

        try {
            await connection.query(`
                ALTER TABLE capacity_blocks 
                ADD COLUMN tasks JSON DEFAULT NULL
            `);
            console.log('Column "tasks" added successfully.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column "tasks" already exists.');
            } else {
                throw err;
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
