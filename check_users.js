import pool from './server/db.js';

async function checkUsers() {
    try {
        const [users] = await pool.query('SELECT id, username, email FROM users');
        console.log('Users:', users);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkUsers();
