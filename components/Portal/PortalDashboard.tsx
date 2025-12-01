
import React, { useState } from 'react';
import { Project, Milestone } from '../../types';
import {
    CheckCircle, Clock, FileText, Download, ExternalLink, Send, ChevronRight, Lock, Globe,
    Mail,
    Copy,
    AlertCircle,
    Plus
} from 'lucide-react';

interface PortalDashboardProps {
    project: Project;
    milestones: Milestone[];
    onAction: (action: string, data?: any) => Promise<void>;
}

export const PortalDashboard: React.FC<PortalDashboardProps> = ({ project, milestones, onAction }) => {
    const [loading, setLoading] = useState(false);
    const [checkedRequirements, setCheckedRequirements] = useState<Set<number>>(new Set());
    const [resourcesConfirmed, setResourcesConfirmed] = useState(project.resourcesSent || false);

    const [confirmModal, setConfirmModal] = useState<{ show: boolean; action: string; title: string; message: string } | null>(null);

    const [advancePaymentInfo, setAdvancePaymentInfo] = useState('');

    const toggleRequirement = (index: number) => {
        const newChecked = new Set(checkedRequirements);
        if (newChecked.has(index)) {
            newChecked.delete(index);
        } else {
            newChecked.add(index);
        }
        setCheckedRequirements(newChecked);
    };

    const handleActionClick = (action: string) => {
        let title = '¿Estás seguro?';
        let message = 'Esta acción no se puede deshacer.';

        if (action === 'approve_proposal') {
            title = 'Aprobar Propuesta';
            message = 'Al aprobar, confirmas que estás de acuerdo con el presupuesto y los términos detallados. Se notificará al equipo para comenzar.';
        } else if (action === 'confirm_resources') {
            title = 'Confirmar Envío de Recursos';
            message = '¿Confirmas que has subido todos los archivos necesarios a la carpeta compartida?';
        }

        setConfirmModal({ show: true, action, title, message });
    };

    const confirmAction = async () => {
        if (!confirmModal) return;
        const currentAction = confirmModal.action;
        setLoading(true);
        setConfirmModal(null);
        try {
            await onAction(currentAction);

            // Show success message and mark resources as confirmed
            if (currentAction === 'confirm_resources') {
                setResourcesConfirmed(true);
                setConfirmModal({
                    show: true,
                    action: 'success',
                    title: '✅ ¡Confirmación Recibida!',
                    message: 'Hemos notificado al equipo. Revisaremos los archivos y comenzaremos el desarrollo a la brevedad. Te mantendremos informado.'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al procesar la solicitud.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAdvance = async () => {
        if (!advancePaymentInfo.trim()) {
            alert('Por favor indica cómo realizaste el pago.');
            return;
        }

        setLoading(true);
        try {
            await onAction('confirm_advance', { paymentInfo: advancePaymentInfo });

            setConfirmModal({
                show: true,
                action: 'success',
                title: '✅ ¡Anticipo Confirmado!',
                message: 'Hemos recibido la confirmación de tu pago. Procederemos con el proyecto a la brevedad.'
            });
        } catch (error) {
            console.error(error);
            alert('Error al confirmar el anticipo.');
        } finally {
            setLoading(false);
        }
    };

    // Determine View based on Status
    // Simplified mapping for the 4 requested views
    const isProposal = project.status === '2. Propuesta'; // Or '1. Discovery'
    const isWaitingResources = project.status === '3. Espera Recursos';
    const isProduction = project.status === '4. Producción';
    const isDelivery = project.status === '5. Cierre y Entrega';
    const isFinished = project.status === '7. Entregado';

    return (
        <div className="min-h-screen bg-gray-50 font-sans relative">
            {/* Custom Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{confirmModal.title}</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">{confirmModal.message}</p>
                        <div className={`flex gap-3 ${confirmModal.action === 'success' ? 'justify-center' : 'justify-end'}`}>
                            {confirmModal.action !== 'success' ? (
                                <>
                                    <button
                                        onClick={() => setConfirmModal(null)}
                                        className="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors border-2 border-gray-300">
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmAction}
                                        disabled={loading}
                                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg">
                                        {loading ? 'Procesando...' : 'Confirmar'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setConfirmModal(null)}
                                    className="px-8 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg">
                                    Cerrar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}



            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">LA</span>
                        </div>
                        <h1 className="font-bold text-gray-900">{project.clientName}</h1>
                    </div>
                    <div className="text-sm text-gray-500">
                        {project.planType}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-12">

                {/* STAGE 1: PROPOSAL */}
                {isProposal && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                                <FileText size={32} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Propuesta de Proyecto</h2>
                            <p className="text-lg text-gray-600 max-w-xl mx-auto">
                                Hemos preparado una propuesta detallada para llevar tu negocio al siguiente nivel.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-8 space-y-8">
                                {/* Budget Header */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-100 pb-8 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Inversión Total</p>
                                        <p className="text-5xl font-bold text-gray-900 tracking-tight">
                                            ${project.finalPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-left md:text-right bg-gray-50 px-4 py-2 rounded-lg">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Plan Seleccionado</p>
                                        <p className="font-bold text-gray-900 text-lg">{project.isHourlyQuote ? 'Cotización por Horas' : project.planType}</p>
                                    </div>
                                </div>

                                {/* Pricing Breakdown */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Desglose de Inversión</h4>

                                    {project.isHourlyQuote ? (
                                        // Hourly Breakdown
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700 font-medium">Desarrollo Personalizado</span>
                                                <span className="font-bold text-gray-900">
                                                    {(project.customHours * project.hourlyRate).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500 pl-4 border-l-2 border-gray-300">
                                                {project.customHours} horas estimadas x ${project.hourlyRate}/hora
                                            </div>
                                        </div>
                                    ) : (
                                        // Plan + Addons Breakdown
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700 font-medium">
                                                    Plan Base ({project.planType})
                                                    <span className="text-gray-400 font-normal ml-1">
                                                        ({project.basePrice?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})
                                                    </span>
                                                </span>
                                                <span className="font-bold text-gray-900">
                                                    {project.basePrice?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                </span>
                                            </div>
                                            {project.addOns && project.addOns.map((addon, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600 flex items-center">
                                                        <Plus size={14} className="mr-2 text-blue-500" />
                                                        {addon.name}
                                                    </span>
                                                    <span className="font-medium text-gray-900">
                                                        {parseFloat(addon.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Discount */}
                                    {project.discount > 0 && (
                                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 text-green-600">
                                            <span className="font-medium">Descuento Aplicado ({project.discountType === 'percentage' ? `${project.discount}%` : `$${project.discount}`})</span>
                                            <span className="font-bold">
                                                - {((project.isHourlyQuote
                                                    ? (project.customHours * project.hourlyRate)
                                                    : (project.basePrice + (project.addOns?.reduce((sum, a) => sum + parseFloat(a.price), 0) || 0))) - project.finalPrice)
                                                    .toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                            </span>
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-gray-200">
                                        <span className="font-black text-gray-900 text-lg">TOTAL FINAL</span>
                                        <span className="font-black text-gray-900 text-xl">
                                            {project.finalPrice?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Services Detail */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
                                        DETALLE DE SERVICIOS INCLUIDOS
                                    </h3>
                                    <p className="text-gray-600 mb-4">Para garantizar un resultado profesional y de alto impacto, el servicio incluye:</p>
                                    <ul className="grid gap-4 sm:grid-cols-2">
                                        {[
                                            { title: 'Desarrollo Web Optimizado', desc: 'Código limpio enfocado en velocidad de carga y posicionamiento en buscadores (SEO Técnico).' },
                                            { title: 'Diseño Responsivo', desc: 'Visualización perfecta en celulares, tablets y computadoras.' },
                                            { title: 'Funcionalidades Clave', desc: 'Integración con WhatsApp, formularios de contacto y mapas interactivos.' },
                                            { title: '🎁 Seguridad y Soporte', desc: 'Configuración de certificado SSL (candado seguro).', isFree: false }
                                        ].map((item, i) => (
                                            <li key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <strong className="block text-gray-900 mb-1">{item.title}</strong>
                                                <span className="text-sm text-gray-600">{item.desc}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* FREE Maintenance Highlight */}
                                    <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-2xl">🎉</span>
                                                    <strong className="text-green-900 font-bold">Mantenimiento Técnico Bonificado</strong>
                                                </div>
                                                <p className="text-sm text-green-800">2 meses de soporte y actualizaciones sin costo adicional</p>
                                            </div>
                                            <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-black shadow-lg whitespace-nowrap">
                                                GRATIS
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms & Conditions */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="w-1 h-6 bg-gray-300 rounded-full mr-3"></span>
                                        TÉRMINOS Y CONDICIONES
                                    </h3>
                                    <div className="space-y-4 text-sm text-gray-600 bg-gray-50 p-6 rounded-xl border border-gray-100 h-64 overflow-y-auto custom-scrollbar">
                                        <div className="space-y-2">
                                            <strong className="text-gray-900 block">1. Alcance y Exclusiones</strong>
                                            <p>Este presupuesto cubre el desarrollo web y la optimización básica para buscadores (SEO). Exclusiones: NO incluye diseño de identidad corporativa (creación de logotipos, manuales de marca) ni servicios de fotografía. El Cliente deberá proporcionar estos activos en la calidad adecuada.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <strong className="text-gray-900 block">2. Plazos de Ejecución</strong>
                                            <p>El tiempo estimado para la entrega de la Primera Revisión (Borrador Funcional) es de 4 semanas. Inicio del cómputo: Este plazo comenzará a contar únicamente cuando se cumplan dos condiciones: Recepción del comprobante de pago del anticipo (50%) y Entrega del 100% de la información base solicitada (Briefing).</p>
                                        </div>
                                        <div className="space-y-2">
                                            <strong className="text-gray-900 block">3. Entrega de Contenidos (Textos)</strong>
                                            <p>El Cliente es responsable de entregar los textos finales antes del inicio. Retrasos: Si el Cliente se demora en la entrega, podrá solicitar al Desarrollador el uso de textos provisionales (genéricos o IA) para no detener el avance visual.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <strong className="text-gray-900 block">4. Vigencia del Proyecto (Inactividad)</strong>
                                            <p>Para garantizar el flujo de trabajo, el proyecto tiene una vigencia activa de 30 días tras cada entrega o solicitud de feedback. Stand-by: Si el Cliente no responde en este periodo, el proyecto pasará a estado "Inactivo".</p>
                                        </div>
                                        <div className="space-y-2">
                                            <strong className="text-gray-900 block">5. Forma de Pago y Propiedad</strong>
                                            <p>Anticipo: 50% a la firma. Saldo Final: 50% restante contra aprobación. Propiedad Intelectual: Los derechos permanecen como propiedad del Desarrollador hasta la liquidación total.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <strong className="text-gray-900 block">6. Validez del Presupuesto</strong>
                                            <p>Esta cotización tiene una validez de 30 días naturales desde su fecha de emisión.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
                                <div>
                                    <p className="font-bold text-lg">¿Listo para comenzar?</p>
                                    <p className="text-gray-400 text-sm">Al aprobar, aceptas los términos y condiciones detallados arriba.</p>
                                </div>
                                <button
                                    onClick={() => handleActionClick('approve_proposal')}
                                    disabled={loading}
                                    className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-white/10 flex items-center justify-center gap-3"
                                >
                                    {loading ? 'Procesando...' : (
                                        <>
                                            Aprobar Propuesta <ChevronRight size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}



                {/* STAGE 2: WAITING RESOURCES & ADVANCE PAYMENT */}
                {
                    isWaitingResources && !resourcesConfirmed && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-full mb-4">
                                    <Clock size={32} />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Esperando Recursos</h2>
                                <p className="text-lg text-gray-600 max-w-xl mx-auto">
                                    Para comenzar, necesitamos que completes estos 2 pasos.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-2xl mx-auto">
                                <div className="p-8 space-y-8">
                                    {/* Step 1: Upload Files + Requirements */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                            Sube tus archivos
                                        </h3>
                                        <div className="space-y-4">
                                            <a
                                                href={project.driveLink || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full p-6 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-center group"
                                            >
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                                    <ExternalLink size={24} />
                                                </div>
                                                <p className="font-bold text-blue-900">Abrir Carpeta Compartida</p>
                                                <p className="text-sm text-blue-600">Google Drive / Dropbox</p>
                                            </a>

                                            {/* Requirements Checklist */}
                                            {(project.requirements && project.requirements.length > 0) && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">Lo que necesitamos:</p>
                                                    <ul className="space-y-2">
                                                        {project.requirements.map((req, i) => (
                                                            <li
                                                                key={i}
                                                                onClick={() => toggleRequirement(i)}
                                                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${checkedRequirements.has(i)
                                                                    ? 'bg-green-500 border-green-500'
                                                                    : 'border-gray-300 hover:border-gray-400'
                                                                    }`}>
                                                                    {checkedRequirements.has(i) && (
                                                                        <CheckCircle size={16} className="text-white" />
                                                                    )}
                                                                </div>
                                                                <span className={`text-sm text-gray-700 ${checkedRequirements.has(i) ? 'line-through opacity-60' : ''}`}>{req}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 2: Advance Payment */}
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                            Confirma el Anticipo ({project.advancePercentage}%)
                                        </h3>

                                        {project.advancePaymentInfo ? (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <div className="flex items-start gap-3 mb-2">
                                                    <CheckCircle size={20} className="text-green-600 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-sm text-green-800 font-semibold mb-1">
                                                            ✓ Pago confirmado
                                                        </p>
                                                        <p className="text-xs text-green-700 bg-green-100 p-2 rounded">
                                                            {project.advancePaymentInfo}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <p className="text-sm text-gray-700 mb-2">Para iniciar el desarrollo, necesitamos un anticipo de:</p>
                                                    <p className="text-3xl font-black text-gray-900">
                                                        ${((project.finalPrice || 0) * (project.advancePercentage || 50) / 100).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">De un total de ${(project.finalPrice || 0).toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                                        Información de Pago
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        value={advancePaymentInfo}
                                                        onChange={(e) => setAdvancePaymentInfo(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                                        placeholder="Ejemplo: Transferencia bancaria #123456 o link al comprobante"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Indícanos el método/número de referencia o pega el link al comprobante
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 border-t border-gray-100">
                                    <button
                                        onClick={async () => {
                                            if (!project.advancePaymentInfo && !advancePaymentInfo.trim()) {
                                                alert('Por favor completa la información del anticipo antes de continuar.');
                                                return;
                                            }

                                            setLoading(true);
                                            try {
                                                // Si falta el anticipo, confirmarlo primero
                                                if (!project.advancePaymentInfo) {
                                                    await onAction('confirm_advance', { paymentInfo: advancePaymentInfo });
                                                }

                                                // Luego confirmar recursos
                                                await onAction('confirm_resources');

                                                // Marcar recursos como confirmados para cambiar de vista
                                                setResourcesConfirmed(true);

                                                // Mostrar mensaje de éxito
                                                setConfirmModal({
                                                    show: true,
                                                    action: 'success',
                                                    title: '✅ ¡Confirmación Recibida!',
                                                    message: 'Hemos notificado al equipo. Revisaremos los archivos y comenzaremos el desarrollo a la brevedad. Te mantendremos informado.'
                                                });
                                            } catch (error) {
                                                console.error('Error:', error);
                                                alert('Ocurrió un error al procesar la solicitud.');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-3"
                                    >
                                        {loading ? 'Procesando...' : (
                                            <>
                                                <Send size={20} />
                                                {project.advancePaymentInfo ? 'Confirmar Todo Enviado' : 'Confirmar Pago y Envío'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* STAGE 2b: RESOURCES CONFIRMED - UNDER REVIEW */}
                {
                    isWaitingResources && resourcesConfirmed && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 text-purple-600 rounded-full mb-4">
                                    <CheckCircle size={40} />
                                </div>
                                <h2 className="text-3xl font-extrabold text-gray-900">Recursos en Revisión</h2>
                                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                    Gracias por enviar los archivos. Nuestro equipo los está revisando y comenzaremos el desarrollo pronto.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-200">
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                                            1
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">Revisión de Archivos y Pago</h3>
                                            <p className="text-gray-600 text-sm">
                                                Verificamos que todos los materiales estén completos y confirmamos el anticipo.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                                            2
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-700 mb-1">Inicio de Desarrollo</h3>
                                            <p className="text-gray-500 text-sm">
                                                Una vez aprobados, comenzaremos a trabajar en tu proyecto.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                                            3
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-700 mb-1">Actualizaciones Regulares</h3>
                                            <p className="text-gray-500 text-sm">
                                                Te mantendremos informado del progreso a través de este portal.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                <div className="flex gap-4">
                                    <div className="text-blue-600 flex-shrink-0">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-900 mb-1">¿Necesitas agregar algo?</h4>
                                        <p className="text-blue-700 text-sm">
                                            Si olvidaste algún archivo o necesitas hacer cambios, puedes subirlos a la{' '}
                                            <a
                                                href={project.driveLink || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline font-bold hover:text-blue-900">
                                                carpeta compartida
                                            </a>
                                            {' '}y te contactaremos si hay algún problema.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* STAGE 3: PRODUCTION (FOG OF WAR) */}
                {
                    isProduction && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                                    <Clock size={32} />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">En Producción</h2>
                                <p className="text-lg text-gray-600 max-w-xl mx-auto">
                                    Estamos trabajando en tu proyecto. Aquí puedes ver el progreso en tiempo real.
                                </p>
                            </div>

                            <div className="max-w-xl mx-auto relative">
                                {/* Vertical Line */}
                                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200" />

                                <div className="space-y-8 relative">
                                    {milestones.map((milestone, index) => (
                                        <div key={milestone.id} className="flex gap-6 relative">
                                            {/* Icon */}
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 border-4 border-gray-50 shadow-sm transition-all
                                            ${milestone.status === 'completed' ? 'bg-green-500 text-white' :
                                                    milestone.status === 'active' ? 'bg-white border-blue-100 text-blue-600 ring-4 ring-blue-50' :
                                                        'bg-gray-100 text-gray-400'
                                                }
`}>
                                                {milestone.status === 'completed' ? <CheckCircle size={24} /> :
                                                    milestone.status === 'active' ? <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping" /> :
                                                        <div className="w-3 h-3 bg-gray-300 rounded-full" />}
                                            </div>

                                            {/* Content */}
                                            <div className={`flex - 1 pt - 3 ${milestone.status === 'active' ? 'opacity-100' : 'opacity-80'} `}>
                                                <h3 className={`text - lg font - bold ${milestone.status === 'active' ? 'text-blue-600' : 'text-gray-900'} `}>
                                                    {milestone.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {milestone.status === 'completed' ? 'Completado' :
                                                        milestone.status === 'active' ? 'En progreso...' :
                                                            'Pendiente'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Fog of War Hint */}
                                    <div className="flex gap-6 relative opacity-50 blur-[2px]">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 border-4 border-white">
                                            <Lock size={20} className="text-gray-300" />
                                        </div>
                                        <div className="flex-1 pt-4">
                                            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                                            <div className="h-3 bg-gray-100 rounded w-24" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* STAGE 5: DELIVERY & CLOSURE */}
                {
                    isDelivery && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Cierre y Entrega</h2>
                                <p className="text-lg text-gray-600 max-w-xl mx-auto">
                                    ¡Tu proyecto está listo! {project.paymentStatus === 'Pagado (100%)' ? 'Aquí tienes tus accesos.' : 'Completa el pago final para acceder a tus credenciales.'}
                                </p>
                            </div>

                            {project.paymentStatus !== 'Pagado (100%)' ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-lg mx-auto">
                                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Lock size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Esperando Confirmación de Saldo</h3>
                                    <p className="text-gray-600 mb-6">
                                        Para liberar las credenciales de acceso y el informe final, es necesario registrar el pago del saldo restante.
                                    </p>
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-500">
                                        Si ya realizaste el pago, por favor avísanos para actualizar el estado.
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Premium Website Showcase */}
                                    {project.deliveryData?.finalUrl && (
                                        <div className="mb-12 animate-slide-up">
                                            <div className="relative group cursor-pointer" onClick={() => window.open(project.deliveryData?.finalUrl, '_blank')}>
                                                {/* Glow Effect */}
                                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                                                <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-100">
                                                    {/* Browser Bar */}
                                                    <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-4">
                                                        <div className="flex gap-1.5">
                                                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                                        </div>
                                                        <div className="flex-1 bg-white rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-400 flex items-center justify-center font-mono truncate">
                                                            <Lock size={10} className="mr-1.5 text-green-500" />
                                                            {project.deliveryData.finalUrl}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="p-8 md:p-12 text-center bg-gradient-to-b from-white to-gray-50">
                                                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                            <Globe size={40} />
                                                        </div>
                                                        <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                                                            Esta es tu nueva web
                                                        </h3>
                                                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                                            Diseñada profesionalmente, optimizada y lista para el mundo.
                                                        </p>

                                                        <button className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto">
                                                            Visitar Sitio Web <ExternalLink size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6 max-w-4xl mx-auto">
                                        {/* Warning */}
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                                            <div className="text-yellow-600 mt-0.5"><Lock size={20} /></div>
                                            <div>
                                                <h4 className="font-bold text-yellow-800">Importante: Copia estos datos ahora</h4>
                                                <p className="text-sm text-yellow-700 mt-1">
                                                    Por seguridad, el acceso a este portal se cerrará en unos días. Asegúrate de copiar y guardar todas tus contraseñas en un lugar seguro.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Web Credentials */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                        <ExternalLink size={18} className="text-blue-600" /> Credenciales Web
                                                    </h3>
                                                </div>
                                                <div className="p-6 space-y-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">URL de Acceso</label>
                                                        <div className="flex gap-2">
                                                            <input readOnly value={project.deliveryData?.webUrl || ''} className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" />
                                                            <a href={project.deliveryData?.webUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded"><ExternalLink size={18} /></a>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Usuario</label>
                                                            <div className="relative">
                                                                <input readOnly value={project.deliveryData?.webUser || ''} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Contraseña</label>
                                                            <div className="relative">
                                                                <input readOnly value={project.deliveryData?.webPass || ''} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Email Credentials */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                        <Send size={18} className="text-blue-600" /> Email Corporativo
                                                    </h3>
                                                </div>
                                                <div className="p-6 space-y-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Webmail URL</label>
                                                        <div className="flex gap-2">
                                                            <input readOnly value={project.deliveryData?.emailUrl || ''} className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" />
                                                            <a href={project.deliveryData?.emailUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded"><ExternalLink size={18} /></a>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email</label>
                                                            <div className="relative">
                                                                <input readOnly value={project.deliveryData?.emailUser || ''} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Contraseña</label>
                                                            <div className="relative">
                                                                <input readOnly value={project.deliveryData?.emailPass || ''} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Final Report */}
                                        <div className="bg-blue-600 rounded-xl shadow-lg p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div>
                                                <h3 className="text-2xl font-bold mb-2">Informe Final de Proyecto</h3>
                                                <p className="text-blue-100">Descarga el reporte completo con métricas, capturas y detalles técnicos de tu nueva web.</p>
                                            </div>
                                            <a
                                                href={project.deliveryData?.reportLink || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <Download size={20} /> Descargar Informe
                                            </a>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )
                }

                {/* STAGE 4: FINISHED */}
                {
                    isFinished && (
                        <div className="space-y-8 animate-fade-in text-center">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-600 rounded-full mb-4 animate-bounce">
                                <CheckCircle size={48} />
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900">¡Proyecto Terminado!</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Ha sido un placer trabajar contigo. Tu proyecto ha sido entregado exitosamente.
                            </p>

                            {/* Premium Website Showcase */}
                            {project.deliveryData?.finalUrl && (
                                <div className="mb-12 animate-slide-up text-left max-w-4xl mx-auto">
                                    <div className="relative group cursor-pointer" onClick={() => window.open(project.deliveryData?.finalUrl, '_blank')}>
                                        {/* Glow Effect */}
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                                        <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-100">
                                            {/* Browser Bar */}
                                            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-4">
                                                <div className="flex gap-1.5">
                                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                                </div>
                                                <div className="flex-1 bg-white rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-400 flex items-center justify-center font-mono truncate">
                                                    <Lock size={10} className="mr-1.5 text-green-500" />
                                                    {project.deliveryData.finalUrl}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-8 md:p-12 text-center bg-gradient-to-b from-white to-gray-50">
                                                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                    <Globe size={40} />
                                                </div>
                                                <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                                                    Esta es tu nueva web
                                                </h3>
                                                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                                    Diseñada profesionalmente, optimizada y lista para el mundo.
                                                </p>

                                                <button className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto">
                                                    Visitar Sitio Web <ExternalLink size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Credentials Section */}
                            {(project.deliveryData?.webUrl || project.deliveryData?.emailUrl) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8 text-left">
                                    {/* Web Access */}
                                    {project.deliveryData?.webUrl && (
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                            <div className="flex items-center gap-3 mb-4 text-blue-600">
                                                <Globe size={24} />
                                                <h3 className="font-bold text-gray-900">Acceso Web</h3>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <span className="block text-gray-500 mb-1">URL de Acceso</span>
                                                    <a href={project.deliveryData.webUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                                        {project.deliveryData.webUrl}
                                                    </a>
                                                </div>
                                                {project.deliveryData.webUser && (
                                                    <div>
                                                        <span className="block text-gray-500 mb-1">Usuario</span>
                                                        <div className="font-mono bg-gray-50 p-2 rounded border border-gray-100 select-all">
                                                            {project.deliveryData.webUser}
                                                        </div>
                                                    </div>
                                                )}
                                                {project.deliveryData.webPass && (
                                                    <div>
                                                        <span className="block text-gray-500 mb-1">Contraseña</span>
                                                        <div className="font-mono bg-gray-50 p-2 rounded border border-gray-100 select-all">
                                                            {project.deliveryData.webPass}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Email Access */}
                                    {project.deliveryData?.emailUrl && (
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                            <div className="flex items-center gap-3 mb-4 text-purple-600">
                                                <Mail size={24} />
                                                <h3 className="font-bold text-gray-900">Acceso Correo</h3>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <span className="block text-gray-500 mb-1">URL Webmail</span>
                                                    <a href={project.deliveryData.emailUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                                        {project.deliveryData.emailUrl}
                                                    </a>
                                                </div>
                                                {project.deliveryData.emailUser && (
                                                    <div>
                                                        <span className="block text-gray-500 mb-1">Correo</span>
                                                        <div className="font-mono bg-gray-50 p-2 rounded border border-gray-100 select-all">
                                                            {project.deliveryData.emailUser}
                                                        </div>
                                                    </div>
                                                )}
                                                {project.deliveryData.emailPass && (
                                                    <div>
                                                        <span className="block text-gray-500 mb-1">Contraseña</span>
                                                        <div className="font-mono bg-gray-50 p-2 rounded border border-gray-100 select-all">
                                                            {project.deliveryData.emailPass}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Drive/Report Link */}
                            {project.deliveryData?.reportLink && (
                                <div className="max-w-4xl mx-auto mt-6 text-left">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 text-green-600">
                                            <FileText size={24} />
                                            <div>
                                                <h3 className="font-bold text-gray-900">Informe Final / Entregables</h3>
                                                <p className="text-sm text-gray-500">Enlace a Google Drive o PDF</p>
                                            </div>
                                        </div>
                                        <a
                                            href={project.deliveryData.reportLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center gap-2"
                                        >
                                            <ExternalLink size={18} /> Abrir
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md mx-auto mt-8">
                                <h3 className="font-bold text-gray-900 mb-4">Acciones</h3>
                                <button
                                    onClick={() => {
                                        const data = [
                                            '--- CREDENCIALES DEL PROYECTO ---',
                                            '',
                                            project.deliveryData?.webUrl ? `[ACCESO WEB]\nURL: ${project.deliveryData.webUrl} \nUsuario: ${project.deliveryData.webUser || ''} \nContraseña: ${project.deliveryData.webPass || ''} ` : '',
                                            '',
                                            project.deliveryData?.emailUrl ? `[ACCESO CORREO]\nURL: ${project.deliveryData.emailUrl} \nUsuario: ${project.deliveryData.emailUser || ''} \nContraseña: ${project.deliveryData.emailPass || ''} ` : '',
                                            '',
                                            project.deliveryData?.reportLink ? `[INFORME FINAL]\nLink: ${project.deliveryData.reportLink} ` : ''
                                        ].filter(Boolean).join('\n');

                                        navigator.clipboard.writeText(data).then(() => {
                                            alert('Datos copiados al portapapeles');
                                        });
                                    }}
                                    className="w-full py-3 border border-gray-300 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                                >
                                    <Copy size={20} /> Copiar Todos los Datos
                                </button>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-xl inline-block text-yellow-800 text-sm max-w-md">
                                <strong>Nota:</strong> Este enlace de acceso caducará automáticamente en 10 días por seguridad.
                            </div>
                        </div>
                    )
                }

            </main >
        </div >
    );
};
