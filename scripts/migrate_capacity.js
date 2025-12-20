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

        // 1. Create capacity_blocks table
        console.log('Creating capacity_blocks table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS capacity_blocks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                project_id INT NULL,
                title VARCHAR(255) NOT NULL,
                block_type ENUM('production', 'meeting', 'manual') NOT NULL DEFAULT 'production',
                date DATE NOT NULL,
                hours DECIMAL(4,2) NOT NULL,
                start_time TIME NULL,
                is_shadow BOOLEAN DEFAULT FALSE,
                notes TEXT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                INDEX idx_user_date (user_id, date),
                INDEX idx_project (project_id)
            );
        `);
        console.log('✓ capacity_blocks table created.');

        // 2. Add time tracking columns to projects table
        const columnsToAdd = [
            { name: 'estimated_hours', definition: 'DECIMAL(6,2) NULL' },
            { name: 'hours_completed', definition: 'DECIMAL(6,2) DEFAULT 0' },
            { name: 'quoted_delivery_date', definition: 'DATE NULL' },
            { name: 'confirmed_delivery_date', definition: 'DATE NULL' },
            { name: 'daily_dedication', definition: 'DECIMAL(4,2) DEFAULT 4' },
        ];

        for (const col of columnsToAdd) {
            try {
                await connection.query(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.definition}`);
                console.log(`✓ Added column: ${col.name}`);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⊘ Column ${col.name} already exists.`);
                } else {
                    throw error;
                }
            }
        }

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
