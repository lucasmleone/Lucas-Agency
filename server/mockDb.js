import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'mockData.json');

// Load data
const loadData = () => {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading mock DB:', e);
    }
    return { users: [], clients: [], projects: [], finance: [], logs: [] };
};

// Save data
const saveData = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
    } catch (e) {
        console.error('Error saving mock DB:', e);
    }
};

export const mockPool = {
    query: async (sql, params) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Mock DB Query:', sql.substring(0, 50) + '...');
        }
        const db = loadData();
        const s = sql.toLowerCase();

        // --- Users ---
        if (s.includes('from users') || s.includes('into users')) {
            if (s.includes('insert into users')) {
                const newUser = { id: db.users.length + 1, email: params[0], password_hash: params[1], agent_code: params[2] };
                db.users.push(newUser);
                saveData(db);
                return [{ insertId: newUser.id }, []];
            }
            if (s.includes('where email =')) {
                const u = db.users.find(u => u.email === params[0]);
                return [u ? [u] : [], []];
            }
            if (s.includes('where id =')) {
                const u = db.users.find(u => u.id === params[0]);
                return [u ? [u] : [], []];
            }
        }

        // --- Projects ---
        if (s.includes('from projects') || s.includes('into projects') || s.includes('update projects')) {
            if (s.includes('insert into')) {
                // INSERT INTO projects (user_id, client_id, name, description, start_date, end_date, status, checklists, discovery_data, plan)
                const newProject = {
                    id: db.projects.length + 1,
                    user_id: params[0],
                    client_id: params[1],
                    name: params[2],
                    description: params[3],
                    start_date: params[4],
                    end_date: params[5],
                    status: params[6],
                    checklists: params[7],
                    discovery_data: params[8],
                    planType: params[9], // Mapped to planType for frontend consistency
                    clientName: db.clients.find(c => c.id == params[1])?.name || 'Unknown'
                };
                db.projects.push(newProject);
                saveData(db);
                return [{ insertId: newProject.id }, []];
            }
            if (s.includes('update projects')) {
                // Handle partial update for maintenance_status
                if (s.includes('set maintenance_status = ? where id = ?')) {
                    const status = params[0];
                    const id = params[1];
                    const projectIndex = db.projects.findIndex(p => p.id == id);
                    if (projectIndex !== -1) {
                        db.projects[projectIndex].maintenance_status = status;
                        saveData(db);
                        return [{ affectedRows: 1 }, []];
                    }
                    return [{ affectedRows: 0 }, []];
                }

                // Full update (existing logic)
                // UPDATE projects SET status=?, payment_status=?, maintenance_status=?, checklists=?, discovery_data=?, end_date=?, plan=?, dev_url=?, description=?, blocked_status=?, blocked_reason=?, blocked_since=?, base_price=?, custom_price=?, discount=?, discount_type=?, final_price=?, pricing_notes=? WHERE id=? AND user_id=?
                const id = params[18]; // id is the 19th parameter (index 18)
                const projectIndex = db.projects.findIndex(p => p.id == id);
                if (projectIndex !== -1) {
                    db.projects[projectIndex] = {
                        ...db.projects[projectIndex],
                        status: params[0],
                        payment_status: params[1],
                        maintenance_status: params[2],
                        checklists: params[3],
                        discovery_data: params[4],
                        end_date: params[5],
                        plan: params[6],  // Changed from planType to plan
                        dev_url: params[7],
                        description: params[8],
                        blocked_status: params[9],  // Changed from blockedStatus
                        blocked_reason: params[10],  // Changed from blockedReason
                        blocked_since: params[11],  // Changed from blockedSince
                        base_price: params[12],  // Changed from basePrice
                        custom_price: params[13],  // Changed from customPrice
                        discount: params[14],
                        discount_type: params[15],  // Changed from discountType
                        final_price: params[16],  // Changed from finalPrice
                        pricing_notes: params[17]  // Changed from pricingNotes
                    };
                    saveData(db);
                }
                return [{ affectedRows: 1 }, []];
            }
            if (s.includes('delete from')) {
                // DELETE FROM projects WHERE id = ?
                const id = params[0];
                db.projects = db.projects.filter(p => p.id != id);
                saveData(db);
                return [{ affectedRows: 1 }, []];
            }

            // Join logic for GET
            const userProjects = db.projects.map(p => {
                const clientName = db.clients.find(c => c.id == p.client_id)?.name || 'Unknown';

                // Find maintenance task
                const maintenanceTask = (db.maintenance_tasks || []).find(t => t.project_id == p.id);
                let nextMaintenanceDate = undefined;

                if (maintenanceTask && maintenanceTask.monthly_tasks) {
                    let tasks = [];
                    try {
                        tasks = typeof maintenanceTask.monthly_tasks === 'string'
                            ? JSON.parse(maintenanceTask.monthly_tasks)
                            : maintenanceTask.monthly_tasks;
                    } catch (e) {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('MockDB JSON Parse Error:', e);
                        }
                    }

                    const nextTask = Array.isArray(tasks) ? tasks.find(t => !t.completed) : null;

                    if (nextTask) {
                        nextMaintenanceDate = nextTask.date;
                    }
                }

                return {
                    ...p,
                    clientName,
                    nextMaintenanceDate
                };
            });
            return [userProjects, []];
        }

        // --- Clients ---
        if (s.includes('from clients') || s.includes('into clients') || s.includes('update clients') || (s.includes('delete from clients'))) {
            if (s.includes('insert into')) {
                // INSERT INTO clients (user_id, name, email, phone, company, status)
                const newClient = {
                    id: db.clients.length + 1,
                    user_id: params[0],
                    name: params[1],
                    email: params[2],
                    phone: params[3],
                    company: params[4],
                    status: params[5] || 'active',
                    created_at: new Date().toISOString()
                };
                db.clients.push(newClient);
                saveData(db);
                return [{ insertId: newClient.id }, []];
            }
            if (s.includes('update clients')) {
                // UPDATE clients SET name = ?, email = ?, phone = ?, company = ? WHERE id = ? AND user_id = ?
                const id = params[4];
                const clientIndex = db.clients.findIndex(c => c.id == id);
                if (clientIndex !== -1) {
                    db.clients[clientIndex] = {
                        ...db.clients[clientIndex],
                        name: params[0],
                        email: params[1],
                        phone: params[2],
                        company: params[3]
                    };
                    saveData(db);
                }
                return [{ affectedRows: 1 }, []];
            }
            if (s.includes('delete from')) {
                // DELETE FROM clients WHERE id = ? AND user_id = ?
                const id = params[0];
                db.clients = db.clients.filter(c => c.id != id);
                saveData(db);
                return [{ affectedRows: 1 }, []];
            }
            return [db.clients, []];
        }

        // --- Finance ---
        if (s.includes('from finance') || s.includes('into finance')) {
            if (s.includes('insert into')) {
                // INSERT INTO finance (user_id, project_id, type, amount, description, date, status)
                const newFinance = {
                    id: db.finance.length + 1,
                    user_id: params[0],
                    project_id: params[1] ? String(params[1]) : null,
                    type: params[2],
                    amount: params[3],
                    description: params[4],
                    date: params[5],
                    status: 'completed'
                };
                db.finance.push(newFinance);
                saveData(db);
                return [{ insertId: newFinance.id }, []];
            }
            if (s.includes('delete from')) {
                // DELETE FROM finance WHERE id = ?
                const id = params[0];
                db.finance = db.finance.filter(f => f.id != id);
                saveData(db);
                return [{ affectedRows: 1 }, []];
            }
            return [db.finance, []];
        }

        // --- Logs ---
        if (s.includes('from project_logs') || s.includes('into project_logs')) {
            if (s.includes('insert into')) {
                const newLog = {
                    id: db.logs.length + 1,
                    user_id: params[0],
                    project_id: params[1] ? String(params[1]) : null,
                    message: params[2],
                    created_at: new Date().toISOString()
                };
                db.logs.push(newLog);
                saveData(db);
                return [{ insertId: newLog.id }, []];
            }
            return [db.logs, []];
        }

        // --- Maintenance Tasks ---
        if (s.includes('from maintenance_tasks') || s.includes('into maintenance_tasks') || s.includes('update maintenance_tasks')) {
            // INSERT
            if (s.includes('insert into')) {
                const newTask = {
                    id: (db.maintenance_tasks || []).length + 1,
                    user_id: params[0],
                    project_id: params[1],
                    created_at: params[2],
                    free_until: params[3],
                    status: params[4],
                    monthly_tasks: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5]
                };
                if (!db.maintenance_tasks) db.maintenance_tasks = [];
                db.maintenance_tasks.push(newTask);
                saveData(db);
                return [{ insertId: newTask.id }, []];
            }

            // UPDATE (checklist or status)
            if (s.includes('update maintenance_tasks')) {
                // Handle partial update for status only
                if (s.includes('set status = ? where id = ?')) {
                    const status = params[0];
                    const id = params[1];
                    const task = (db.maintenance_tasks || []).find(t => t.id == id);
                    if (task) {
                        task.status = status;
                        saveData(db);
                        return [{ affectedRows: 1 }, []];
                    }
                    return [{ affectedRows: 0 }, []];
                }

                // UPDATE maintenance_tasks SET monthly_tasks = ?, status = ? WHERE id = ?
                // or UPDATE maintenance_tasks SET monthly_tasks = ? WHERE id = ?

                // UPDATE maintenance_tasks SET monthly_tasks = ?, status = ? WHERE id = ?
                // or UPDATE maintenance_tasks SET monthly_tasks = ? WHERE id = ?

                let id;
                let task;

                // Handle specific cases to be safe
                if (s.includes('set monthly_tasks = ? where id = ?')) {
                    id = params[1];
                    task = (db.maintenance_tasks || []).find(t => t.id == id);
                    if (task) {
                        task.monthly_tasks = typeof params[0] === 'string' ? JSON.parse(params[0]) : params[0];
                        saveData(db);
                        return [{ affectedRows: 1 }, []];
                    }
                } else if (s.includes('set monthly_tasks = ?, status = ? where id = ?')) {
                    // Reactivation query: WHERE id = ? (no user_id)
                    id = params[2];
                    task = (db.maintenance_tasks || []).find(t => t.id == id);
                    if (task) {
                        task.monthly_tasks = typeof params[0] === 'string' ? JSON.parse(params[0]) : params[0];
                        task.status = params[1];
                        saveData(db);
                        return [{ affectedRows: 1 }, []];
                    }
                } else {
                    // Fallback for the complex query with status and user_id
                    // UPDATE maintenance_tasks SET monthly_tasks = ?, status = ? WHERE id = ? AND user_id = ?
                    id = params[params.length - 2];
                    task = (db.maintenance_tasks || []).find(t => t.id == id);

                    if (task) {
                        if (s.includes('status = ?')) {
                            // SET monthly_tasks = ?, status = ?
                            task.monthly_tasks = typeof params[0] === 'string' ? JSON.parse(params[0]) : params[0];
                            task.status = params[1];
                        } else {
                            // SET monthly_tasks = ?
                            task.monthly_tasks = typeof params[0] === 'string' ? JSON.parse(params[0]) : params[0];
                        }
                        saveData(db);
                        return [{ affectedRows: 1 }, []];
                    }
                }
                return [{ affectedRows: 0 }, []];
            }

            // SELECT
            if (s.includes('select *')) {
                if (s.includes('where id =')) {
                    const id = params[0];
                    const rows = (db.maintenance_tasks || []).filter(t => t.id == id);
                    return [rows, []];
                }
                if (s.includes('project_id =')) {
                    const projectId = params[0];
                    const userId = params[1];
                    const rows = (db.maintenance_tasks || []).filter(t => t.project_id == projectId && t.user_id == userId);
                    return [rows, []];
                }
            }

            // SELECT monthly_tasks
            if (s.includes('select monthly_tasks')) {
                const id = params[0];
                const rows = (db.maintenance_tasks || []).filter(t => t.id == id);
                return [rows, []];
            }

            return [[], []];
        }

        return [[], []];
    },
}

