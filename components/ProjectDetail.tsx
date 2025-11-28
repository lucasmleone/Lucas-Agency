import React, { useState, useEffect } from 'react';
import {
    X,
    Sparkles,
    Send,
    Lock,
    CheckCircle,
    Briefcase,
    Settings,
    FileText,
    Edit3,
    Save,
    Mail,
    Copy,
    DollarSign,
    Shield
} from 'lucide-react';
import { apiService } from '../services/apiService';
import NotesBoard from './Notes/NotesBoard';
import { PortalAdmin } from './PortalAdmin';
import { MaintenanceView } from './MaintenanceView';
import { Toast } from './Toast';
import { usePricingConfig } from '../hooks/usePricingConfig';
import { Project, ProjectStatus, PlanType, ProjectLog, Client, PaymentStatus, FinanceRecord } from '../types';
import { getBasePriceForPlan, calculateFinalPrice, getPlanDisplayName, formatCurrency } from '../utils/pricing';

// Helper to format date from YYYY-MM-DD without timezone conversion
const formatDateForDisplay = (dateStr: string, locale: string = 'es-AR'): string => {
    if (!dateStr) return 'Sin fecha';

    try {
        // Handle ISO strings (e.g. 2025-11-29T00:00:00.000Z) by taking only the date part
        const cleanDateStr = dateStr.split('T')[0];

        // Parse the date parts directly to avoid timezone issues
        const [year, month, day] = cleanDateStr.split('-').map(Number);

        // Validate parts
        if (!year || !month || !day) {
            // Fallback for other formats
            return new Date(dateStr).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Create date at local midnight (not UTC)
        const date = new Date(year, month - 1, day);

        // Check if valid
        if (isNaN(date.getTime())) return 'Fecha inválida';

        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        console.error('Error formatting date:', dateStr, e);
        return 'Error fecha';
    }
};

const getEmailTemplate = (type: 'PROPOSAL' | 'REVIEW', project: Project) => {
    const subject = type === 'PROPOSAL'
        ? `Propuesta de Proyecto - ${project.clientName} (${project.planType})`
        : `Revisión de Avances - ${project.clientName}`;

    let body = '';

    if (type === 'PROPOSAL') {
        const price = project.finalPrice ? `$${project.finalPrice.toLocaleString()}` : 'A cotizar';

        body = `Hola,

Adjunto encontrarás la propuesta detallada para el proyecto de ${project.clientName}.

---
PRESUPUESTO ESTIMADO
Plan Seleccionado: ${project.planType}
Inversión Total: ${price}

DETALLE DE SERVICIOS INCLUIDOS
Para garantizar un resultado profesional y de alto impacto, el servicio incluye:
- Desarrollo Web Optimizado: Código limpio enfocado en velocidad de carga y posicionamiento en buscadores (SEO Técnico).
- Diseño Responsivo: Visualización perfecta en celulares, tablets y computadoras.
- Funcionalidades Clave: Integración con WhatsApp, formularios de contacto y mapas interactivos.
- Seguridad y Soporte: Configuración de certificado SSL (candado seguro) y 2 meses de mantenimiento técnico bonificado.

---
TÉRMINOS Y CONDICIONES DEL SERVICIO

1. Alcance y Exclusiones
Este presupuesto cubre el desarrollo web y la optimización básica para buscadores (SEO).
Exclusiones: NO incluye diseño de identidad corporativa (creación de logotipos, manuales de marca) ni servicios de fotografía. El Cliente deberá proporcionar estos activos en la calidad adecuada.

2. Plazos de Ejecución
El tiempo estimado para la entrega de la Primera Revisión (Borrador Funcional) es de 4 semanas.
Inicio del cómputo: Este plazo comenzará a contar únicamente cuando se cumplan dos condiciones:
- Recepción del comprobante de pago del anticipo (50%).
- Entrega del 100% de la información base solicitada (Briefing).

3. Entrega de Contenidos (Textos)
El Cliente es responsable de entregar los textos finales antes del inicio.
Retrasos: Si el Cliente se demora en la entrega, podrá solicitar al Desarrollador el uso de textos provisionales (genéricos o IA) para no detener el avance visual. La revisión y corrección final de estos textos será responsabilidad del Cliente durante las rondas de revisión.

4. Vigencia del Proyecto (Inactividad)
Para garantizar el flujo de trabajo, el proyecto tiene una vigencia activa de 30 días tras cada entrega o solicitud de feedback por parte del Desarrollador.
Stand-by: Si el Cliente no responde en este periodo, el proyecto pasará a estado "Inactivo" y saldrá de la agenda de producción. Su reactivación dependerá exclusivamente de la disponibilidad futura del Desarrollador.

5. Forma de Pago y Propiedad
- Anticipo: 50% a la firma para reservar fecha y comenzar.
- Saldo Final: 50% restante contra la aprobación del sitio, antes de la publicación en el dominio final o entrega de credenciales.
Propiedad Intelectual: Los derechos de uso y acceso administrativo al sitio web permanecen como propiedad del Desarrollador hasta la liquidación total de la factura.

6. Validez del Presupuesto
Esta cotización tiene una validez de 30 días naturales desde su fecha de emisión. Pasado este plazo, los precios y condiciones podrán ser modificados.

---
ACEPTACIÓN AUTOMÁTICA
Para aceptar esta propuesta, hacé click en el siguiente enlace:
👉 ${window.location.origin}/accept-proposal/${project.id}

---

¿Tenés dudas? Respondé este email y te las aclaramos.

Saludos,
Lucas Agency
`;
    } else {
        body = `Hola,

Te invito a revisar los avances del proyecto de ${project.clientName}.

Puedes verlos aquí: ${project.devUrl || '[URL pendiente]'}

Espero tu feedback.

Saludos,`;
    }

    return { subject, body };
};

interface ProjectDetailProps {
    project: Project;
    client?: Client;
    logs: ProjectLog[];
    onClose: () => void;
    onAddLog: (text: string) => void;
    onUpdateLog: (logId: string, text: string) => void;
    onUpdateProject: (updated: Partial<Project>) => Promise<void>;
    onDeleteProject: (id: string) => void;
    finances: FinanceRecord[];
    onAddFinance: (finance: Omit<FinanceRecord, 'id'>) => Promise<void>;
    onRefreshData?: () => Promise<void>; // NEW: Refresh all data from DB
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
    project: initialProject,
    client,
    logs,
    onClose,
    onAddLog,
    onUpdateLog,
    onUpdateProject,
    onDeleteProject,
    finances,
    onAddFinance,
    onRefreshData
}) => {
    // ... other hooks

    const { config: pricingConfig } = usePricingConfig();

    const [activeTab, setActiveTab] = useState<'workflow' | 'data' | 'logs' | 'finance' | 'maintenance' | 'notes' | 'portal'>('workflow');
    const [status, setStatus] = useState(project.status);
    const [discoveryData, setDiscoveryData] = useState(project.discoveryData || {
        buyerPersona: '', competitors: '', references: '', materialStatus: '', currentUrl: '', objective: '', materials: ''
    });
    const [checklists, setChecklists] = useState(project.checklists || {
        depositPaid: false, infoReceived: false, fillerAccepted: false, finalPaymentPaid: false
    });
    const [generalData, setGeneralData] = useState({
        planType: project.planType,
        deadline: project.deadline,
        paymentStatus: project.paymentStatus,
        devUrl: project.devUrl || '',
        maintenanceStatus: project.maintenanceStatus,
        description: project.description || ''
    });

    // Pricing state
    const [pricingData, setPricingData] = useState({
        basePrice: getBasePriceForPlan(project.planType, pricingConfig || undefined), // Always use current plan price
        customPrice: project.customPrice || 0,
        discount: project.discount || 0,
        discountType: project.discountType || 'percentage' as 'percentage' | 'fixed',
        pricingNotes: project.pricingNotes || ''
    });

    // Update base price when plan type changes OR when config loads
    useEffect(() => {
        if (pricingConfig) {
            const newBasePrice = getBasePriceForPlan(generalData.planType, pricingConfig);
            // Only update if it's different to avoid loops, and prioritize config over old saved value
            setPricingData(prev => ({ ...prev, basePrice: newBasePrice }));
        }
    }, [generalData.planType, pricingConfig]);

    // ... rest of component

    const [newComment, setNewComment] = useState('');
    const [deleteStage, setDeleteStage] = useState(0);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [showToast, setShowToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    // Helper to safely update project while preserving critical fields
    const safeUpdateProject = (updates: Partial<Project>) => {
        const mergedUpdates = {
            ...updates,
            // CRITICAL: Always preserve portal fields
            portalToken: updates.portalToken ?? project.portalToken,
            portalPin: updates.portalPin ?? project.portalPin,
            portalEnabled: updates.portalEnabled ?? project.portalEnabled
        };

        console.log('[ProjectDetail] safeUpdateProject - input:', updates);
        console.log('[ProjectDetail] safeUpdateProject - merged:', mergedUpdates);
        console.log('[ProjectDetail] safeUpdateProject - current project portal data:', {
            portalToken: project.portalToken,
            portalPin: project.portalPin,
            portalEnabled: project.portalEnabled
        });

        onUpdateProject(mergedUpdates);
    };

    const handleStatusChange = (newStatus: ProjectStatus) => {
        setStatus(newStatus);
        safeUpdateProject({ status: newStatus });
        onAddLog(`Estado cambiado manualmente a: ${newStatus}`);
    };

    const handleSaveData = () => {
        // Calculate final price
        const finalPrice = calculateFinalPrice(
            pricingData.basePrice,
            pricingData.customPrice > 0 ? pricingData.customPrice : undefined,
            pricingData.discount,
            pricingData.discountType
        );

        onUpdateProject({
            ...generalData,
            discoveryData,
            checklists,
            status,
            // Add pricing fields
            basePrice: pricingData.basePrice,
            customPrice: pricingData.customPrice > 0 ? pricingData.customPrice : undefined,
            discount: pricingData.discount > 0 ? pricingData.discount : undefined,
            discountType: pricingData.discount > 0 ? pricingData.discountType : undefined,
            finalPrice: finalPrice,
            pricingNotes: pricingData.pricingNotes || undefined,
            // Ensure portal data is preserved
            portalToken: project.portalToken,
            portalPin: project.portalPin,
            portalEnabled: project.portalEnabled
        });
        onAddLog('Datos del proyecto actualizados (Edición Manual).');
        setShowToast({ show: true, message: 'Cambios guardados correctamente.', type: 'success' });
    };

    const handleStageChange = (newStage: ProjectStatus) => {
        setStatus(newStage);
        // CRITICAL: Include portal fields to prevent them from being lost
        onUpdateProject({
            status: newStage,
            portalToken: project.portalToken,
            portalPin: project.portalPin,
            portalEnabled: project.portalEnabled
        });
        onAddLog(`Estado cambiado a: ${newStage}`);
    };

    const handleChecklistChange = (key: keyof typeof checklists) => {
        const newCheck = { ...checklists, [key]: !checklists[key] };
        setChecklists(newCheck);
        safeUpdateProject({ checklists: newCheck });
    };

    const handleDeadlineChange = (newDeadline: string) => {
        // Update local state
        setGeneralData({ ...generalData, deadline: newDeadline });

        // Auto-save to backend immediately
        safeUpdateProject({ deadline: newDeadline });
        onAddLog(`Fecha de entrega actualizada: ${formatDateForDisplay(newDeadline)}`);
    };

    const copyToClipboard = async (text: string) => {
        try {
            // Try modern Clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                setShowToast({ show: true, message: 'Copiado al portapapeles', type: 'success' });
                return true;
            }

            // Fallback method for older browsers or insecure contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    setShowToast({ show: true, message: 'Copiado al portapapeles', type: 'success' });
                    return true;
                } else {
                    throw new Error('execCommand failed');
                }
            } catch (err) {
                document.body.removeChild(textArea);
                throw err;
            }
        } catch (err) {
            console.error('Error al copiar al portapapeles:', err);
            setShowToast({
                show: true,
                message: 'Error al copiar. Por favor, copia manualmente.',
                type: 'error'
            });
            return false;
        }
    };

    const handleCopyEmail = async (type: 'PROPOSAL' | 'REVIEW') => {
        // Use project ID directly - simpler and more reliable
        const currentProject = project;

        const template = getEmailTemplate(type, currentProject);
        const email = client?.email || '';

        // Copy body to clipboard with error handling
        try {
            // Try modern Clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(template.body);
            } else {
                // Fallback method
                const textArea = document.createElement('textarea');
                textArea.value = template.body;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (!successful) {
                    throw new Error('Fallback copy failed');
                }
            }

            // Show success toast
            setShowToast({
                show: true,
                message: `Email de ${type === 'PROPOSAL' ? 'propuesta' : 'revisión'} copiado al portapapeles`,
                type: 'success'
            });

            onAddLog(`Copiado borrador de email (${type}) para ${email}`);
        } catch (err) {
            console.error('Error al copiar email:', err);
            setShowToast({
                show: true,
                message: 'Error al copiar. Intenta de nuevo o copia manualmente.',
                type: 'error'
            });
        }
    };

    const TechnicalSheet = () => (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs space-y-3 h-fit">
            <h4 className="font-bold text-gray-900 flex items-center"><FileText className="w-3 h-3 mr-2" /> FICHA TÉCNICA</h4>
            <div><span className="font-bold text-gray-600 block">Objetivo:</span> {discoveryData.objective || '-'}</div>
            <div><span className="font-bold text-gray-600 block">Buyer Persona:</span> {discoveryData.buyerPersona || '-'}</div>
            <div><span className="font-bold text-gray-600 block">Competencia:</span> {discoveryData.competitors || '-'}</div>
            <div><span className="font-bold text-gray-600 block">Referencias:</span> {discoveryData.references || '-'}</div>
            <div><span className="font-bold text-gray-600 block">Materiales (Estado):</span> {discoveryData.materialStatus || '-'}</div>
            <div><span className="font-bold text-gray-600 block">Materiales a Solicitar:</span> {discoveryData.materials || '-'}</div>
            <div><span className="font-bold text-gray-600 block">Otros Comentarios:</span> {discoveryData.otherComments || '-'}</div>
            <div className="pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-600 block mb-1">URL Desarrollo:</span>
                <a href={generalData.devUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline truncate block">{generalData.devUrl || 'No asignada'}</a>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-6">
            {showToast.show && (
                <Toast
                    type={showToast.type as any}
                    message={showToast.message}
                    onCancel={() => setShowToast({ ...showToast, show: false })}
                    onConfirm={() => setShowToast({ ...showToast, show: false })}
                />
            )}
            <div className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white rounded-t-xl sm:rounded-xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-7xl h-[95vh] flex flex-col">

                {/* Header */}
                <div className="bg-gray-900 px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                {project.clientName}
                            </h3>
                            <p className="text-gray-400 text-xs mt-1">
                                {generalData.planType} | {generalData.deadline ? formatDateForDisplay(generalData.deadline) : 'Sin fecha'}
                            </p>
                        </div>
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold py-2.5 px-4 rounded-lg border-none cursor-pointer hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-300 shadow-lg transition-all"
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
                    {['data', 'logs', 'finance', 'notes'].map((tabKey) => {
                        let label = '';
                        let icon = null;
                        switch (tabKey) {
                            case 'data':
                                label = 'Datos y Edición';
                                icon = <Settings className="w-4 h-4 mr-2" />;
                                break;
                            case 'logs':
                                label = 'Bitácora';
                                break;
                            case 'finance':
                                label = 'Finanzas';
                                break;
                            case 'notes':
                                label = 'Notas';
                                break;
                            default:
                                label = tabKey;
                        }

                        return (
                            <button
                                key={tabKey}
                                onClick={() => setActiveTab(tabKey)}
                                className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-t-lg ${activeTab === tabKey ? 'bg-white text-gray-900 border-t border-x border-gray-200' : 'text-gray-500 hover:bg-gray-200'} ${icon ? 'flex items-center' : ''}`}
                            >
                                {icon} {label}
                            </button>
                        );
                    })}
                    {project.status === ProjectStatus.DELIVERED && (
                        <button onClick={() => setActiveTab('maintenance')} className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-t-lg flex items-center ${activeTab === 'maintenance' ? 'bg-white text-gray-900 border-t border-x border-gray-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                            <Settings className="w-4 h-4 mr-2" />
                            Mantenimiento
                        </button>
                    )}
                    {/* Show Portal tab only from Propuesta (stage 2) onwards */}
                    {project.status !== '1. Discovery' && (
                        <button onClick={() => setActiveTab('portal')} className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-t-lg flex items-center ${activeTab === 'portal' ? 'bg-white text-gray-900 border-t border-x border-gray-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                            <Shield className="w-4 h-4 mr-2" />
                            Portal Cliente
                        </button>
                    )}
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
                                                if (newText) onUpdateLog(log.id, newText);
                                            }} className="text-gray-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); if (newComment.trim()) { onAddLog(newComment); setNewComment(''); } }} className="flex gap-2">
                                <input className="flex-1 border rounded p-2" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Escribir nota..." />
                                <button className="bg-gray-900 text-white p-2 rounded"><Send className="w-4 h-4" /></button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Project Balance */}
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-800 uppercase">Saldo Restante (Proyecto)</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-black text-indigo-700">
                                            {formatCurrency((project.finalPrice || calculateFinalPrice(
                                                project.basePrice || getBasePriceForPlan(project.planType, pricingConfig),
                                                project.customPrice,
                                                project.discount,
                                                project.discountType
                                            )) - finances
                                                .filter(f => f.type === 'Ingreso' && !f.description.toLowerCase().includes('mantenimiento'))
                                                .reduce((acc, curr) => acc + Number(curr.amount), 0))}
                                        </p>
                                    </div>
                                    <div className="w-full bg-indigo-200 rounded-full h-1.5 mt-2">
                                        <div
                                            className="bg-indigo-600 h-1.5 rounded-full"
                                            style={{
                                                width: `${Math.min(100, (finances
                                                    .filter(f => f.type === 'Ingreso' && !f.description.toLowerCase().includes('mantenimiento'))
                                                    .reduce((acc, curr) => acc + Number(curr.amount), 0) / (project.finalPrice || calculateFinalPrice(
                                                        project.basePrice || getBasePriceForPlan(project.planType, pricingConfig),
                                                        project.customPrice,
                                                        project.discount,
                                                        project.discountType
                                                    ) || 1)) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Maintenance Stats */}
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <p className="text-xs font-bold text-green-800 uppercase">Total Mantenimiento</p>
                                    <p className="text-2xl font-black text-green-700">
                                        {formatCurrency(finances
                                            .filter(f => f.type === 'Ingreso' && f.description.toLowerCase().includes('mantenimiento'))
                                            .reduce((acc, curr) => acc + Number(curr.amount), 0))}
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">Ingresos por mantenimiento</p>
                                </div>

                                {/* Total Expenses */}
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <p className="text-xs font-bold text-red-800 uppercase">Total Gastos</p>
                                    <p className="text-2xl font-black text-red-700">
                                        {formatCurrency(finances.filter(f => f.type === 'Gasto').reduce((acc, curr) => acc + Number(curr.amount), 0))}
                                    </p>
                                    <p className="text-xs text-red-600 mt-1">Costos del proyecto</p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h4 className="text-lg font-bold text-gray-900 mb-4">Registrar Movimiento</h4>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const data = new FormData(form);
                                    onAddFinance({
                                        projectId: project.id,
                                        type: data.get('type') as 'Ingreso' | 'Gasto',
                                        amount: Number(data.get('amount')),
                                        description: data.get('description') as string,
                                        date: new Date().toISOString().split('T')[0]
                                    });
                                    form.reset();
                                }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Tipo</label>
                                        <select name="type" className="w-full border rounded p-2 text-sm">
                                            <option value="Ingreso">Ingreso (Cobro)</option>
                                            <option value="Gasto">Gasto (Costo)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
                                        <input name="description" required className="w-full border rounded p-2 text-sm" placeholder="Ej: Anticipo 50%" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Monto</label>
                                        <input name="amount" type="number" required className="w-full border rounded p-2 text-sm" placeholder="0.00" />
                                    </div>
                                    <div className="md:col-span-4 flex justify-end">
                                        <button className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-black">Registrar</button>
                                    </div>
                                </form>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-900">Historial</h4>
                                {finances.length === 0 ? (
                                    <p className="text-gray-400 text-sm italic">No hay movimientos registrados.</p>
                                ) : (
                                    finances.map(f => (
                                        <div key={f.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{f.description}</p>
                                                <p className="text-xs text-gray-500">{formatDateForDisplay(f.date)} - {f.type}</p>
                                            </div>
                                            <span className={`font-bold ${f.type === 'Ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                                {f.type === 'Ingreso' ? '+' : '-'}${f.amount}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
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
                                            onChange={(e) => setGeneralData({ ...generalData, planType: e.target.value as PlanType })}
                                            className="w-full border rounded p-2 text-sm"
                                        >
                                            {Object.values(PlanType).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                                        <input type="date" value={generalData.deadline} onChange={e => handleDeadlineChange(e.target.value)} className="w-full border rounded p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Pago</label>
                                        <select
                                            value={generalData.paymentStatus}
                                            onChange={(e) => setGeneralData({ ...generalData, paymentStatus: e.target.value as PaymentStatus })}
                                            className="w-full border rounded p-2 text-sm"
                                        >
                                            {Object.values(PaymentStatus).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 1.5: Pricing & Quotation */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-2 border-green-200 rounded-xl shadow-sm">
                                <h4 className="text-sm font-bold text-green-800 uppercase mb-4 pb-2 border-b border-green-300 flex items-center">
                                    <DollarSign className="w-4 h-4 mr-2" /> Cotización y Pricing
                                </h4>

                                <div className="space-y-5">
                                    {/* Base Price Info */}
                                    <div className="bg-white p-4 rounded-lg border border-green-200">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600 font-medium">Plan Base:</span>
                                                <p className="font-bold text-gray-900">{getPlanDisplayName(generalData.planType)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 font-medium">Precio Base:</span>
                                                <p className="font-bold text-gray-900 text-lg">{formatCurrency(pricingData.basePrice)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Price */}
                                    <div>
                                        <label className="flex items-center space-x-2 mb-2">
                                            <input
                                                type="checkbox"
                                                checked={pricingData.customPrice > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        // Set initial custom price to base price or 0
                                                        setPricingData({ ...pricingData, customPrice: pricingData.basePrice });
                                                    } else {
                                                        setPricingData({ ...pricingData, customPrice: 0 });
                                                    }
                                                }}
                                                className="rounded text-green-600"
                                            />
                                            <span className="text-sm font-bold text-gray-700">Precio Personalizado (Cotizado)</span>
                                        </label>
                                        {pricingData.customPrice > 0 || pricingData.basePrice === 0 ? (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-gray-600">$</span>
                                                <input
                                                    type="number"
                                                    value={pricingData.customPrice || ''}
                                                    onChange={(e) => setPricingData({ ...pricingData, customPrice: Number(e.target.value) || 0 })}
                                                    className="flex-1 border border-gray-300 rounded p-2 text-sm"
                                                    placeholder="Ingrese precio cotizado"
                                                    min="0"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 italic">Marque la casilla para establecer un precio personalizado</p>
                                        )}
                                    </div>

                                    {/* Discount */}
                                    <div>
                                        <label className="flex items-center space-x-2 mb-2">
                                            <input
                                                type="checkbox"
                                                checked={pricingData.discount > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        // Set initial discount value when checked
                                                        setPricingData({ ...pricingData, discount: 10 });
                                                    } else {
                                                        // Clear discount when unchecked
                                                        setPricingData({ ...pricingData, discount: 0 });
                                                    }
                                                }}
                                                className="rounded text-green-600"
                                            />
                                            <span className="text-sm font-bold text-gray-700">Aplicar Descuento</span>
                                        </label>
                                        {pricingData.discount > 0 ? (
                                            <div className="space-y-3">
                                                <div className="flex gap-4">
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            checked={pricingData.discountType === 'percentage'}
                                                            onChange={() => setPricingData({ ...pricingData, discountType: 'percentage' })}
                                                            className="text-green-600"
                                                        />
                                                        <span className="text-sm">Porcentaje (%)</span>
                                                    </label>
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            checked={pricingData.discountType === 'fixed'}
                                                            onChange={() => setPricingData({ ...pricingData, discountType: 'fixed' })}
                                                            className="text-green-600"
                                                        />
                                                        <span className="text-sm">Monto Fijo ($)</span>
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="number"
                                                        value={pricingData.discount}
                                                        onChange={(e) => setPricingData({ ...pricingData, discount: Number(e.target.value) || 0 })}
                                                        className="flex-1 border border-gray-300 rounded p-2 text-sm"
                                                        placeholder={pricingData.discountType === 'percentage' ? '10' : '50'}
                                                        min="0"
                                                        max={pricingData.discountType === 'percentage' ? 100 : undefined}
                                                    />
                                                    <span className="text-gray-600 font-bold">
                                                        {pricingData.discountType === 'percentage' ? '%' : '$'}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 italic">Marque la casilla para aplicar un descuento</p>
                                        )}
                                    </div>

                                    {/* Pricing Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas de Cotización</label>
                                        <textarea
                                            rows={2}
                                            value={pricingData.pricingNotes}
                                            onChange={(e) => setPricingData({ ...pricingData, pricingNotes: e.target.value })}
                                            className="w-full border border-gray-300 rounded p-2 text-sm"
                                            placeholder="Ej: Descuento por cliente frecuente, promoción especial, etc."
                                        />
                                    </div>

                                    {/* Final Price Display */}
                                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 rounded-xl text-white shadow-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-medium opacity-90 uppercase tracking-wide">Precio Final</p>
                                                <p className="text-3xl font-black mt-1">
                                                    {formatCurrency(calculateFinalPrice(
                                                        pricingData.basePrice,
                                                        pricingData.customPrice > 0 ? pricingData.customPrice : undefined,
                                                        pricingData.discount,
                                                        pricingData.discountType
                                                    ))}
                                                </p>
                                            </div>
                                            {(pricingData.discount > 0) && (
                                                <div className="text-right">
                                                    <p className="text-xs opacity-90">Ahorro</p>
                                                    <p className="text-lg font-bold">
                                                        -{formatCurrency(
                                                            (pricingData.customPrice > 0 ? pricingData.customPrice : pricingData.basePrice) -
                                                            calculateFinalPrice(
                                                                pricingData.basePrice,
                                                                pricingData.customPrice > 0 ? pricingData.customPrice : undefined,
                                                                pricingData.discount,
                                                                pricingData.discountType
                                                            )
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Discovery Data */}
                            <div className="bg-white p-6 border rounded-xl shadow-sm">
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 pb-2 border-b">Datos Discovery & Ficha Técnica</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo Principal</label>
                                        <input type="text" value={discoveryData.objective} onChange={e => setDiscoveryData({ ...discoveryData, objective: e.target.value })} className="w-full border rounded p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">URL Actual</label>
                                        <input type="text" value={discoveryData.currentUrl} onChange={e => setDiscoveryData({ ...discoveryData, currentUrl: e.target.value })} className="w-full border rounded p-2 text-sm" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Persona</label>
                                            <textarea rows={3} value={discoveryData.buyerPersona} onChange={e => setDiscoveryData({ ...discoveryData, buyerPersona: e.target.value })} className="w-full border rounded p-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Competencia</label>
                                            <textarea rows={3} value={discoveryData.competitors} onChange={e => setDiscoveryData({ ...discoveryData, competitors: e.target.value })} className="w-full border rounded p-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Referencias</label>
                                            <textarea rows={3} value={discoveryData.references} onChange={e => setDiscoveryData({ ...discoveryData, references: e.target.value })} className="w-full border rounded p-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Materiales</label>
                                            <textarea rows={3} value={discoveryData.materialStatus} onChange={e => setDiscoveryData({ ...discoveryData, materialStatus: e.target.value })} className="w-full border rounded p-2 text-sm" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Otros Comentarios</label>
                                            <textarea rows={3} value={discoveryData.otherComments || ''} onChange={e => setDiscoveryData({ ...discoveryData, otherComments: e.target.value })} className="w-full border rounded p-2 text-sm" placeholder="Cualquier otro detalle importante..." />
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
                                        <input type="text" value={generalData.devUrl} onChange={e => setGeneralData({ ...generalData, devUrl: e.target.value })} className="w-full border rounded p-2 text-sm" />
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded">
                                        <label className="block text-xs font-bold text-gray-500 mb-2">Override Checklists</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center space-x-2">
                                                <input type="checkbox" checked={checklists.depositPaid} onChange={() => handleChecklistChange('depositPaid')} className="rounded text-indigo-600" />
                                                <span className="text-sm">Anticipo Pagado</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input type="checkbox" checked={checklists.infoReceived} onChange={() => handleChecklistChange('infoReceived')} className="rounded text-indigo-600" />
                                                <span className="text-sm">Info Recibida</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input type="checkbox" checked={checklists.finalPaymentPaid} onChange={() => handleChecklistChange('finalPaymentPaid')} className="rounded text-indigo-600" />
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
                                {/* Blocking Banner */}
                                {project.blockedStatus && (
                                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-sm font-bold text-red-900 flex items-center">
                                                    <Lock className="w-4 h-4 mr-2" /> Proyecto Bloqueado - Esperando Cliente
                                                </h4>
                                                <p className="text-xs text-red-700 mt-1">Razón: {project.blockedReason}</p>
                                                <p className="text-xs text-red-600 mt-1">
                                                    Bloqueado desde: {new Date(project.blockedSince!).toLocaleDateString()}
                                                    ({Math.floor((Date.now() - new Date(project.blockedSince!).getTime()) / (1000 * 60 * 60 * 24))} días)
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    safeUpdateProject({ blockedStatus: false, blockedReason: undefined, blockedSince: undefined });
                                                    onAddLog('Proyecto desbloqueado.');
                                                }}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
                                            >
                                                Desbloquear
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Block Button */}
                                {!project.blockedStatus && (
                                    <button
                                        onClick={() => setShowBlockModal(true)}
                                        className="w-full bg-orange-100 border border-orange-300 text-orange-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-200 flex items-center justify-center"
                                    >
                                        <Lock className="w-4 h-4 mr-2" /> Bloquear Proyecto (Esperando Cliente)
                                    </button>
                                )}

                                {/* Block Modal */}
                                {showBlockModal && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                                        <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                                            <h3 className="text-lg font-bold mb-4">Bloquear Proyecto</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué estás esperando del cliente?</label>
                                                    <textarea
                                                        className="w-full border rounded p-2 text-sm"
                                                        rows={3}
                                                        value={blockReason}
                                                        onChange={e => setBlockReason(e.target.value)}
                                                        placeholder="Ej: Pago del anticipo, contenido, imágenes, etc."
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => { setShowBlockModal(false); setBlockReason(''); }}
                                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            safeUpdateProject({
                                                                blockedStatus: true,
                                                                blockedReason: blockReason,
                                                                blockedSince: new Date().toISOString()
                                                            });
                                                            onAddLog(`Proyecto bloqueado: ${blockReason}`);
                                                            setShowBlockModal(false);
                                                            setBlockReason('');
                                                        }}
                                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                                        disabled={!blockReason.trim()}
                                                    >
                                                        Bloquear
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {status === ProjectStatus.DISCOVERY && (
                                    <div className="bg-white border border-indigo-100 ring-1 ring-indigo-50 rounded-xl p-6 shadow-sm">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-indigo-600" /> 2. Discovery (Entrevista)</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Buyer Persona</label>
                                                <textarea className="w-full border-gray-300 rounded text-sm p-2" rows={2} value={discoveryData.buyerPersona} onChange={e => setDiscoveryData({ ...discoveryData, buyerPersona: e.target.value })} placeholder="¿Quién es su cliente ideal?" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Competencia (Top 3)</label>
                                                <textarea className="w-full border-gray-300 rounded text-sm p-2" rows={2} value={discoveryData.competitors} onChange={e => setDiscoveryData({ ...discoveryData, competitors: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Referencias Visuales</label>
                                                <textarea className="w-full border-gray-300 rounded text-sm p-2" rows={2} value={discoveryData.references} onChange={e => setDiscoveryData({ ...discoveryData, references: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Estado Materiales (Logo/Texto)</label>
                                                <input className="w-full border-gray-300 rounded text-sm p-2" value={discoveryData.materialStatus} onChange={e => setDiscoveryData({ ...discoveryData, materialStatus: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Materiales a Solicitar</label>
                                                <textarea className="w-full border-gray-300 rounded text-sm p-2" rows={3} value={discoveryData.materials || ''} onChange={e => setDiscoveryData({ ...discoveryData, materials: e.target.value })} placeholder="Lista de materiales necesarios..." />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Otros Comentarios</label>
                                                <textarea className="w-full border-gray-300 rounded text-sm p-2" rows={2} value={discoveryData.otherComments || ''} onChange={e => setDiscoveryData({ ...discoveryData, otherComments: e.target.value })} placeholder="Información adicional relevante..." />
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

                                {status === ProjectStatus.PROPOSAL && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2" /> 3. Propuesta y Contrato</h4>
                                        <p className="text-sm text-gray-600 mb-4">Envía la propuesta automática con los T&C.</p>

                                        <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Acciones de Envío</h5>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleCopyEmail('PROPOSAL')}
                                                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-indigo-700 flex items-center justify-center shadow-sm"
                                                >
                                                    <Copy className="w-4 h-4 mr-2" /> Copiar Propuesta (Portapapeles)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 pt-6">
                                            <button
                                                onClick={() => handleStageChange(ProjectStatus.WAITING_RESOURCES)}
                                                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-green-700 flex items-center justify-center shadow-md"
                                            >
                                                <CheckCircle className="w-5 h-5 mr-2" /> ✅ Cliente Aceptó (Manual)
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {status === ProjectStatus.WAITING_RESOURCES && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
                                        <h4 className="text-lg font-bold text-orange-900 mb-4 flex items-center"><Lock className="w-5 h-5 mr-2" /> 4. Espera de Recursos (Bloqueo)</h4>
                                        <div className="bg-white p-4 rounded-lg shadow-sm space-y-3 mb-6">
                                            <label className="flex items-center space-x-3">
                                                <input type="checkbox" checked={checklists.depositPaid} onChange={() => handleChecklistChange('depositPaid')} className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-gray-900">Anticipo 50% Recibido</span>
                                            </label>
                                            <label className="flex items-center space-x-3">
                                                <input type="checkbox" checked={checklists.infoReceived} onChange={() => handleChecklistChange('infoReceived')} className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-gray-900">Accesos/Archivos Recibidos</span>
                                            </label>
                                            <label className="flex items-center space-x-3">
                                                <input type="checkbox" checked={checklists.fillerAccepted} onChange={() => handleChecklistChange('fillerAccepted')} className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-gray-500">Modo Relleno Aceptado (Opcional)</span>
                                            </label>
                                        </div>

                                        <button
                                            disabled={!checklists.depositPaid || (!checklists.infoReceived && !checklists.fillerAccepted)}
                                            onClick={() => {
                                                safeUpdateProject({ paymentStatus: PaymentStatus.DEPOSIT_PAID });
                                                handleStageChange(ProjectStatus.PRODUCTION);
                                            }}
                                            className={`w-full px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center transition-colors ${(checklists.depositPaid && (checklists.infoReceived || checklists.fillerAccepted))
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {(checklists.depositPaid && (checklists.infoReceived || checklists.fillerAccepted)) ? 'Desbloquear & Iniciar Producción' : 'Completar Checklist para Avanzar'}
                                        </button>
                                    </div>
                                )}

                                {status === ProjectStatus.PRODUCTION && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-2" /> 5. Producción y Revisión</h4>

                                        <div className="mb-6">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">URL de Desarrollo (Staging)</label>
                                            <div className="flex gap-2">
                                                <input type="text" value={generalData.devUrl} onChange={e => setGeneralData({ ...generalData, devUrl: e.target.value })} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" placeholder="https://..." />
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

                                {status === ProjectStatus.DELIVERY && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm">
                                        <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> 6. Cierre y Entrega</h4>

                                        <div className="bg-white p-4 rounded-lg shadow-sm space-y-3 mb-6">
                                            <label className="flex items-center space-x-3">
                                                <input type="checkbox" checked={checklists.finalPaymentPaid} onChange={() => handleChecklistChange('finalPaymentPaid')} className="h-5 w-5 text-green-600 rounded focus:ring-green-500" />
                                                <span className="text-sm font-bold text-gray-900">Factura Final Pagada</span>
                                            </label>
                                        </div>

                                        {checklists.finalPaymentPaid ? (
                                            <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center">
                                                <p className="font-bold mb-2">¡Proyecto Liberado!</p>
                                                <p className="text-sm mb-4">Ya puedes entregar credenciales. El proyecto está en mantenimiento.</p>
                                                <button onClick={() => { safeUpdateProject({ paymentStatus: PaymentStatus.FULLY_PAID, status: ProjectStatus.DELIVERED }); onClose(); }} className="bg-green-700 text-white px-4 py-2 rounded text-sm font-bold">
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

                                {(status === ProjectStatus.CANCELLED || status === ProjectStatus.LOST) && (
                                    <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 shadow-sm text-center">
                                        <h4 className="text-lg font-bold text-gray-500 mb-4">Proyecto Archivado / Perdido</h4>
                                        <button onClick={() => handleStageChange(ProjectStatus.DISCOVERY)} className="text-indigo-600 text-sm font-bold underline">Reactivar (Volver a Discovery)</button>
                                    </div>
                                )}

                                {status !== ProjectStatus.DELIVERED && (
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <button
                                            onClick={() => { if (deleteStage === 0) setDeleteStage(1); else if (deleteStage === 1) setDeleteStage(2); else onDeleteProject(project.id); }}
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

                    {activeTab === 'maintenance' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <MaintenanceView project={project} />
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 min-h-[400px]">
                            <NotesBoard entityType="project" entityId={String(project.id)} />
                        </div>
                    )}

                    {activeTab === 'portal' && (
                        <PortalAdmin
                            project={project}
                            onRefresh={async (updates) => {
                                if (updates) {
                                    console.log('[ProjectDetail] onRefresh called with:', updates);
                                    // CRITICAL: Use safeUpdateProject to preserve portal fields
                                    safeUpdateProject(updates);
                                    // CRITICAL: Refresh all data from DB to sync React state
                                    if (onRefreshData) {
                                        console.log('[ProjectDetail] Calling onRefreshData to sync state...');
                                        await onRefreshData();
                                        console.log('[ProjectDetail] onRefreshData completed');
                                    }
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
