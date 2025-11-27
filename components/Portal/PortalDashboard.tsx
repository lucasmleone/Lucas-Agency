import React, { useState } from 'react';
import { Project, Milestone } from '../../types';
import { CheckCircle, Clock, FileText, Download, ExternalLink, Send, ChevronRight, Lock } from 'lucide-react';

interface PortalDashboardProps {
    project: Project;
    milestones: Milestone[];
    onAction: (action: string) => Promise<void>;
}

export const PortalDashboard: React.FC<PortalDashboardProps> = ({ project, milestones, onAction }) => {
    const [loading, setLoading] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{ show: boolean; action: string; title: string; message: string } | null>(null);

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
        setLoading(true);
        setConfirmModal(null);
        try {
            await onAction(confirmModal.action);
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al procesar la solicitud.');
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
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
                        <p className="text-gray-600 mb-6">{confirmModal.message}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAction}
                                className="px-4 py-2 rounded-lg bg-black text-white font-bold hover:bg-gray-800 transition-colors"
                            >
                                Confirmar
                            </button>
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
                                        <p className="font-bold text-gray-900 text-lg">{project.planType}</p>
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
                                            { title: 'Seguridad y Soporte', desc: 'Configuración de certificado SSL (candado seguro) y 2 meses de mantenimiento técnico bonificado.' }
                                        ].map((item, i) => (
                                            <li key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <strong className="block text-gray-900 mb-1">{item.title}</strong>
                                                <span className="text-sm text-gray-600">{item.desc}</span>
                                            </li>
                                        ))}
                                    </ul>
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

                {/* STAGE 2: WAITING RESOURCES */}
                {isWaitingResources && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-full mb-4">
                                <Clock size={32} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Esperando Recursos</h2>
                            <p className="text-lg text-gray-600 max-w-xl mx-auto">
                                Para comenzar, necesitamos que nos envíes los siguientes materiales.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-8 space-y-8">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        1. Sube tus archivos
                                    </h3>
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
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        2. Lista de Requisitos
                                    </h3>
                                    <ul className="space-y-3">
                                        {(project.requirements || []).map((req, i) => (
                                            <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                                <span className="text-gray-700">{req}</span>
                                            </li>
                                        ))}
                                        {(!project.requirements || project.requirements.length === 0) && (
                                            <p className="text-gray-500 italic">No hay requisitos específicos listados.</p>
                                        )}
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-8 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => handleActionClick('confirm_resources')}
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-3"
                                >
                                    {loading ? 'Enviando...' : (
                                        <>
                                            <Send size={20} /> Ya envié los recursos
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STAGE 3: PRODUCTION (FOG OF WAR) */}
                {isProduction && (
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
                                                    'bg-gray-100 text-gray-400'}
                                        `}>
                                            {milestone.status === 'completed' ? <CheckCircle size={24} /> :
                                                milestone.status === 'active' ? <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping" /> :
                                                    <div className="w-3 h-3 bg-gray-300 rounded-full" />}
                                        </div>

                                        {/* Content */}
                                        <div className={`flex-1 pt-3 ${milestone.status === 'active' ? 'opacity-100' : 'opacity-80'}`}>
                                            <h3 className={`text-lg font-bold ${milestone.status === 'active' ? 'text-blue-600' : 'text-gray-900'}`}>
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
                )}

                {/* STAGE 5: DELIVERY & CLOSURE */}
                {isDelivery && (
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
                        )}
                    </div>
                )}

                {/* STAGE 4: FINISHED */}
                {isFinished && (
                    <div className="space-y-8 animate-fade-in text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-600 rounded-full mb-4 animate-bounce">
                            <CheckCircle size={48} />
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900">¡Proyecto Terminado!</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Ha sido un placer trabajar contigo. Tu proyecto ha sido entregado exitosamente.
                        </p>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md mx-auto mt-8">
                            <h3 className="font-bold text-gray-900 mb-4">Descargas</h3>
                            <button className="w-full py-3 border border-gray-300 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                                <Download size={20} /> Descargar Factura Final
                            </button>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-xl inline-block text-yellow-800 text-sm max-w-md">
                            <strong>Nota:</strong> Este enlace de acceso caducará automáticamente en 10 días por seguridad.
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};
