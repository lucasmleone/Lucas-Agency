import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'agency_db',
});

async function test() {
    try {
        console.log('Testing clients query...');
        const [rows] = await pool.query('SELECT * FROM clients WHERE user_id = ?', [1]);
        console.log('Queried rows:', rows.length);

        for (let i = 0; i < rows.length; i++) {
            const c = rows[i];
            console.log(`Row ${i}:`, JSON.stringify(c, null, 2));

            try {
                const client = {
                    id: String(c.id),
                    name: c.name,
                    email: c.email || '',
                    phone: c.phone || '',
                    company: c.company || '',
                    registeredAt: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    notes: c.notes || ''
                };
                console.log(`Mapped client ${i}:`, JSON.stringify(client, null, 2));
            } catch (err) {
                console.error(`Error mapping row ${i}:`, err.message, err.stack);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Fatal error:', err.message, err.stack);
        process.exit(1);
    }
}

test();
