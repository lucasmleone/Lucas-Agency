import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  LogOut,
  Menu,
  X,
  Plus,
  Phone,
  Mail,
  Bell,
  Lock,
  Settings,
  Calendar,
  Wrench,
  Edit2,
  Trash2,
  RefreshCw,
  StickyNote,
  Search
} from 'lucide-react';
import { Project, ProjectStatus, PlanType, ProjectLog, FinanceRecord } from './types';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ProposalAccepted } from './components/ProposalAccepted';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { PricingConfigModal } from './components/PricingConfigModal';
import NotesBoard from './components/Notes/NotesBoard';
import { Toast } from './components/Toast';
import { useProjects } from './hooks/useProjects';
import { formatCurrency } from './utils/pricing';

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Calcula los días restantes hasta una fecha límite
 * @param deadline - Fecha en formato string (YYYY-MM-DD)
 * @returns Número de días (negativo si está atrasado)
 */
const getDaysRemaining = (deadline: string) => {
  const today = new Date();
  const due = new Date(deadline);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Obtiene el color de urgencia basado en días restantes y estado
 * @param days - Días restantes
 * @param status - Estado del proyecto
 * @returns Clases CSS para el estilo de urgencia
 */
const getUrgencyColor = (days: number, status: ProjectStatus) => {
  if (status === ProjectStatus.DELIVERED || status === ProjectStatus.CANCELLED) return 'text-gray-500 bg-gray-100';
  if (days < 0) return 'text-red-700 bg-red-100 border-red-200';  // Atrasado
  if (days <= 3) return 'text-orange-700 bg-orange-100 border-orange-200';  // Urgente
  return 'text-green-700 bg-green-100 border-green-200';  // Normal
};

/**
 * Genera la etiqueta de urgencia para mostrar
 * @param days - Días restantes
 * @param status - Estado del proyecto
 * @returns Texto descriptivo de la urgencia
 */
const getUrgencyLabel = (days: number, status: ProjectStatus) => {
  if (status === ProjectStatus.DELIVERED) return 'Completado';
  if (status === ProjectStatus.CANCELLED) return 'Cancelado';
  if (days < 0) return `Atrasado ${Math.abs(days)} días`;
  if (days === 0) return 'Vence Hoy';
  return `${days} días restantes`;
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

/**
 * App - Componente raíz de la aplicación
 * 
 * Responsabilidades:
 * - Autenticación y routing
 * - Gestión de estado global (proyectos, clientes, finanzas)
 * - Renderizado de vistas según navegación
 * - Manejo de modales globales
 * 
 * Estructura:
 * - Header con navegación y settings
 * - Sidebar con menú principal
 * - Área de contenido principal (dashboard, proyectos, etc)
 * - Modales para CRUD operations
 */
function App() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const {
    projects,
    finances,
    logs,
    clients,
    loading: dataLoading,
    refreshData,
    addProject,
    updateProject,
    deleteProject,
    addLog,
    updateLog,
    addClient,
    updateClient,
    deleteClient,
    addFinance,
    deleteFinance
  } = useProjects();

  // --- Estados ---
  const [view, setView] = useState<'public' | 'dashboard' | 'projects' | 'finance' | 'clients' | 'notes'>('dashboard');
  const [showPricingConfig, setShowPricingConfig] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectSortBy, setProjectSortBy] = useState<'deadline' | 'client'>('deadline');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estado para confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; financeId: string | null }>({ show: false, financeId: null });
  const [deleteClientConfirm, setDeleteClientConfirm] = useState<{ show: boolean; clientId: string | null; clientName: string }>({ show: false, clientId: null, clientName: '' });

  // Modal agregar cliente
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', company: '', phone: '' });

  // Modal agregar Proyecto
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ clientId: '', plan: PlanType.SINGLE, deadline: '' });

  // Search states
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Check URL params for public view routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'public') {
      setView('dashboard');
    }
  }, []);

  // Redirect to / if authenticated and on /login or /register
  useEffect(() => {
    if (isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
      window.history.replaceState(null, '', '/');
    }
  }, [isAuthenticated]);

  // --- Acciones ---

  const handleAddLog = (text: string) => {
    if (selectedProjectId) addLog(selectedProjectId, text);
  };

  const handleUpdateLog = (logId: string, text: string) => {
    updateLog(logId, text);
  };

  const handleUpdateProject = async (updatedFields: any) => {
    if (selectedProjectId) await updateProject(selectedProjectId, updatedFields);
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    setSelectedProjectId(null);
  };

  const handleAddFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    await addFinance({
      projectId: data.get('projectId') as string || undefined,
      type: data.get('type'),
      description: data.get('description'),
      amount: data.get('amount')
    });
    form.reset();
  };

  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((newClient as any).id) {
      // Editing existing client
      await updateClient((newClient as any).id, newClient);
    } else {
      // Adding new client
      await addClient(newClient);
    }
    setShowAddClient(false);
    setNewClient({ name: '', email: '', company: '', phone: '' });
  };

  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectData.clientId) return;
    await addProject(newProjectData);
    setShowAddProject(false);
    setNewProjectData({ clientId: '', plan: PlanType.SINGLE, deadline: '' });
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    setMobileMenuOpen(false);
    // Update URL to match view
    const path = newView === 'dashboard' ? '/' : `/${newView}`;
    window.history.pushState(null, '', path);
  };

  // Sync view with URL on load and on browser back/forward
  useEffect(() => {
    const path = window.location.pathname;
    const viewFromPath = path === '/' ? 'dashboard' :
      path === '/projects' ? 'projects' :
        path === '/clients' ? 'clients' :
          path === '/finance' ? 'finance' :
            path === '/notes' ? 'notes' : 'dashboard';
    setView(viewFromPath as typeof view);

    // Handle browser back/forward buttons
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const currentView = currentPath === '/' ? 'dashboard' :
        currentPath === '/projects' ? 'projects' :
          currentPath === '/clients' ? 'clients' :
            currentPath === '/finance' ? 'finance' :
              currentPath === '/notes' ? 'notes' : 'dashboard';
      setView(currentView as typeof view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- Derived State ---
  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const selectedProjectLogs = useMemo(() => logs.filter(l => String(l.projectId) === String(selectedProjectId)), [logs, selectedProjectId]);
  const selectedProjectClient = useMemo(() => selectedProject ? clients.find(c => c.id === selectedProject.clientId) : undefined, [selectedProject, clients]);

  // --- Vistas ---

  // Public Routes (No Auth Required)
  const location = window.location; // Using window.location since we might not be inside Router context yet if App is the one being wrapped? 
  // Wait, I wrapped App in index.tsx, so I can use useLocation.
  // But to be safe and minimal, I can just use window.location.pathname which works regardless.
  // Actually, let's use the Router hook if possible, but window.location is 100% safe here.

  if (window.location.pathname.startsWith('/accept-proposal/')) {
    return <ProposalAccepted />;
  }

  if (authLoading || (isAuthenticated && dataLoading)) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!isAuthenticated) {
    const path = window.location.pathname;
    if (path === '/register') return <RegisterPage />;
    return <LoginPage />;
  }

  // Layout Admin
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar (Desktop) */}
      <div className="w-64 bg-gray-900 text-white hidden md:flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-black tracking-tighter">LEONE AGENCIA</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Console v2.2 FIX</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => handleViewChange('dashboard')}
            className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${view === 'dashboard' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Tablero
          </button>
          <button
            onClick={() => handleViewChange('projects')}
            className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${view === 'projects' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Briefcase className="mr-3 h-5 w-5" />
            Proyectos
          </button>
          <button
            onClick={() => handleViewChange('clients')}
            className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${view === 'clients' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Users className="mr-3 h-5 w-5" />
            Clientes
          </button>
          <button
            onClick={() => handleViewChange('finance')}
            className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${view === 'finance' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <DollarSign className="mr-3 h-5 w-5" />
            Finanzas
          </button>
          <button
            onClick={() => handleViewChange('notes')}
            className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${view === 'notes' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <StickyNote className="mr-3 h-5 w-5" />
            Notas
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
            <LogOut className="mr-3 h-5 w-5" />
            Salir
          </button>
        </div>
      </div>

      {/* Sidebar (Mobile Overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative bg-gray-900 text-white w-64 flex flex-col h-full shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-black tracking-tighter">LEONE AGENCIA</h1>
                <p className="text-xs text-gray-500 mt-1">Admin Console v2.0</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400"><X className="w-6 h-6" /></button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${view === 'dashboard' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Tablero
              </button>
              <button
                onClick={() => handleViewChange('projects')}
                className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${view === 'projects' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                <Briefcase className="mr-3 h-5 w-5" />
                Proyectos
              </button>
              <button
                onClick={() => handleViewChange('clients')}
                className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${view === 'clients' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                <Users className="mr-3 h-5 w-5" />
                Clientes
              </button>
              <button
                onClick={() => handleViewChange('finance')}
                className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${view === 'finance' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                <DollarSign className="mr-3 h-5 w-5" />
                Finanzas
              </button>
              <button
                onClick={() => handleViewChange('notes')}
                className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${view === 'notes' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                <StickyNote className="mr-3 h-5 w-5" />
                Notas
              </button>
            </nav>
            <div className="p-4 border-t border-gray-800">
              <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                <LogOut className="mr-3 h-5 w-5" />
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center z-10">
          <div className="flex items-center md:hidden">
            <button onClick={toggleMobileMenu} className="text-gray-600 hover:text-gray-900 mr-3">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-black text-lg">LEONE <span className="text-xs text-green-600 bg-green-100 px-1 rounded ml-2">v2.2 FIX</span></span>
          </div>
          <div className="flex items-center justify-end w-full gap-4">
            <button
              onClick={() => setShowPricingConfig(true)}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
              title="Configuración de Precios"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">{user?.email.charAt(0).toUpperCase()}</div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user?.email.split('@')[0]}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">

          {view === 'dashboard' && (
            <Dashboard projects={projects} finances={finances} logs={logs} />
          )}

          {view === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Cartera de Proyectos</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => refreshData()}
                    className="bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    title="Actualizar Proyectos"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                  </button>
                  <button
                    onClick={() => setProjectSortBy(projectSortBy === 'deadline' ? 'client' : 'deadline')}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {projectSortBy === 'deadline' ? '📅 Por Vencimiento' : '👤 Por Cliente'}
                  </button>
                  <button onClick={() => setShowAddProject(true)} className="bg-gray-900 text-white px-4 py-2.5 rounded-lg flex items-center text-sm font-medium hover:bg-black shadow-lg">
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Proyecto
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar proyectos por cliente, plan o estado..."
                  value={projectSearchTerm}
                  onChange={(e) => setProjectSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Modal Agregar Proyecto */}
              {showAddProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                  <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                    <h3 className="text-xl font-bold mb-6 text-gray-900">Nuevo Proyecto</h3>
                    <form onSubmit={handleAddProjectSubmit} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
                        <select
                          className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-gray-900 focus:border-gray-900"
                          required
                          value={newProjectData.clientId}
                          onChange={e => setNewProjectData({ ...newProjectData, clientId: e.target.value })}
                        >
                          <option value="">Seleccionar Cliente...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plan</label>
                        <select
                          value={newProjectData.plan}
                          onChange={(e) => setNewProjectData({ ...newProjectData, plan: e.target.value as PlanType })}
                          className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-gray-900 focus:border-gray-900"
                        >
                          {Object.values(PlanType).map((plan) => (
                            <option key={plan} value={plan}>{plan}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Entrega</label>
                          <input
                            type="date"
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-gray-900 focus:border-gray-900"
                            value={newProjectData.deadline}
                            onChange={e => setNewProjectData({ ...newProjectData, deadline: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAddProject(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black text-sm font-bold shadow-md">Crear</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...projects]
                  .filter((project) => {
                    if (!projectSearchTerm) return true;
                    const searchLower = projectSearchTerm.toLowerCase();
                    return (
                      project.clientName.toLowerCase().includes(searchLower) ||
                      project.planType.toLowerCase().includes(searchLower) ||
                      project.status.toLowerCase().includes(searchLower)
                    );
                  })
                  .sort((a, b) => {
                    if (projectSortBy === 'deadline') {
                      const dateA = a.status === ProjectStatus.DELIVERED && a.nextMaintenanceDate
                        ? a.nextMaintenanceDate
                        : a.deadline;
                      const dateB = b.status === ProjectStatus.DELIVERED && b.nextMaintenanceDate
                        ? b.nextMaintenanceDate
                        : b.deadline;
                      return getDaysRemaining(dateA) - getDaysRemaining(dateB);
                    } else {
                      return a.clientName.localeCompare(b.clientName);
                    }
                  })
                  .map((project) => {
                    const daysLeft = getDaysRemaining(project.deadline);
                    const urgencyClass = getUrgencyColor(daysLeft, project.status);
                    const income = finances.filter(f => f.projectId === project.id && f.type === 'Ingreso').reduce((a, b) => a + b.amount, 0);
                    const expenses = finances.filter(f => f.projectId === project.id && f.type === 'Gasto').reduce((a, b) => a + b.amount, 0);

                    return (
                      <div
                        key={project.id}
                        className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
                        onClick={() => setSelectedProjectId(project.id)}
                      >
                        {/* Card Header */}
                        <div className="p-5 border-b border-gray-100">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {project.clientName}
                              </h3>
                              <p className="text-sm text-gray-500 mt-0.5">{project.planType}</p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${project.status === ProjectStatus.DELIVERED
                                ? 'bg-gray-100 text-gray-700'
                                : project.status === ProjectStatus.WAITING_RESOURCES
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-50 text-blue-700'
                                }`}>
                                {project.status.split('.')[1] || project.status}
                              </span>
                              {/* Show acceptance badge if in WAITING_RESOURCES */}
                              {project.status === ProjectStatus.WAITING_RESOURCES && (
                                <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-green-100 text-green-700 flex items-center gap-1">
                                  ✓ Presupuesto Aceptado
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Urgency Badge */}
                          {project.blockedStatus ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                              <Lock className="w-4 h-4 text-red-600" />
                              <span className="text-xs font-medium text-red-700">
                                Bloqueado · {Math.floor((Date.now() - new Date(project.blockedSince!).getTime()) / (1000 * 60 * 60 * 24))} días
                              </span>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${urgencyClass}`}>
                              {getUrgencyLabel(daysLeft, project.status)}
                            </span>
                          )}
                        </div>

                        {/* Card Body - Finances */}
                        <div className="p-5 bg-gray-50/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Ingresos</p>
                              <p className="text-lg font-semibold text-green-600">{formatCurrency(income)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1">Gastos</p>
                              <p className="text-lg font-semibold text-red-600">{formatCurrency(expenses)}</p>
                            </div>
                          </div>

                          {/* Maintenance Badge */}
                          {project.status === ProjectStatus.DELIVERED && project.nextMaintenanceDate && (
                            <div className={`mt-3 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${getDaysRemaining(project.nextMaintenanceDate) < 0
                              ? 'bg-red-50 text-red-700'
                              : getDaysRemaining(project.nextMaintenanceDate) <= 7
                                ? 'bg-orange-50 text-orange-700'
                                : 'bg-gray-100 text-gray-700'
                              }`}>
                              <Wrench className="w-3.5 h-3.5" />
                              Mantenimiento: {new Date(project.nextMaintenanceDate).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="px-5 py-3 bg-white border-t border-gray-100">
                          <button className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                            Ver detalles →
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {view === 'clients' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Base de Clientes</h2>
                <button onClick={() => setShowAddClient(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center text-sm hover:bg-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </button>
              </div>

              {/* Modal Agregar Cliente */}
              {showAddClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">{(newClient as any).id ? 'Editar Cliente' : 'Registrar Cliente'}</h3>
                    <form onSubmit={handleAddClientSubmit} className="space-y-4">
                      <input placeholder="Nombre Contacto" className="w-full border p-2 rounded" required
                        value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
                      <input placeholder="Empresa" className="w-full border p-2 rounded"
                        value={newClient.company} onChange={e => setNewClient({ ...newClient, company: e.target.value })} />
                      <input placeholder="Email" type="email" className="w-full border p-2 rounded" required
                        value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                      <input placeholder="Teléfono" className="w-full border p-2 rounded"
                        value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowAddClient(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Crear Proyecto</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar clientes por nombre, empresa o email..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contacto</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Registrado</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {clients
                      .filter((client) => {
                        if (!clientSearchTerm) return true;
                        const searchLower = clientSearchTerm.toLowerCase();
                        return (
                          client.name.toLowerCase().includes(searchLower) ||
                          client.company.toLowerCase().includes(searchLower) ||
                          client.email.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
                                {client.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{client.name}</div>
                                <div className="text-xs text-gray-500">{client.company || 'Sin empresa'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center text-sm text-gray-700">
                                <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                {client.email}
                              </div>
                              {client.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                  {client.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{client.registeredAt}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setNewClient({ ...client, phone: client.phone || '' });
                                  setShowAddClient(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar cliente"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteClientConfirm({
                                    show: true,
                                    clientId: client.id,
                                    clientName: client.name
                                  });
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar cliente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'finance' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Gestión Financiera</h2>

              {/* Add Form */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Registrar Transacción</h3>
                <form onSubmit={handleAddFinanceSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Tipo</label>
                    <select name="type" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="Ingreso">Ingreso</option>
                      <option value="Gasto">Gasto</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">Descripción</label>
                    <input name="description" type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Monto ($)</label>
                    <input name="amount" type="number" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Proyecto (Opcional)</label>
                    <select name="projectId" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">General (Sin Proyecto)</option>
                      {projects.filter(p => p.status !== ProjectStatus.DELIVERED && p.status !== ProjectStatus.CANCELLED).map(p => (
                        <option key={p.id} value={p.id}>{p.clientName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">Guardar Transacción</button>
                  </div>
                </form>
              </div>

              {/* Finance List */}
              <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <div className="divide-y divide-gray-100">
                  {finances.map((record) => (
                    <div key={record.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${record.type === 'Ingreso'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600'
                          }`}>
                          {record.type === 'Ingreso'
                            ? <Plus className="w-5 h-5" />
                            : <DollarSign className="w-5 h-5" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {record.description}
                            </p>
                            {record.projectId && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                                {projects.find(p => p.id === record.projectId)?.clientName || 'Proyecto'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{record.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`text-lg font-bold ${record.type === 'Ingreso' ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {record.type === 'Ingreso' ? '+' : '-'}${record.amount.toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirm({ show: true, financeId: record.id });
                          }}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'notes' && (
            <NotesBoard />
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          client={selectedProjectClient}
          logs={selectedProjectLogs}
          finances={finances.filter(f => String(f.projectId) === String(selectedProject.id))}
          onClose={() => setSelectedProjectId(null)}
          onAddLog={handleAddLog}
          onUpdateLog={handleUpdateLog}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onAddFinance={addFinance}
        />
      )}
      {showPricingConfig && (
        <PricingConfigModal onClose={() => setShowPricingConfig(false)} />
      )}

      {/* Delete Client Confirmation Toast */}
      {deleteClientConfirm.show && (
        <Toast
          type="confirm"
          message={`¿Estás seguro de eliminar al cliente "${deleteClientConfirm.clientName}"?`}
          onConfirm={async () => {
            if (deleteClientConfirm.clientId) {
              await deleteClient(deleteClientConfirm.clientId);
            }
            setDeleteClientConfirm({ show: false, clientId: null, clientName: '' });
          }}
          onCancel={() => setDeleteClientConfirm({ show: false, clientId: null, clientName: '' })}
        />
      )}

      {/* Delete Confirmation Toast */}
      {deleteConfirm.show && (
        <Toast
          type="confirm"
          message="¿Estás seguro de eliminar este registro financiero?"
          onConfirm={() => {
            if (deleteConfirm.financeId) {
              deleteFinance(deleteConfirm.financeId);
            }
            setDeleteConfirm({ show: false, financeId: null });
          }}
          onCancel={() => setDeleteConfirm({ show: false, financeId: null })}
        />
      )}
    </div>
  );
};

export default App;
