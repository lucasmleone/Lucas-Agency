import { Project, Client, FinanceRecord, ProjectLog, MaintenanceTask } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DATA_URL = BASE_URL;
const AUTH_URL = `${BASE_URL}/auth`;

export const apiService = {
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${DATA_URL}/projects`, { credentials: 'include' });
    if (!res.ok) return [];
    return res.json();
  },

  async saveProjects(projects: Project[]) {
    // Not used in new backend, individual updates preferred
    console.warn('saveProjects deprecated');
  },

  async addProject(project: Project) {
    const res = await fetch(`${DATA_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
      credentials: 'include'
    });
    return res.json();
  },

  async updateProject(project: Project) {
    await fetch(`${DATA_URL}/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
      credentials: 'include'
    });
  },

  async deleteProject(id: string) {
    await fetch(`${DATA_URL}/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },

  // --- Clients ---

  async getClients(): Promise<Client[]> {
    const res = await fetch(`${DATA_URL}/clients`, { credentials: 'include' });
    if (!res.ok) return [];
    return res.json();
  },

  async addClient(client: Client) {
    const res = await fetch(`${DATA_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
      credentials: 'include'
    });
    return res.json();
  },

  async updateClient(client: Client) {
    await fetch(`${DATA_URL}/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
      credentials: 'include'
    });
  },

  async deleteClient(id: string) {
    await fetch(`${DATA_URL}/clients/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },

  // --- Finance ---

  async getFinances(): Promise<FinanceRecord[]> {
    const res = await fetch(`${DATA_URL}/finances`, { credentials: 'include' });
    if (!res.ok) return [];
    return res.json();
  },

  async addFinance(record: FinanceRecord) {
    const res = await fetch(`${DATA_URL}/finances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
      credentials: 'include'
    });
    return res.json();
  },

  async deleteFinance(id: string) {
    await fetch(`${DATA_URL}/finances/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },

  // --- Maintenance ---

  async getMaintenanceTask(projectId: string): Promise<MaintenanceTask | null> {
    const res = await fetch(`${DATA_URL}/maintenance/${projectId}`, { credentials: 'include' });
    if (!res.ok) return null;
    return res.json();
  },

  async updateMaintenanceTask(task: MaintenanceTask) {
    await fetch(`${DATA_URL}/maintenance/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
      credentials: 'include'
    });
  },

  async completeMaintenanceTask(id: string, monthIndex: number) {
    await fetch(`${DATA_URL}/maintenance/${id}/complete-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthIndex }),
      credentials: 'include'
    });
  },

  async reactivateMaintenance(id: string, monthsToAdd: number, amount: number) {
    await fetch(`${DATA_URL}/maintenance/${id}/reactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthsToAdd, amount }),
      credentials: 'include'
    });
  },

  // --- Logs ---

  async getLogs(): Promise<ProjectLog[]> {
    const res = await fetch(`${DATA_URL}/logs`, { credentials: 'include' });
    if (!res.ok) return [];
    return res.json();
  },

  async addLog(log: ProjectLog) {
    const res = await fetch(`${DATA_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
      credentials: 'include'
    });
    return res.json();
  },

  async updateLog(log: ProjectLog) {
    await fetch(`${DATA_URL}/logs/${log.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
      credentials: 'include'
    });
  },

  // --- Auth ---
  async submitPublicForm(data: any) {
    // Form removed, but keeping method signature to avoid breaks if called
    console.warn('Public form removed');
    return {};
  },

  async login(email: string, password: string) {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(email: string, password: string) {
    const res = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async logout() {
    await fetch(`${AUTH_URL}/logout`, { method: 'POST', credentials: 'include' });
  },

  async checkAuth() {
    try {
      const res = await fetch(`${AUTH_URL}/check`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      return null;
    }
  },

  async getUserInfo() {
    // Merged into checkAuth or login response usually, but keeping for compatibility
    return this.checkAuth().then(res => res?.user || null);
  }
};
