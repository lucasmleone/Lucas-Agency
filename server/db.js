import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { mockPool } from './mockDb.js';

dotenv.config();

let pool;

if (process.env.USE_MOCK_DB === 'true') {
    console.log('⚠️ USING MOCK DATABASE');
    pool = mockPool;
} else {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'agency_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

export default pool;
