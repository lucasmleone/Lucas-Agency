import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '../.env') });

const templates = [
    { name: 'Chat WhatsApp (Botón flotante)', price: 40, description: 'Integración de botón flotante de WhatsApp para contacto directo.' },
    { name: 'Blog / Noticias', price: 80, description: 'Sección autoadministrable para publicar noticias y artículos.' },
    { name: 'Multilenguaje (Infraestructura)', price: 120, description: 'Configuración técnica para soporte de múltiples idiomas.' },
    { name: 'Reservas y Turnos (Booking)', price: 150, description: 'Sistema de gestión de citas y reservas online.' },
    { name: 'Catálogo (Modo Vidriera)', price: 200, description: 'Exhibición de productos sin pasarela de pagos.' },
    { name: 'Academia Online (LMS)', price: 350, description: 'Plataforma de cursos, alumnos y contenido restringido.' },
    { name: 'E-commerce Full', price: 600, description: 'Tienda online completa con carrito y pasarela de pagos (incluye carga de 10 productos).' }
];

async function seedAddons() {
    console.log('🌱 Seeding Add-on Templates...');

    const dbConfig = {
        host: process.env.DB_HOST || 'mysql',
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || process.env.DB_PASS || 'userpassword',
        database: process.env.DB_NAME || 'agency_flow',
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.');

        // Optional: Clear existing templates to avoid duplicates or confusion
        // await connection.execute('DELETE FROM add_on_templates');
        // console.log('🗑️ Cleared existing templates.');

        // Get a valid user ID for the templates (required field)
        const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
        if (users.length === 0) {
            throw new Error('No users found in database. Cannot create templates without user_id.');
        }
        const userId = users[0].id;

        for (const t of templates) {
            // Check if exists
            const [rows] = await connection.execute('SELECT id FROM add_on_templates WHERE name = ?', [t.name]);

            if (rows.length === 0) {
                await connection.execute(
                    'INSERT INTO add_on_templates (name, default_price, description, user_id) VALUES (?, ?, ?, ?)',
                    [t.name, t.price, t.description, userId]
                );
                console.log(`➕ Added: ${t.name} - $${t.price}`);
            } else {
                // Update price if exists
                await connection.execute(
                    'UPDATE add_on_templates SET default_price = ?, description = ? WHERE name = ?',
                    [t.price, t.description, t.name]
                );
                console.log(`🔄 Updated: ${t.name} - $${t.price}`);
            }
        }

        console.log('✨ Add-on templates seeding completed!');
        await connection.end();
    } catch (error) {
        console.error('❌ Error seeding addons:', error);
        process.exit(1);
    }
}

seedAddons();
