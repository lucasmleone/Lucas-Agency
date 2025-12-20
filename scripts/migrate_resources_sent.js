const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'agency_db',
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Add resources_sent column
        try {
            await connection.query(`
                ALTER TABLE projects 
                ADD COLUMN resources_sent BOOLEAN DEFAULT FALSE;
            `);
            console.log('Added resources_sent column.');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('Column resources_sent already exists.');
            } else {
                throw error;
            }
        }

        // Backfill data based on logs
        console.log('Backfilling resources_sent based on logs...');
        await connection.query(`
            UPDATE projects p
            SET resources_sent = TRUE
            WHERE EXISTS (
                SELECT 1 FROM project_logs pl 
                WHERE pl.project_id = p.id 
                AND pl.message = 'Cliente confirmó envío de recursos y pago desde el Portal'
            );
        `);
        console.log('Backfill complete.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
