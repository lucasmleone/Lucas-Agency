import pool from './server/db.js';

async function migrate() {
    try {
        console.log('Starting migration...');

        // Check if columns exist
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'agency_flow' 
            AND TABLE_NAME = 'notes' 
            AND COLUMN_NAME IN ('linked_entity_type', 'linked_entity_id');
        `);

        if (columns.length === 2) {
            console.log('Columns already exist. Skipping.');
            process.exit(0);
        }

        // Add columns
        await pool.query(`
            ALTER TABLE notes 
            ADD COLUMN linked_entity_type VARCHAR(50) DEFAULT NULL,
            ADD COLUMN linked_entity_id VARCHAR(50) DEFAULT NULL;
        `);

        console.log('Migration successful: Added linked_entity_type and linked_entity_id to notes table.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
