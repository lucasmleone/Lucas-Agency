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
    Shield,
    Plus,
    Trash2
} from 'lucide-react';
import { apiService } from '../services/apiService';
import NotesBoard from './Notes/NotesBoard';
import { PortalAdmin } from './PortalAdmin';
import { MaintenanceView } from './MaintenanceView';
import { Toast } from './Toast';
import { usePricingConfig } from '../hooks/usePricingConfig';
import { Project, ProjectStatus, PlanType, ProjectLog, Client, PaymentStatus, FinanceRecord, ProjectAddOn, AddOnTemplate } from '../types';
import { getBasePriceForPlan, calculateFinalPrice, calculateTotalWithAddOns, getPlanDisplayName, formatCurrency } from '../utils/pricing';
import { DeliveryProjection } from './DeliveryProjection';

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
    // Local state for project to track updates
    const [project, setProject] = useState(initialProject);

    // CRITICAL: Sync local state when parent refreshes data
    useEffect(() => {
        setProject(initialProject);
    }, [initialProject]);

    const { config: pricingConfig } = usePricingConfig();

    const [activeTab, setActiveTab] = useState<'workflow' | 'data' | 'pricing' | 'logs' | 'finance' | 'maintenance' | 'notes' | 'portal'>('workflow');
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

    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Pricing state
    const [pricingData, setPricingData] = useState({
        basePrice: getBasePriceForPlan(project.planType, pricingConfig || undefined), // Always use current plan price
        customPrice: project.customPrice || 0,
        discount: project.discount || 0,
        discountType: project.discountType || 'percentage' as 'percentage' | 'fixed',
        pricingNotes: project.pricingNotes || '',
        customHours: 0,
        hourlyRate: 25,
        isHourlyQuote: false,  // New flag for mutual exclusivity
        advancePercentage: project.advancePercentage || 50  // Advance payment percentage
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
    const safeUpdateProject = async (updates: Partial<Project>) => {
        const mergedUpdates = {
            ...updates,
            // CRITICAL: Always preserve portal fields
            portalToken: updates.portalToken ?? project.portalToken,
            portalPin: updates.portalPin ?? project.portalPin,
            portalEnabled: updates.portalEnabled ?? project.portalEnabled
        };

        await onUpdateProject(mergedUpdates);
    };

    const handleStatusChange = (newStatus: ProjectStatus) => {
        setStatus(newStatus);
        safeUpdateProject({ status: newStatus });
        onAddLog(`Estado cambiado manualmente a: ${newStatus}`);
    };

    // Add-ons State
    const [projectAddOns, setProjectAddOns] = useState<ProjectAddOn[]>([]);
    const [addOnTemplates, setAddOnTemplates] = useState<AddOnTemplate[]>([]);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', description: '', defaultPrice: 0 });

    useEffect(() => {
        if (project) {
            fetchProjectAddOns();
        }
    }, [project]);

    const fetchProjectAddOns = async () => {
        if (!project) return;
        try {
            const res = await apiService.getProjectAddOns(project.id);
            setProjectAddOns(res);
        } catch (error) {
            console.error('Error fetching add-ons:', error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await apiService.getTemplates();
            setAddOnTemplates(res);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleAddAddOn = async (template: AddOnTemplate) => {
        if (!project) return;
        try {
            await apiService.addProjectAddOn(project.id, {
                name: template.name,
                description: template.description,
                price: template.default_price
            });
            fetchProjectAddOns();
            setToast({ type: 'success', message: 'Añadido agregado' });
            setIsLibraryOpen(false);
        } catch (error) {
            console.error('Error adding add-on:', error);
            setToast({ type: 'error', message: 'Error al agregar' });
        }
    };

    const handleRemoveAddOn = async (addonId: number) => {
        if (!project) return;
        try {
            await apiService.removeProjectAddOn(project.id, addonId);
            fetchProjectAddOns();
            setToast({ type: 'success', message: 'Añadido eliminado' });
        } catch (error) {
            console.error('Error removing add-on:', error);
        }
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiService.createTemplate({
                name: newTemplate.name,
                description: newTemplate.description,
                defaultPrice: newTemplate.defaultPrice
            });
            setNewTemplate({ name: '', description: '', defaultPrice: 0 });
            fetchTemplates();
            setToast({ type: 'success', message: 'Plantilla creada' });
        } catch (error) {
            console.error('Error creating template:', error);
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!confirm('¿Eliminar esta plantilla?')) return;
        try {
            await apiService.deleteTemplate(id);
            fetchTemplates();
            setToast({ type: 'success', message: 'Plantilla eliminada' });
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    // Calculate total add-ons price
    const addOnsTotal = projectAddOns.reduce((sum, item) => sum + Number(item.price), 0);

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
            advancePercentage: pricingData.advancePercentage,
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

    // Smart Start: Trigger when starting production
    const handleStartProduction = async () => {
        try {
            // First update payment status
            await safeUpdateProject({ paymentStatus: PaymentStatus.DEPOSIT_PAID });

            // Call Smart Start API to handle date logic and block generation
            const response = await fetch(`/api/capacity/smart-start/${project.id}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                onAddLog(`Smart Start activado (Escenario ${result.scenario}): ${result.message}`);

                // Update local state with confirmed date
                if (result.confirmedDate) {
                    setGeneralData(prev => ({ ...prev, deadline: result.confirmedDate }));
                }
            }

            // Change stage to production
            handleStageChange(ProjectStatus.PRODUCTION);

        } catch (error) {
            console.error('Error in smart start:', error);
            // Still proceed with stage change even if smart start fails
            handleStageChange(ProjectStatus.PRODUCTION);
        }
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
                <div className="bg-gray-900 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="flex justify-between items-start w-full sm:w-auto">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                    {project.clientName}
                                </h3>
                                <p className="text-gray-400 text-xs mt-1">
                                    {generalData.planType} | {generalData.deadline ? formatDateForDisplay(generalData.deadline) : 'Sin fecha'}
                                </p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-white sm:hidden"><X className="h-6 w-6" /></button>
                        </div>
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold py-2.5 px-4 rounded-lg border-none cursor-pointer hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-300 shadow-lg transition-all"
                        >
                            {Object.values(ProjectStatus).map(s => (
                                <option key={s} value={s} className="text-gray-900 bg-white">{s}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white hidden sm:block"><X className="h-6 w-6" /></button>
                </div>

                {/* Tabs */}
                <div className="bg-gray-100 px-6 py-2 flex gap-2 overflow-x-auto border-b border-gray-200 shrink-0">
                    <button onClick={() => setActiveTab('workflow')} className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-t-lg ${activeTab === 'workflow' ? 'bg-white text-gray-900 border-t border-x border-gray-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                        Flujo de Trabajo
                    </button>
                    {['data', 'pricing', 'logs', 'finance', 'notes'].map((tabKey) => {
                        let label = '';
                        let icon = null;
                        switch (tabKey) {
                            case 'data':
                                label = 'Datos y Edición';
                                icon = <Settings className="w-4 h-4 mr-2" />;
                                break;
                            case 'pricing':
                                label = 'Cotización';
                                icon = <DollarSign className="w-4 h-4 mr-2" />;
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
                <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-6">
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
                                            {formatCurrency((() => {
                                                const total = project.isHourlyQuote
                                                    ? ((project.customHours || 0) * (project.hourlyRate || 0)) - (project.discount > 0
                                                        ? (project.discountType === 'percentage'
                                                            ? ((project.customHours || 0) * (project.hourlyRate || 0) * project.discount / 100)
                                                            : project.discount)
                                                        : 0)
                                                    : calculateTotalWithAddOns(
                                                        project.basePrice || getBasePriceForPlan(project.planType, pricingConfig),
                                                        addOnsTotal,
                                                        project.customPrice,
                                                        project.discount,
                                                        project.discountType
                                                    );
                                                const paid = finances
                                                    .filter(f => f.type === 'Ingreso' && !f.description.toLowerCase().includes('mantenimiento'))
                                                    .reduce((acc, curr) => acc + Number(curr.amount), 0);
                                                return Math.max(0, total - paid);
                                            })())}
                                        </p>
                                    </div>
                                    <div className="w-full bg-indigo-200 rounded-full h-1.5 mt-2">
                                        <div
                                            className="bg-indigo-600 h-1.5 rounded-full"
                                            style={{
                                                width: `${(() => {
                                                    const total = project.isHourlyQuote
                                                        ? ((project.customHours || 0) * (project.hourlyRate || 0)) - (project.discount > 0
                                                            ? (project.discountType === 'percentage'
                                                                ? ((project.customHours || 0) * (project.hourlyRate || 0) * project.discount / 100)
                                                                : project.discount)
                                                            : 0)
                                                        : calculateTotalWithAddOns(
                                                            project.basePrice || getBasePriceForPlan(project.planType, pricingConfig),
                                                            addOnsTotal,
                                                            project.customPrice,
                                                            project.discount,
                                                            project.discountType
                                                        );
                                                    const paid = finances
                                                        .filter(f => f.type === 'Ingreso' && !f.description.toLowerCase().includes('mantenimiento'))
                                                        .reduce((acc, curr) => acc + Number(curr.amount), 0);
                                                    return Math.min(100, (paid / (total || 1)) * 100);
                                                })()}%`
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

                            {/* Floating Save Button for Data Tab */}
                            <div className="fixed bottom-8 right-8 z-50">
                                <button
                                    onClick={handleSaveData}
                                    className="bg-gray-900 text-white pl-6 pr-5 py-4 rounded-full shadow-2xl hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 font-bold text-base"
                                >
                                    <span>Guardar</span>
                                    <Save size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pricing' && (
                        <div className="h-full flex flex-col overflow-hidden">
                            {/* Two Column Layout */}
                            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                                {/* Left Column: Configuration */}
                                <div className="flex-1 space-y-8 overflow-y-auto pr-2 pb-20">


                                    {/* 1. Base Product Selection */}
                                    <section>
                                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                                            Producto Base
                                        </h4>

                                        {/* Radio Button Selection: Plan vs Hourly */}
                                        <div className="space-y-4 mb-6">
                                            {/* Option A: Standard Plan */}
                                            <div className="border-2 rounded-xl p-4"
                                                style={{ borderColor: !pricingData.isHourlyQuote ? '#10b981' : '#e5e7eb' }}>
                                                <label className="flex items-start cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="productType"
                                                        checked={!pricingData.isHourlyQuote}
                                                        onChange={() => {
                                                            setPricingData({ ...pricingData, isHourlyQuote: false, basePrice: 200, customHours: 0 });
                                                            setGeneralData({ ...generalData, planType: PlanType.LANDING });
                                                        }}
                                                        className="mt-1 mr-3"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="font-bold text-gray-900 text-base">Plan Estándar</span>
                                                        <p className="text-sm text-gray-500 mt-1">Selecciona un plan predefinido y agrega módulos adicionales</p>
                                                    </div>
                                                </label>
                                            </div>

                                            {/* Option B: Hourly Quote */}
                                            <div className="border-2 rounded-xl p-4"
                                                style={{ borderColor: pricingData.isHourlyQuote ? '#10b981' : '#e5e7eb' }}>
                                                <label className="flex items-start cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="productType"
                                                        checked={pricingData.isHourlyQuote}
                                                        onChange={() => {
                                                            setPricingData({ ...pricingData, isHourlyQuote: true, basePrice: 0 });
                                                            setGeneralData({ ...generalData, planType: PlanType.CUSTOM });
                                                        }}
                                                        className="mt-1 mr-3"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="font-bold text-gray-900 text-base">Cotización por Horas</span>
                                                        <p className="text-sm text-gray-500 mt-1">Para proyectos personalizados fuera del alcance estándar</p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Show Plan Cards if Standard Plan is selected */}
                                        {!pricingData.isHourlyQuote && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Landing Page Card */}
                                                <div
                                                    onClick={() => {
                                                        setGeneralData({ ...generalData, planType: PlanType.LANDING });
                                                        setPricingData({ ...pricingData, basePrice: 200 });
                                                    }}
                                                    className={`cursor-pointer border-2 rounded-xl p-6 transition-all relative ${generalData.planType === PlanType.LANDING ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-gray-900 text-lg">Landing Page</span>
                                                        {generalData.planType === PlanType.LANDING && <CheckCircle className="text-indigo-600 w-6 h-6" />}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-4">One Page. Ideal para campañas y conversión rápida.</p>
                                                    <p className="text-3xl font-black text-gray-900">$200 <span className="text-sm font-normal text-gray-500">USD</span></p>
                                                </div>

                                                {/* Corporate Web Card */}
                                                <div
                                                    onClick={() => {
                                                        setGeneralData({ ...generalData, planType: PlanType.CORPORATE });
                                                        setPricingData({ ...pricingData, basePrice: 350 });
                                                    }}
                                                    className={`cursor-pointer border-2 rounded-xl p-6 transition-all relative ${generalData.planType === PlanType.CORPORATE ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-gray-900 text-lg">Web Corporativa</span>
                                                        {generalData.planType === PlanType.CORPORATE && <CheckCircle className="text-indigo-600 w-6 h-6" />}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-4">Multi-page. Sitio completo institucional.</p>
                                                    <p className="text-3xl font-black text-gray-900">$350 <span className="text-sm font-normal text-gray-500">USD</span></p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Show Hourly Input if Hourly Quote is selected */}
                                        {pricingData.isHourlyQuote && (
                                            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <label className="text-sm text-gray-900 font-bold block">Horas Estimadas</label>
                                                            <span className="text-xs text-gray-500">Total de horas de desarrollo</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={pricingData.customHours || 0}
                                                            onChange={(e) => setPricingData({ ...pricingData, customHours: Number(e.target.value) })}
                                                            className="border border-gray-300 rounded-lg p-2 w-24 text-right font-medium"
                                                            placeholder="0"
                                                            min="0"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <label className="text-sm text-gray-900 font-bold block">Tarifa por Hora</label>
                                                            <span className="text-xs text-gray-500">USD por hora</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-gray-500 font-bold">$</span>
                                                            <input
                                                                type="number"
                                                                value={pricingData.hourlyRate || 25}
                                                                onChange={(e) => setPricingData({ ...pricingData, hourlyRate: Number(e.target.value) })}
                                                                className="border border-gray-300 rounded-lg p-2 w-24 text-right font-medium"
                                                                placeholder="25"
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    {(pricingData.customHours || 0) > 0 && (
                                                        <div className="pt-4 border-t border-purple-300 flex justify-between items-center">
                                                            <span className="text-sm font-bold text-purple-900">Subtotal por Horas</span>
                                                            <span className="text-2xl font-black text-purple-700">
                                                                {formatCurrency((pricingData.customHours || 0) * (pricingData.hourlyRate || 25))}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </section>


                                    {/* 2. Add-ons Modules - Only show if NOT hourly quote */}
                                    {!pricingData.isHourlyQuote && (
                                        <section>
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                                    <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                                                    Módulos Adicionales (Add-ons)
                                                </h4>
                                                <button onClick={() => { setIsLibraryOpen(true); fetchTemplates(); }} className="text-sm text-indigo-600 font-bold hover:underline flex items-center">
                                                    <Settings className="w-4 h-4 mr-1" /> Gestionar Librería
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {/* Render existing project add-ons with active state */}
                                                {projectAddOns.map(addon => (
                                                    <div key={addon.id} className="border-2 border-purple-500 bg-purple-50 rounded-xl p-4 flex justify-between items-center transition-all shadow-sm">
                                                        <div>
                                                            <p className="font-bold text-gray-900">{addon.name}</p>
                                                            <p className="text-xs font-bold text-purple-700">{formatCurrency(addon.price)}</p>
                                                        </div>
                                                        <button onClick={() => handleRemoveAddOn(addon.id)} className="text-white bg-purple-600 hover:bg-purple-700 p-1.5 rounded-full transition-colors">
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Render suggested templates that are NOT added yet */}
                                                {addOnTemplates.filter(t => !projectAddOns.some(pa => pa.name === t.name)).map(template => (
                                                    <div key={template.id}
                                                        onClick={() => handleAddAddOn(template)}
                                                        className="cursor-pointer border border-gray-200 bg-white rounded-xl p-4 flex justify-between items-center hover:border-purple-300 hover:shadow-md transition-all group"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-gray-700 group-hover:text-purple-700">{template.name}</p>
                                                            <p className="text-xs text-gray-500 group-hover:text-purple-600">+{formatCurrency(template.default_price)}</p>
                                                        </div>
                                                        <div className="text-gray-300 group-hover:text-purple-500 bg-gray-50 group-hover:bg-purple-50 p-1.5 rounded-full">
                                                            <Plus className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Empty state if no templates */}
                                                {addOnTemplates.length === 0 && (
                                                    <div className="col-span-2 text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                                        <p className="text-gray-500 mb-2">No hay plantillas disponibles.</p>
                                                        <button onClick={() => { setIsLibraryOpen(true); fetchTemplates(); }} className="text-indigo-600 font-bold text-sm">
                                                            Cargar plantillas base
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    )}

                                    {/* 3. Custom Adjustments */}
                                    <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                        <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Ajustes Finales</h4>
                                        <div className="space-y-4">
                                            {/* Custom Price Override */}
                                            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                                <div>
                                                    <label className="text-sm text-gray-900 font-bold block">Precio Personalizado</label>
                                                    <span className="text-xs text-gray-500">Sobreescribe el precio base</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {pricingData.customPrice > 0 && (
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                            <input
                                                                type="number"
                                                                value={pricingData.customPrice}
                                                                onChange={(e) => setPricingData({ ...pricingData, customPrice: Number(e.target.value) })}
                                                                className="border-2 border-green-500 rounded-lg py-1.5 pl-6 pr-2 w-28 text-right font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-200"
                                                            />
                                                        </div>
                                                    )}
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={pricingData.customPrice > 0}
                                                            onChange={(e) => setPricingData({ ...pricingData, customPrice: e.target.checked ? pricingData.basePrice : 0 })}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Discount */}
                                            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                                <div>
                                                    <label className="text-sm text-gray-900 font-bold block">Descuento</label>
                                                    <span className="text-xs text-gray-500">Aplicar reducción al total</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={pricingData.discount}
                                                        onChange={(e) => setPricingData({ ...pricingData, discount: Number(e.target.value) })}
                                                        className="border border-gray-300 rounded-lg p-1.5 w-20 text-right font-medium"
                                                        placeholder="0"
                                                    />
                                                    <select
                                                        value={pricingData.discountType}
                                                        onChange={(e) => setPricingData({ ...pricingData, discountType: e.target.value as any })}
                                                        className="border border-gray-300 rounded-lg p-1.5 text-sm bg-gray-50"
                                                    >
                                                        <option value="percentage">%</option>
                                                        <option value="fixed">$</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Advance Payment Percentage */}
                                            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                <div>
                                                    <label className="text-sm text-gray-900 font-bold block">Anticipo Requerido</label>
                                                    <span className="text-xs text-gray-600">Porcentaje a pagar por adelantado</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={pricingData.advancePercentage}
                                                        onChange={(e) => setPricingData({ ...pricingData, advancePercentage: Number(e.target.value) })}
                                                        className="border border-gray-300 rounded-lg p-1.5 w-20 text-right font-medium"
                                                        placeholder="50"
                                                    />
                                                    <span className="text-gray-600 font-medium">%</span>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas Internas</label>
                                                <textarea
                                                    rows={2}
                                                    value={pricingData.pricingNotes}
                                                    onChange={(e) => setPricingData({ ...pricingData, pricingNotes: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                    placeholder="Detalles sobre el precio..."
                                                />
                                            </div>

                                            {/* Free Benefits Section */}
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mt-4">
                                                <h3 className="text-base font-bold text-green-900 mb-3 flex items-center">
                                                    <Sparkles className="w-5 h-5 mr-2 text-green-600" />
                                                    Beneficios Incluidos
                                                </h3>
                                                <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-bold text-gray-900 mb-1">Mantenimiento Técnico Bonificado</p>
                                                            <p className="text-sm text-gray-600">2 meses de soporte y actualizaciones sin costo adicional</p>
                                                        </div>
                                                        <div className="bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-md ml-3">
                                                            GRATIS
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Sticky Summary */}
                                <div className="w-full md:w-80 shrink-0 pb-20 md:pb-0">
                                    <div className="sticky top-6 bg-gray-900 text-white rounded-xl shadow-2xl p-6 flex flex-col h-fit border border-gray-800">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                                            <Sparkles className="text-yellow-400 w-5 h-5" />
                                            Resumen
                                        </h3>

                                        <div className="space-y-3 flex-1">
                                            <div className="flex justify-between items-center text-sm opacity-90">
                                                <span className="font-medium">{getPlanDisplayName(generalData.planType)}</span>
                                                <span className="font-bold">{formatCurrency(pricingData.customPrice > 0 ? pricingData.customPrice : pricingData.basePrice)}</span>
                                            </div>

                                            {projectAddOns.length > 0 && (
                                                <div className="space-y-2 pt-4 border-t border-gray-700">
                                                    <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Add-ons</p>
                                                    {projectAddOns.map(addon => (
                                                        <div key={addon.id} className="flex justify-between items-center text-sm">
                                                            <span className="truncate pr-2 text-gray-300">{addon.name}</span>
                                                            <span className="font-medium">{formatCurrency(addon.price)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {(pricingData.customHours || 0) > 0 && (
                                                <div className="space-y-2 pt-4 border-t border-gray-700">
                                                    <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Cotización por Horas</p>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-300">{pricingData.customHours}h @ ${pricingData.hourlyRate || 25}/h</span>
                                                        <span className="font-medium">{formatCurrency((pricingData.customHours || 0) * (pricingData.hourlyRate || 25))}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {pricingData.discount > 0 && (
                                                <div className="flex justify-between items-center text-sm text-yellow-300 pt-4 border-t border-gray-700">
                                                    <span>Descuento</span>
                                                    <span>- {formatCurrency(pricingData.discountType === 'percentage' ?
                                                        ((pricingData.customPrice && pricingData.customPrice > 0 ? pricingData.customPrice : (pricingData.basePrice + addOnsTotal)) * pricingData.discount / 100) :
                                                        pricingData.discount
                                                    )}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-gray-700">
                                            <div className="flex justify-between items-center mb-2 text-xs text-blue-300">
                                                <span>Anticipo Requerido ({pricingData.advancePercentage}%)</span>
                                                <span>{formatCurrency(
                                                    (calculateFinalPrice(
                                                        pricingData.basePrice,
                                                        pricingData.customPrice > 0 ? pricingData.customPrice : undefined,
                                                        pricingData.discount,
                                                        pricingData.discountType
                                                    ) + addOnsTotal + ((pricingData.customHours || 0) * (pricingData.hourlyRate || 25))) * (pricingData.advancePercentage || 50) / 100
                                                )}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 uppercase mb-1 tracking-wider">Total Estimado</p>
                                            <p className="text-4xl font-black text-white tracking-tight">
                                                {formatCurrency(calculateFinalPrice(
                                                    pricingData.basePrice,
                                                    pricingData.customPrice > 0 ? pricingData.customPrice : undefined,
                                                    pricingData.discount,
                                                    pricingData.discountType
                                                ) + addOnsTotal + ((pricingData.customHours || 0) * (pricingData.hourlyRate || 25)))}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 text-right">USD</p>
                                        </div>

                                        <button
                                            onClick={handleSaveData}
                                            className="mt-6 w-full bg-white text-gray-900 font-bold py-3.5 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                                        >
                                            <Save size={18} />
                                            Guardar Cotización
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Projection - Below the two-column layout */}
                            <div className="mt-6 shrink-0">
                                <DeliveryProjection
                                    project={project}
                                    addons={projectAddOns}
                                    onUpdate={safeUpdateProject}
                                />
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
                                            onClick={handleStartProduction}
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

                                {status === ProjectStatus.DELIVERED && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-8 shadow-sm text-center">
                                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                            <CheckCircle className="w-10 h-10" />
                                        </div>
                                        <h4 className="text-2xl font-bold text-green-900 mb-3">¡Proyecto Entregado!</h4>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                            El proyecto ha sido finalizado exitosamente. Puedes gestionar los accesos desde el Portal o ver el estado del mantenimiento.
                                        </p>

                                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                                            <button onClick={() => setActiveTab('portal')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md transition-all hover:-translate-y-1">
                                                Gestionar Portal Cliente
                                            </button>
                                            <button onClick={() => setActiveTab('maintenance')} className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 shadow-sm transition-all hover:-translate-y-1">
                                                Ver Mantenimiento
                                            </button>
                                        </div>
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
                            {(status === ProjectStatus.PRODUCTION || status === ProjectStatus.DELIVERY || status === ProjectStatus.WAITING_RESOURCES || status === ProjectStatus.DELIVERED) && (
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
                                    // CRITICAL: Use safeUpdateProject to preserve portal fields
                                    await safeUpdateProject(updates); // ← WAIT for save to complete!
                                    // CRITICAL: Refresh all data from DB to sync React state
                                    if (onRefreshData) {
                                        await onRefreshData();
                                    }
                                }
                            }}
                        />
                    )}
                </div>
            </div>
            {/* Add-ons Library Modal */}
            {
                isLibraryOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    <Sparkles className="w-5 h-5 mr-2 text-indigo-600" /> Librería de Añadidos
                                </h3>
                                <button onClick={() => setIsLibraryOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Create New Template */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase">Crear Nuevo Añadido</h4>
                                    <form onSubmit={handleCreateTemplate} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label>
                                            <input
                                                required
                                                value={newTemplate.name}
                                                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                                className="w-full border rounded p-2 text-sm"
                                                placeholder="Ej: Hosting Extra"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Precio Sugerido</label>
                                            <input
                                                type="number"
                                                required
                                                value={newTemplate.defaultPrice}
                                                onChange={e => setNewTemplate({ ...newTemplate, defaultPrice: Number(e.target.value) })}
                                                className="w-full border rounded p-2 text-sm"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-indigo-700">
                                            Crear
                                        </button>
                                    </form>
                                </div>

                                {/* Template List */}
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase">Disponibles</h4>
                                    {addOnTemplates.length === 0 ? (
                                        <p className="text-gray-500 italic text-sm">No hay plantillas guardadas.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {addOnTemplates.map(template => (
                                                <div key={template.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-gray-900">{template.name}</p>
                                                        <p className="text-xs text-gray-500">{formatCurrency(template.default_price)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleAddAddOn(template)}
                                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 flex items-center"
                                                        >
                                                            <Plus size={14} className="mr-1" /> Usar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTemplate(template.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600"
                                                            title="Eliminar de librería"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
