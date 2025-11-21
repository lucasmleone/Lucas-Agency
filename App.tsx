
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  DollarSign, 
  LogOut, 
  Menu,
  X,
  Sparkles,
  Send,
  AlertTriangle,
  Plus,
  Phone,
  Mail,
  CheckCircle,
  RefreshCw,
  CreditCard,
  Clock,
  Copy,
  Bell,
  Calendar,
  AlertCircle,
  FileText,
  Trash2,
  Save,
  Edit3,
  Check,
  Pencil,
  ChevronRight,
  Link as LinkIcon,
  Eye,
  Lock,
  Settings
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Project, ProjectStatus, PlanType, FinanceRecord, ProjectLog, MaintenanceStatus, Client, PaymentStatus } from './types';
import { initialProjects, initialFinance, initialLogs, initialClients } from './services/mockData';
import { analyzeLead } from './services/geminiService';

// --- Utils ---

const getDaysRemaining = (deadline: string) => {
  const today = new Date();
  const due = new Date(deadline);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

const getUrgencyColor = (days: number, status: ProjectStatus) => {
  if (status === ProjectStatus.DELIVERED || status === ProjectStatus.CANCELLED) return 'text-gray-500 bg-gray-100';
  if (days < 0) return 'text-red-700 bg-red-100 border-red-200';
  if (days <= 3) return 'text-orange-700 bg-orange-100 border-orange-200';
  return 'text-green-700 bg-green-100 border-green-200';
};

const getUrgencyLabel = (days: number, status: ProjectStatus) => {
  if (status === ProjectStatus.DELIVERED) return 'Completado';
  if (status === ProjectStatus.CANCELLED) return 'Cancelado';
  if (days < 0) return `Atrasado ${Math.abs(days)} días`;
  if (days === 0) return 'Vence Hoy';
  return `${days} días restantes`;
};

// --- Constantes & Textos ---

const TYC_TEXT = `AL ACEPTAR ESTE PRESUPUESTO, USTED CONFIRMA CONFORMIDAD CON:

Exclusiones: El servicio NO incluye diseño de identidad corporativa (logos) ni fotografía.

Plazos: El tiempo de desarrollo (4 semanas) inicia ÚNICAMENTE tras recibir el 50% de anticipo y toda la información base.

Contenidos: Si el cliente se demora en enviar los textos, se usarán textos de relleno (o IA) bajo solicitud para no detener el cronograma.

Inactividad: Tras 30 días sin respuesta o feedback, el proyecto pasará a estado "Stand-by" (Pausado) y saldrá de la agenda activa.

Pagos: 50% al inicio, 50% contra aprobación final. Importante: No se publicará la web definitiva ni se entregarán credenciales de administración hasta la liquidación total del pago.

Validez: Esta propuesta digital vence automáticamente en 30 días.`;

// --- Plantillas de Email ---

const getEmailTemplate = (type: string, project: Project) => {
  const clientName = project.clientName;
  
  switch(type) {
    case 'PROPOSAL':
      return {
        subject: `Propuesta de Desarrollo Web - ${clientName} - Leone Agencia`,
        body: `Hola ${clientName},

Adjunto encontrarás el detalle de nuestra propuesta para el desarrollo de tu sitio web.

RESUMEN DEL PLAN: ${project.planType}
INVERSIÓN: $${project.budget} USD

---
TÉRMINOS Y CONDICIONES
${TYC_TEXT}
---

Para comenzar, por favor responde a este correo confirmando tu aceptación o haz clic en el botón de abajo (si estuviéramos en una plataforma automática).

Quedo atento a tus comentarios.

Saludos,
Leone Agencia`
      };
    case 'REVIEW':
      return {
        subject: `Revisión de Avance - ${clientName} - Leone Agencia`,
        body: `Hola ${clientName},

El desarrollo de tu sitio web ha avanzado considerablemente. 

Puedes ver el progreso en tiempo real aquí:
LINK DE DESARROLLO: ${project.devUrl || '[Insertar URL]'}

Nos gustaría agendar una breve reunión para revisar los detalles y correcciones.
Agenda tu sesión aquí: [Link de Calendly]

Saludos,
Leone Agencia`
      };
    default:
      return { subject: '', body: '' };
  }
};


// --- Componentes ---

// 1. Formulario Público
const PublicForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    plan: PlanType.SINGLE,
    budget: '',
    description: '',
    url: '',
    goal: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ ...formData, budget: Number(formData.budget) });
    setIsSubmitting(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
    setFormData({ name: '', email: '', phone: '', plan: PlanType.SINGLE, budget: '', description: '', url: '', goal: '' });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">LEONE AGENCIA</h1>
        <p className="text-lg text-gray-500 uppercase tracking-widest text-xs font-bold">Desarrollo Web & Estrategia</p>
        <h2 className="mt-10 text-2xl font-bold text-gray-900">Inicia tu Proyecto</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-50 py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border border-gray-100">
          {success ? (
            <div className="rounded-md bg-green-50 p-4 border border-green-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-bold text-green-800">¡Solicitud Enviada!</h3>
                  <p className="mt-1 text-sm text-green-700">Te contactaremos pronto.</p>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Stage 1 inputs */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre / Empresa</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-gray-900 focus:border-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Web Actual (URL)</label>
                <input type="text" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-gray-900 focus:border-gray-900" placeholder="Ej: www.miempresa.com (o vacío)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Objetivo Principal</label>
                <input required type="text" value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-gray-900 focus:border-gray-900" placeholder="Ej: Vender más, Captar leads..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-gray-900 focus:border-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Deseado</label>
                <select value={formData.plan} onChange={(e) => setFormData({...formData, plan: e.target.value as PlanType})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-gray-900 focus:border-gray-900">
                  {Object.values(PlanType).map((plan) => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Presupuesto ($USD)</label>
                <input required type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-gray-900 focus:border-gray-900" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-black transition-colors">
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Dashboard Action Center
const ActionCenter = ({ projects }: { projects: Project[] }) => {
  const urgentProjects = projects
    .filter(p => p.status !== ProjectStatus.DELIVERED && p.status !== ProjectStatus.CANCELLED && p.status !== ProjectStatus.LOST)
    .map(p => ({ ...p, daysLeft: getDaysRemaining(p.deadline) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4);

  if (urgentProjects.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
        Atención Prioritaria
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {urgentProjects.map(p => {
           const urgencyClass = getUrgencyColor(p.daysLeft, p.status);
           return (
            <div key={p.id} className={`p-4 rounded-lg border shadow-sm bg-white flex flex-col justify-between`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-900 truncate block w-3/4">{p.clientName}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${urgencyClass}`}>
                        {getUrgencyLabel(p.daysLeft, p.status)}
                    </span>
                </div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase">{p.status}</p>
                {/* Blocking Status Alerts */}
                {p.status === ProjectStatus.WAITING_RESOURCES && (
                   <div className="text-[10px] bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center">
                      <Lock className="w-3 h-3 mr-1" /> Bloqueado: Falta Info/Pago
                   </div>
                )}
              </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};

// 3. Project Detail - Workflow Command Center
const ProjectDetail = ({ 
  project, 
  logs, 
  onClose, 
  onAddLog,
  onUpdateLog,
  onUpdateProject,
  onDeleteProject
}: { 
  project: Project; 
  logs: ProjectLog[]; 
  onClose: () => void;
  onAddLog: (text: string) => void;
  onUpdateLog: (logId: string, text: string) => void;
  onUpdateProject: (updated: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}) => {
  // Tabs: Workflow, Data, Logs
  const [activeTab, setActiveTab] = useState<'workflow' | 'data' | 'logs'>('workflow');
  
  // Master Status State
  const [status, setStatus] = useState(project.status);
  
  // Unified Data State
  const [discoveryData, setDiscoveryData] = useState(project.discoveryData || {
    buyerPersona: '', competitors: '', references: '', materialStatus: '', currentUrl: '', objective: ''
  });
  
  const [checklists, setChecklists] = useState(project.checklists || {
    depositPaid: false, infoReceived: false, fillerAccepted: false, finalPaymentPaid: false
  });
  
  const [generalData, setGeneralData] = useState({
      planType: project.planType,
      budget: project.budget,
      deadline: project.deadline,
      paymentStatus: project.paymentStatus,
      devUrl: project.devUrl || ''
  });

  const [newComment, setNewComment] = useState('');
  const [deleteStage, setDeleteStage] = useState(0);

  // Handlers
  const handleStatusChange = (newStatus: ProjectStatus) => {
      setStatus(newStatus);
      onUpdateProject({ status: newStatus });
      onAddLog(`Estado cambiado manualmente a: ${newStatus}`);
  };

  const handleSaveData = () => {
    onUpdateProject({ 
        ...generalData,
        discoveryData,
        checklists,
        status 
    });
    onAddLog('Datos del proyecto actualizados (Edición Manual).');
    alert('Cambios guardados correctamente.');
  };

  const handleStageChange = (newStage: ProjectStatus) => {
    setStatus(newStage);
    onUpdateProject({ status: newStage });
    onAddLog(`Estado cambiado a: ${newStage}`);
  };

  const handleChecklistChange = (key: keyof typeof checklists) => {
     const newCheck = { ...checklists, [key]: !checklists[key] };
     setChecklists(newCheck);
     onUpdateProject({ checklists: newCheck });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  // Helper to render Technical Sheet Side Panel (Visible in Stage 5+)
  const TechnicalSheet = () => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs space-y-3 h-fit">
       <h4 className="font-bold text-gray-900 flex items-center"><FileText className="w-3 h-3 mr-2"/> FICHA TÉCNICA</h4>
       <div><span className="font-bold text-gray-600 block">Objetivo:</span> {discoveryData.objective || '-'}</div>
       <div><span className="font-bold text-gray-600 block">Buyer Persona:</span> {discoveryData.buyerPersona || '-'}</div>
       <div><span className="font-bold text-gray-600 block">Competencia:</span> {discoveryData.competitors || '-'}</div>
       <div><span className="font-bold text-gray-600 block">Referencias:</span> {discoveryData.references || '-'}</div>
       <div><span className="font-bold text-gray-600 block">Materiales:</span> {discoveryData.materialStatus || '-'}</div>
       <div className="pt-2 border-t border-gray-200">
          <span className="font-bold text-gray-600 block mb-1">URL Desarrollo:</span> 
          <a href={generalData.devUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline truncate block">{generalData.devUrl || 'No asignada'}</a>
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-t-xl sm:rounded-xl text-left overflow-hidden shadow-2xl transform transition-all w-full sm:max-w-6xl h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gray-900 px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    {project.clientName}
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                   {generalData.planType} | {generalData.deadline}
                </p>
              </div>
              {/* Master Status Dropdown */}
              <select 
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                className="bg-indigo-600 text-white text-xs font-bold py-1 px-2 rounded border-none cursor-pointer hover:bg-indigo-700 focus:ring-0"
              >
                {Object.values(ProjectStatus).map(s => (
                    <option key={s} value={s} className="text-gray-900 bg-white">{s}</option>
                ))}
              </select>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-100 px-6 py-2 flex gap-2 overflow-x-auto border-b border-gray-200 shrink-0">
            <button onClick={() => setActiveTab('workflow')} className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-t-lg ${activeTab === 'workflow' ? 'bg-white text-gray-900 border-t border-x border-gray-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                Flujo de Trabajo
            </button>
            <button onClick={() => setActiveTab('data')} className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-t-lg flex items-center ${activeTab === 'data' ? 'bg-white text-gray-900 border-t border-x border-gray-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                <Settings className="w-4 h-4 mr-2"/> Datos y Edición
            </button>
            <button onClick={() => setActiveTab('logs')} className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-t-lg ${activeTab === 'logs' ? 'bg-white text-gray-900 border-t border-x border-gray-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                Bitácora
            </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          
          {activeTab === 'logs' && (
             <div className="h-full flex flex-col">
                 <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {logs.length === 0 && <p className="text-gray-400 text-center italic">Sin registros.</p>}
                    {logs.map(log => (
                        <div key={log.id} className="bg-gray-50 p-3 rounded border border-gray-100 group">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span className="font-bold">{log.author}</span>
                                <span>{log.createdAt}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <p className="text-sm text-gray-800">{log.comment}</p>
                                <button onClick={() => { 
                                    const newText = prompt('Editar nota:', log.comment); 
                                    if(newText) onUpdateLog(log.id, newText); 
                                }} className="text-gray-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-3 h-3"/></button>
                            </div>
                        </div>
                    ))}
                 </div>
                 <form onSubmit={(e) => { e.preventDefault(); if(newComment.trim()) { onAddLog(newComment); setNewComment(''); } }} className="flex gap-2">
                    <input className="flex-1 border rounded p-2" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Escribir nota..." />
                    <button className="bg-gray-900 text-white p-2 rounded"><Send className="w-4 h-4"/></button>
                 </form>
             </div>
          )}

          {activeTab === 'data' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Edición Completa del Proyecto</h3>
                      <button onClick={handleSaveData} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md flex items-center">
                          <Save className="w-4 h-4 mr-2" /> Guardar Cambios Globales
                      </button>
                  </div>
                  
                  {/* Section 1: General */}
                  <div className="bg-white p-6 border rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 pb-2 border-b">Configuración General</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                              <select 
                                value={generalData.planType}
                                onChange={(e) => setGeneralData({...generalData, planType: e.target.value as PlanType})}
                                className="w-full border rounded p-2 text-sm"
                              >
                                  {Object.values(PlanType).map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto ($USD)</label>
                              <input type="number" value={generalData.budget} onChange={e => setGeneralData({...generalData, budget: Number(e.target.value)})} className="w-full border rounded p-2 text-sm" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                              <input type="date" value={generalData.deadline} onChange={e => setGeneralData({...generalData, deadline: e.target.value})} className="w-full border rounded p-2 text-sm" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Pago</label>
                              <select 
                                value={generalData.paymentStatus}
                                onChange={(e) => setGeneralData({...generalData, paymentStatus: e.target.value as PaymentStatus})}
                                className="w-full border rounded p-2 text-sm"
                              >
                                  {Object.values(PaymentStatus).map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                          </div>
                      </div>
                  </div>

                  {/* Section 2: Discovery Data */}
                  <div className="bg-white p-6 border rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 pb-2 border-b">Datos Discovery & Ficha Técnica</h4>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo Principal</label>
                              <input type="text" value={discoveryData.objective} onChange={e => setDiscoveryData({...discoveryData, objective: e.target.value})} className="w-full border rounded p-2 text-sm" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">URL Actual</label>
                              <input type="text" value={discoveryData.currentUrl} onChange={e => setDiscoveryData({...discoveryData, currentUrl: e.target.value})} className="w-full border rounded p-2 text-sm" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Persona</label>
                                <textarea rows={3} value={discoveryData.buyerPersona} onChange={e => setDiscoveryData({...discoveryData, buyerPersona: e.target.value})} className="w-full border rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Competencia</label>
                                <textarea rows={3} value={discoveryData.competitors} onChange={e => setDiscoveryData({...discoveryData, competitors: e.target.value})} className="w-full border rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Referencias</label>
                                <textarea rows={3} value={discoveryData.references} onChange={e => setDiscoveryData({...discoveryData, references: e.target.value})} className="w-full border rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado Materiales</label>
                                <textarea rows={3} value={discoveryData.materialStatus} onChange={e => setDiscoveryData({...discoveryData, materialStatus: e.target.value})} className="w-full border rounded p-2 text-sm" />
                            </div>
                          </div>
                      </div>
                  </div>

                  {/* Section 3: Checklists & Technical */}
                  <div className="bg-white p-6 border rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 pb-2 border-b">Técnico & Control</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">URL de Desarrollo (Dev)</label>
                              <input type="text" value={generalData.devUrl} onChange={e => setGeneralData({...generalData, devUrl: e.target.value})} className="w-full border rounded p-2 text-sm" />
                          </div>
                          <div className="bg-gray-50 p-4 rounded">
                              <label className="block text-xs font-bold text-gray-500 mb-2">Override Checklists</label>
                              <div className="space-y-2">
                                  <label className="flex items-center space-x-2">
                                      <input type="checkbox" checked={checklists.depositPaid} onChange={() => handleChecklistChange('depositPaid')} className="rounded text-indigo-600"/>
                                      <span className="text-sm">Anticipo Pagado</span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                      <input type="checkbox" checked={checklists.infoReceived} onChange={() => handleChecklistChange('infoReceived')} className="rounded text-indigo-600"/>
                                      <span className="text-sm">Info Recibida</span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                      <input type="checkbox" checked={checklists.finalPaymentPaid} onChange={() => handleChecklistChange('finalPaymentPaid')} className="rounded text-indigo-600"/>
                                      <span className="text-sm">Pago Final OK</span>
                                  </label>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'workflow' && (
            <div className="flex flex-col md:flex-row gap-6 h-full">
                
                {/* Left: Stage Action Area */}
                <div className="flex-1 space-y-6">
                    
                    {/* Stage 1: Prospection */}
                    {status === ProjectStatus.PROSPECTION && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Users className="w-5 h-5 mr-2"/> 1. Prospección</h4>
                            <p className="text-sm text-gray-600 mb-4">Objetivo: Obtener datos mínimos y filtrar.</p>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-3 rounded">
                                    <span className="text-xs font-bold text-gray-500 block mb-1">Web Actual</span>
                                    <input 
                                        type="text" 
                                        value={discoveryData.currentUrl} 
                                        onChange={(e) => setDiscoveryData({...discoveryData, currentUrl: e.target.value})}
                                        className="w-full text-sm p-1 border rounded border-gray-300"
                                    />
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <span className="text-xs font-bold text-gray-500 block mb-1">Objetivo</span>
                                    <input 
                                        type="text" 
                                        value={discoveryData.objective} 
                                        onChange={(e) => setDiscoveryData({...discoveryData, objective: e.target.value})}
                                        className="w-full text-sm p-1 border rounded border-gray-300"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { handleSaveData(); handleStageChange(ProjectStatus.DISCOVERY); }} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-indigo-700 flex items-center">
                                    Guardar & Aprobar &rarr; Ir a Discovery
                                </button>
                                <button onClick={() => handleStageChange(ProjectStatus.LOST)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-bold text-sm hover:bg-gray-300">
                                    Descartar (Lead Perdido)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Stage 2: Discovery */}
                    {status === ProjectStatus.DISCOVERY && (
                        <div className="bg-white border border-indigo-100 ring-1 ring-indigo-50 rounded-xl p-6 shadow-sm">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-indigo-600"/> 2. Discovery (Entrevista)</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Buyer Persona</label>
                                    <textarea className="w-full border-gray-300 rounded text-sm p-2" rows={2} value={discoveryData.buyerPersona} onChange={e => setDiscoveryData({...discoveryData, buyerPersona: e.target.value})} placeholder="¿Quién es su cliente ideal?" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Competencia (Top 3)</label>
                                    <textarea className="w-full border-gray-300 rounded text-sm p-2" rows={2} value={discoveryData.competitors} onChange={e => setDiscoveryData({...discoveryData, competitors: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Referencias Visuales</label>
                                    <textarea className="w-full border-gray-300 rounded text-sm p-2" rows={2} value={discoveryData.references} onChange={e => setDiscoveryData({...discoveryData, references: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Estado Materiales (Logo/Texto)</label>
                                    <input className="w-full border-gray-300 rounded text-sm p-2" value={discoveryData.materialStatus} onChange={e => setDiscoveryData({...discoveryData, materialStatus: e.target.value})} />
                                </div>
                                <div className="flex justify-between pt-4">
                                    <button onClick={handleSaveData} className="text-indigo-600 text-sm font-bold hover:underline">Guardar Datos</button>
                                    <button onClick={() => { handleSaveData(); handleStageChange(ProjectStatus.PROPOSAL); }} className="bg-gray-900 text-white px-4 py-2 rounded font-bold text-sm hover:bg-black flex items-center">
                                        Guardar y Avanzar &rarr;
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage 3: Proposal */}
                    {status === ProjectStatus.PROPOSAL && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2"/> 3. Propuesta y Contrato</h4>
                            <p className="text-sm text-gray-600 mb-4">Envía la propuesta automática con los T&C. Espera la aceptación.</p>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Vista Previa del Email</h5>
                                <div className="text-xs text-gray-800 whitespace-pre-wrap font-mono bg-white p-3 border rounded max-h-60 overflow-y-auto">
                                    {getEmailTemplate('PROPOSAL', project).body}
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(getEmailTemplate('PROPOSAL', project).body)} 
                                    className="mt-2 text-xs text-indigo-600 font-bold flex items-center hover:underline"
                                >
                                    <Copy className="w-3 h-3 mr-1"/> Copiar al Portapapeles
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => handleStageChange(ProjectStatus.WAITING_RESOURCES)} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-green-700 flex items-center w-full justify-center">
                                    <Check className="w-4 h-4 mr-2"/> Cliente Aceptó Presupuesto
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Stage 4: Waiting Resources */}
                    {status === ProjectStatus.WAITING_RESOURCES && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
                            <h4 className="text-lg font-bold text-orange-900 mb-4 flex items-center"><Lock className="w-5 h-5 mr-2"/> 4. Espera de Recursos (Bloqueo)</h4>
                            <div className="bg-white p-4 rounded-lg shadow-sm space-y-3 mb-6">
                                <label className="flex items-center space-x-3">
                                    <input type="checkbox" checked={checklists.depositPaid} onChange={() => handleChecklistChange('depositPaid')} className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"/>
                                    <span className="text-sm font-medium text-gray-900">Anticipo 50% Recibido</span>
                                </label>
                                <label className="flex items-center space-x-3">
                                    <input type="checkbox" checked={checklists.infoReceived} onChange={() => handleChecklistChange('infoReceived')} className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"/>
                                    <span className="text-sm font-medium text-gray-900">Accesos/Archivos Recibidos</span>
                                </label>
                                <label className="flex items-center space-x-3">
                                    <input type="checkbox" checked={checklists.fillerAccepted} onChange={() => handleChecklistChange('fillerAccepted')} className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"/>
                                    <span className="text-sm font-medium text-gray-500">Modo Relleno Aceptado (Opcional)</span>
                                </label>
                            </div>

                            <button 
                                disabled={!checklists.depositPaid || (!checklists.infoReceived && !checklists.fillerAccepted)}
                                onClick={() => { 
                                    onUpdateProject({ paymentStatus: PaymentStatus.DEPOSIT_PAID });
                                    handleStageChange(ProjectStatus.PRODUCTION); 
                                }} 
                                className={`w-full px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center transition-colors ${
                                    (checklists.depositPaid && (checklists.infoReceived || checklists.fillerAccepted)) 
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {(checklists.depositPaid && (checklists.infoReceived || checklists.fillerAccepted)) ? 'Desbloquear & Iniciar Producción' : 'Completar Checklist para Avanzar'}
                            </button>
                        </div>
                    )}

                    {/* Stage 5: Production */}
                    {status === ProjectStatus.PRODUCTION && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-2"/> 5. Producción y Revisión</h4>
                            
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-700 mb-1">URL de Desarrollo (Staging)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={generalData.devUrl} onChange={e => setGeneralData({...generalData, devUrl: e.target.value})} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" placeholder="https://..." />
                                    <button onClick={() => { handleSaveData(); onAddLog(`URL Desarrollo actualizada: ${generalData.devUrl}`); }} className="bg-gray-200 text-gray-700 px-3 rounded text-xs font-bold">Guardar</button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Enviar Revisión</h5>
                                <p className="text-xs text-gray-600 mb-2">Genera el correo con el link de desarrollo y tu Calendly.</p>
                                <button 
                                    onClick={() => copyToClipboard(getEmailTemplate('REVIEW', project).body)}
                                    className="text-indigo-600 text-xs font-bold hover:underline"
                                >
                                    Copiar Plantilla Email Revisión
                                </button>
                            </div>

                            <button onClick={() => handleStageChange(ProjectStatus.DELIVERY)} className="w-full bg-gray-900 text-white px-4 py-3 rounded font-bold text-sm hover:bg-black">
                                Finalizar Desarrollo &rarr; Ir a Cierre
                            </button>
                        </div>
                    )}

                    {/* Stage 6: Delivery */}
                    {status === ProjectStatus.DELIVERY && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm">
                            <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2"/> 6. Cierre y Entrega</h4>
                            
                            <div className="bg-white p-4 rounded-lg shadow-sm space-y-3 mb-6">
                                <label className="flex items-center space-x-3">
                                    <input type="checkbox" checked={checklists.finalPaymentPaid} onChange={() => handleChecklistChange('finalPaymentPaid')} className="h-5 w-5 text-green-600 rounded focus:ring-green-500"/>
                                    <span className="text-sm font-bold text-gray-900">Factura Final Pagada</span>
                                </label>
                            </div>

                            {checklists.finalPaymentPaid ? (
                                <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center">
                                    <p className="font-bold mb-2">¡Proyecto Liberado!</p>
                                    <p className="text-sm mb-4">Ya puedes entregar credenciales. El proyecto está en mantenimiento.</p>
                                    <button onClick={() => { onUpdateProject({ paymentStatus: PaymentStatus.FULLY_PAID, status: ProjectStatus.DELIVERED }); onClose(); }} className="bg-green-700 text-white px-4 py-2 rounded text-sm font-bold">
                                        Cerrar Proyecto (Archivar)
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-red-50 text-red-700 p-3 rounded text-xs font-bold text-center">
                                    ⛔ PROHIBIDO ENTREGAR CREDENCIALES HASTA EL PAGO FINAL.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stage 7: Cancelled/Lost */}
                     {(status === ProjectStatus.CANCELLED || status === ProjectStatus.LOST) && (
                        <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 shadow-sm text-center">
                             <h4 className="text-lg font-bold text-gray-500 mb-4">Proyecto Archivado / Perdido</h4>
                             <button onClick={() => handleStageChange(ProjectStatus.PROSPECTION)} className="text-indigo-600 text-sm font-bold underline">Reactivar (Volver a Prospección)</button>
                        </div>
                     )}

                     {/* Danger Zone (Always visible if not delivered) */}
                     {status !== ProjectStatus.DELIVERED && (
                         <div className="mt-8 pt-8 border-t border-gray-100">
                             <button 
                                onClick={() => { if(deleteStage === 0) setDeleteStage(1); else if(deleteStage === 1) setDeleteStage(2); else onDeleteProject(project.id); }}
                                className={`text-xs text-gray-400 hover:text-red-600 underline ${deleteStage > 0 ? 'text-red-600 font-bold' : ''}`}
                             >
                                 {deleteStage === 0 && "Eliminar Proyecto"}
                                 {deleteStage === 1 && "¿Seguro?"}
                                 {deleteStage === 2 && "CONFIRMAR ELIMINACIÓN"}
                             </button>
                         </div>
                     )}
                </div>

                {/* Right: Technical Sheet (Sticky) */}
                {(status === ProjectStatus.PRODUCTION || status === ProjectStatus.DELIVERY || status === ProjectStatus.WAITING_RESOURCES) && (
                    <div className="w-full md:w-1/3 shrink-0">
                        <TechnicalSheet />
                    </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- App Principal ---

const App = () => {
  // --- Estados ---
  const [view, setView] = useState<'public' | 'login' | 'dashboard' | 'projects' | 'finance' | 'clients'>('login');
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [finances, setFinances] = useState<FinanceRecord[]>(initialFinance);
  const [logs, setLogs] = useState<ProjectLog[]>(initialLogs);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Auth Mock
  const [auth, setAuth] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  // Modal agregar cliente
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', company: '', phone: '' });

  // Modal agregar Proyecto
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ clientId: '', plan: PlanType.SINGLE, budget: '', deadline: '' });

  // --- Acciones ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = auth.email.trim().toLowerCase();
    const passwordClean = auth.password.trim();
    
    if (emailClean === 'admin@agency.com' && passwordClean === 'admin123') {
      setView('dashboard');
      setLoginError(null);
    } else {
      setLoginError('Credenciales inválidas.');
    }
  };

  const handlePublicSubmit = async (data: any) => {
    // 1. Análisis IA
    // const analysis = await analyzeLead(data.plan, data.budget, data.description || "");
    
    // 2. Crear Cliente (si es nuevo, simplificado para demo)
    const newClientId = Date.now().toString();
    const newClientObj: Client = {
      id: newClientId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      registeredAt: new Date().toISOString().split('T')[0],
      company: 'N/A'
    };
    setClients(prev => [...prev, newClientObj]);

    // 3. Crear Proyecto
    const newProject: Project = {
      id: (Date.now() + 1).toString(),
      clientId: newClientId,
      clientName: data.name,
      planType: data.plan,
      budget: data.budget,
      status: ProjectStatus.PROSPECTION, // Stage 1
      paymentStatus: PaymentStatus.PENDING,
      maintenanceStatus: MaintenanceStatus.FREE_PERIOD,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      alertNeeds: '', // analysis.alert || undefined,
      description: data.description,
      discoveryData: {
          currentUrl: data.url,
          objective: data.goal,
          buyerPersona: '',
          competitors: '',
          references: '',
          materialStatus: ''
      }
    };

    // 4. Guardar
    setProjects(prev => [...prev, newProject]);
    
    // 5. Log
    const newLog: ProjectLog = {
      id: Date.now().toString(),
      projectId: newProject.id,
      author: 'Sistema',
      comment: `Lead recibido vía web.`, // Viabilidad: ${analysis.viabilityScore}/100.
      createdAt: new Date().toISOString().split('T')[0]
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleAddLog = (text: string) => {
    if (!selectedProjectId) return;
    const newLog: ProjectLog = {
      id: Date.now().toString(),
      projectId: selectedProjectId,
      comment: text,
      createdAt: new Date().toISOString().split('T')[0],
      author: 'Admin'
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleUpdateLog = (logId: string, newText: string) => {
    setLogs(prev => prev.map(log => 
        log.id === logId ? { ...log, comment: newText } : log
    ));
  };

  const handleUpdateProject = (updatedFields: Partial<Project>) => {
    if (!selectedProjectId) return;
    setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, ...updatedFields } : p));
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setSelectedProjectId(null); // Cerrar modal
    alert('Proyecto eliminado definitivamente.');
  };

  const handleAddFinance = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const newRecord: FinanceRecord = {
        id: Date.now().toString(),
        type: data.get('type') as 'Ingreso' | 'Gasto',
        description: data.get('description') as string,
        amount: Number(data.get('amount')),
        date: new Date().toISOString().split('T')[0]
    };
    setFinances(prev => [...prev, newRecord]);
    form.reset();
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
      id: Date.now().toString(),
      ...newClient,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    setClients([...clients, client]);
    setShowAddClient(false);
    setNewClient({ name: '', email: '', company: '', phone: '' });
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newProjectData.clientId) return;

    const client = clients.find(c => c.id === newProjectData.clientId);
    
    const newProject: Project = {
        id: Date.now().toString(),
        clientId: newProjectData.clientId,
        clientName: client ? client.name : 'Desconocido',
        planType: newProjectData.plan,
        budget: Number(newProjectData.budget),
        status: ProjectStatus.PROSPECTION,
        paymentStatus: PaymentStatus.PENDING,
        maintenanceStatus: MaintenanceStatus.FREE_PERIOD,
        deadline: newProjectData.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        alertNeeds: '',
        discoveryData: {
            buyerPersona: '', competitors: '', references: '', materialStatus: '', currentUrl: '', objective: ''
        }
    };
    setProjects([...projects, newProject]);
    
    const newLog: ProjectLog = {
        id: Date.now().toString(),
        projectId: newProject.id,
        author: 'Admin',
        comment: `Proyecto creado manualmente.`,
        createdAt: new Date().toISOString().split('T')[0]
    };
    setLogs(prev => [...prev, newLog]);

    setShowAddProject(false);
    setNewProjectData({ clientId: '', plan: PlanType.SINGLE, budget: '', deadline: '' });
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    setMobileMenuOpen(false);
  };

  // --- Derived State ---
  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const selectedProjectLogs = useMemo(() => logs.filter(l => l.projectId === selectedProjectId), [logs, selectedProjectId]);

  // --- Vistas ---

  if (view === 'public') {
    return (
      <div>
        <div className="absolute top-4 right-4">
             <button onClick={() => setView('login')} className="text-sm text-gray-600 hover:text-black font-medium underline">Portal Admin</button>
        </div>
        <PublicForm onSubmit={handlePublicSubmit} />
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">LEONE AGENCIA</h1>
            <p className="text-gray-500 mt-2 text-sm">Sistema de Gestión ERP</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{loginError}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                value={auth.email} 
                onChange={e => setAuth({...auth, email: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input 
                type="password" 
                value={auth.password} 
                onChange={e => setAuth({...auth, password: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800">
              Entrar
            </button>
          </form>
           <div className="mt-4 text-center flex flex-col gap-2">
             <button 
               type="button"
               onClick={() => setAuth({ email: 'admin@agency.com', password: 'admin123' })}
               className="text-xs text-indigo-500 hover:text-indigo-700 underline"
             >
               Demo: Autofill (admin@agency.com)
             </button>
             <button onClick={() => setView('public')} className="text-sm text-gray-600 hover:text-gray-900">Ver Formulario Web</button>
           </div>
        </div>
      </div>
    );
  }

  // Layout Admin
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar (Desktop) */}
      <div className="w-64 bg-gray-900 text-white hidden md:flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-black tracking-tighter">LEONE AGENCIA</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Console v2.0</p>
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
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => setView('login')} className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
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
               <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400"><X className="w-6 h-6"/></button>
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
            </nav>
            <div className="p-4 border-t border-gray-800">
               <button onClick={() => setView('login')} className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
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
                <span className="font-black text-lg">LEONE</span>
           </div>
           <div className="flex items-center justify-end w-full gap-4">
               <div className="relative">
                   <Bell className="w-5 h-5 text-gray-500" />
                   <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
               </div>
               <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">A</div>
                   <span className="text-sm font-medium text-gray-700 hidden sm:inline">Admin</span>
               </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          
          {view === 'dashboard' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Resumen General</h2>
                  <p className="text-xs sm:text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
              </div>
              
              <ActionCenter projects={projects} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ingresos Netos</p>
                   <p className="text-3xl font-black text-gray-900 mt-2">
                     ${finances.filter(f => f.type === 'Ingreso').reduce((a,b) => a+b.amount, 0) - finances.filter(f => f.type === 'Gasto').reduce((a,b) => a+b.amount, 0)}
                   </p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proyectos Activos</p>
                   <p className="text-3xl font-black text-indigo-600 mt-2">{projects.filter(p => p.status !== ProjectStatus.DELIVERED && p.status !== ProjectStatus.CANCELLED).length}</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Por Cobrar</p>
                   <p className="text-3xl font-black text-orange-500 mt-2">
                     {projects.filter(p => p.paymentStatus !== PaymentStatus.FULLY_PAID).length} <span className="text-sm font-medium text-gray-400">Proyectos</span>
                   </p>
                 </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Flujo de Caja Mensual</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ name: 'Total', Ingresos: finances.filter(f => f.type === 'Ingreso').reduce((a,b) => a+b.amount, 0), Gastos: finances.filter(f => f.type === 'Gasto').reduce((a,b) => a+b.amount, 0) }]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value}`} />
                        <Legend />
                        <Bar dataKey="Ingresos" fill="#10B981" />
                        <Bar dataKey="Gastos" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              </div>
            </div>
          )}

          {view === 'projects' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Cartera de Proyectos</h2>
                  <button onClick={() => setShowAddProject(true)} className="bg-gray-900 text-white px-4 py-2.5 rounded-lg flex items-center text-sm font-medium hover:bg-black shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear
                  </button>
               </div>

                {/* Modal Agregar Proyecto */}
                {showAddProject && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                      <h3 className="text-xl font-bold mb-6 text-gray-900">Nuevo Proyecto</h3>
                      <form onSubmit={handleAddProject} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
                            <select 
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-gray-900 focus:border-gray-900" 
                                required 
                                value={newProjectData.clientId} 
                                onChange={e => setNewProjectData({...newProjectData, clientId: e.target.value})}
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
                                onChange={(e) => setNewProjectData({...newProjectData, plan: e.target.value as PlanType})}
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-gray-900 focus:border-gray-900"
                            >
                                {Object.values(PlanType).map((plan) => (
                                    <option key={plan} value={plan}>{plan}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Presupuesto</label>
                                <input 
                                    type="number" 
                                    placeholder="$ USD" 
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-gray-900 focus:border-gray-900" 
                                    required
                                    value={newProjectData.budget} 
                                    onChange={e => setNewProjectData({...newProjectData, budget: e.target.value})} 
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Entrega</label>
                                <input 
                                    type="date"
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-gray-900 focus:border-gray-900" 
                                    value={newProjectData.deadline} 
                                    onChange={e => setNewProjectData({...newProjectData, deadline: e.target.value})} 
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

               <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                         <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Etapa</th>
                         <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Urgencia</th>
                         <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Finanzas</th>
                         <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {[...projects]
                          .sort((a,b) => getDaysRemaining(a.deadline) - getDaysRemaining(b.deadline))
                          .map((project) => {
                            const daysLeft = getDaysRemaining(project.deadline);
                            const urgencyClass = getUrgencyColor(daysLeft, project.status);
                            
                            return (
                             <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex flex-col">
                                   <div className="text-sm font-bold text-gray-900">{project.clientName}</div>
                                   <div className="text-xs text-gray-500">{project.planType}</div>
                                 </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                   ${project.status === ProjectStatus.DELIVERED ? 'bg-gray-100 text-gray-800' : 
                                     project.status === ProjectStatus.WAITING_RESOURCES ? 'bg-orange-100 text-orange-800 border border-orange-200' : 
                                     'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                   {project.status}
                                 </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded text-xs font-bold border ${urgencyClass}`}>
                                      {getUrgencyLabel(daysLeft, project.status)}
                                  </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex flex-col">
                                      <span className="font-mono text-xs">${project.budget}</span>
                                      <span className={`text-[10px] font-bold ${project.paymentStatus === PaymentStatus.FULLY_PAID ? 'text-green-600' : 'text-red-500'}`}>
                                          {project.paymentStatus || 'PENDIENTE'}
                                      </span>
                                  </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                 <button 
                                   onClick={() => setSelectedProjectId(project.id)}
                                   className="text-indigo-600 hover:text-indigo-900 font-bold text-xs border border-indigo-200 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors"
                                 >
                                   GESTIONAR
                                 </button>
                               </td>
                             </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
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
                      <h3 className="text-lg font-bold mb-4">Registrar Cliente</h3>
                      <form onSubmit={handleAddClient} className="space-y-4">
                        <input placeholder="Nombre Contacto" className="w-full border p-2 rounded" required 
                          value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                        <input placeholder="Empresa" className="w-full border p-2 rounded" 
                          value={newClient.company} onChange={e => setNewClient({...newClient, company: e.target.value})} />
                        <input placeholder="Email" type="email" className="w-full border p-2 rounded" required
                          value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                        <input placeholder="Teléfono" className="w-full border p-2 rounded" 
                          value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowAddClient(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Guardar</button>
                        </div>
                      </form>
                    </div>
                 </div>
               )}

               <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datos</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {clients.map((client) => (
                         <tr key={client.id} className="hover:bg-gray-50">
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.company || '-'}</td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center"><Mail className="w-3 h-3 mr-2"/>{client.email}</div>
                                {client.phone && <div className="flex items-center"><Phone className="w-3 h-3 mr-2"/>{client.phone}</div>}
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.registeredAt}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}

          {view === 'finance' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Gestión Financiera</h2>
              
              {/* Add Form */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Registrar Transacción</h3>
                <form onSubmit={handleAddFinance} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                  <div className="md:col-span-4 flex justify-end">
                     <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700">Guardar</button>
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {finances.map((record) => (
                    <li key={record.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                       <div className="flex items-center">
                         <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${record.type === 'Ingreso' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {record.type === 'Ingreso' ? <Plus className="h-5 w-5 text-green-600" /> : <DollarSign className="h-5 w-5 text-red-600" />}
                         </div>
                         <div className="ml-4">
                           <div className="text-sm font-medium text-gray-900">{record.description}</div>
                           <div className="text-sm text-gray-500">{record.date}</div>
                         </div>
                       </div>
                       <div className={`text-sm font-bold ${record.type === 'Ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                         {record.type === 'Ingreso' ? '+' : '-'}${record.amount}
                       </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedProject && (
        <ProjectDetail 
          project={selectedProject}
          logs={selectedProjectLogs}
          onClose={() => setSelectedProjectId(null)}
          onAddLog={handleAddLog}
          onUpdateLog={handleUpdateLog}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
        />
      )}
    </div>
  );
};

export default App;
