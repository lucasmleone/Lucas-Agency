import React, { useState, useEffect } from 'react';
import { Project, Milestone } from '../types';
import { apiService } from '../services/apiService';
import { Lock, Unlock, RefreshCw, Save, Plus, Trash2, GripVertical, CheckCircle, Circle, PlayCircle, ExternalLink, Copy } from 'lucide-react';
import { Toast } from './Toast';

interface PortalAdminProps {
    project: Project;
    onRefresh: (updates?: Partial<Project>) => Promise<void>;
}

export const PortalAdmin: React.FC<PortalAdminProps> = ({ project: initialProject, onRefresh }) => {
    const [project, setProject] = useState<Project>(initialProject);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        driveLink: project.driveLink || '',
        requirements: (project.requirements || []).join('\n')
    });
    const [newMilestone, setNewMilestone] = useState('');
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ action: 'generate' | 'revoke' | 'delete_milestone', id?: number } | null>(null);

    useEffect(() => {
        setProject(initialProject);
        setConfig({
            driveLink: initialProject.driveLink || '',
            requirements: (initialProject.requirements || []).join('\n')
        });
    }, [initialProject]);

    useEffect(() => {
        fetchMilestones();
    }, [project.id]);

    const fetchMilestones = async () => {
        try {
            const data = await apiService.getMilestones(project.id);
            setMilestones(data);
        } catch (error) {
            console.error('Error fetching milestones:', error);
        }
    };

    const handleGeneratePortal = async () => {
        setConfirmModal({ action: 'generate' });
    };

    const confirmGeneratePortal = async () => {
        setLoading(true);
        setConfirmModal(null);
        try {
            const response = await apiService.generatePortal(project.id);
            // Update local project state with new token and pin
            const updates = {
                portalToken: response.token,
                portalPin: response.pin,
                portalEnabled: response.enabled
            };

            setProject(prev => ({ ...prev, ...updates }));

            // CRITICAL: Pass updates to parent to trigger data refresh
            // This ensures the ProjectDetail sees the new portal data
            await onRefresh(updates); // Refresh parent with updates

            setToast({ type: 'success', message: 'Acceso generado correctamente' });
        } catch (error) {
            console.error('Error generating portal:', error);
            setToast({ type: 'error', message: 'Error al generar el portal' });
        } finally {
            setLoading(false);
        }
    };

    const handleRevokePortal = async () => {
        setConfirmModal({ action: 'revoke' });
    };

    const confirmRevokePortal = async () => {
        setLoading(true);
        setConfirmModal(null);
        try {
            await apiService.revokePortal(project.id);
            // Update local project state
            setProject(prev => ({
                ...prev,
                portalToken: undefined,
                portalPin: undefined,
                portalEnabled: false
            }));
            await onRefresh(); // Refresh parent
            setToast({ type: 'success', message: 'Acceso revocado' });
        } catch (error) {
            console.error('Error revoking portal:', error);
            setToast({ type: 'error', message: 'Error al revocar' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        setLoading(true);
        try {
            await apiService.updatePortalConfig(project.id, {
                driveLink: config.driveLink,
                requirements: config.requirements.split('\n').filter(r => r.trim())
            });
            await onRefresh();
            setToast({ type: 'success', message: 'Configuración guardada' });
        } catch (error) {
            console.error('Error saving config:', error);
            setToast({ type: 'error', message: 'Error al guardar' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMilestone.trim()) return;
        try {

            await apiService.addMilestone(project.id, { title: newMilestone });
            setNewMilestone('');
            fetchMilestones();
            setToast({ type: 'success', message: 'Hito agregado' });
        } catch (error) {
            console.error('Error adding milestone:', error);
            setToast({ type: 'error', message: 'Error al agregar hito' });
        }
    };

    const handleUpdateMilestone = async (id: number, updates: Partial<Milestone>) => {
        try {
            await apiService.updateMilestone(project.id, id, updates);
            fetchMilestones();
        } catch (error) {
            console.error('Error updating milestone:', error);
        }
    };

    const handleDeleteMilestone = async (id: number) => {
        setConfirmModal({ action: 'delete', milestoneId: id });
    };

    const confirmDeleteMilestone = async () => {
        if (!confirmModal || !confirmModal.milestoneId) return;
        const id = confirmModal.milestoneId;
        setConfirmModal(null);
        try {
            await apiService.deleteMilestone(project.id, id);
            fetchMilestones();
        } catch (error) {
            console.error('Error deleting milestone:', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setToast({ type: 'success', message: 'Copiado al portapapeles' });
    };

    const portalUrl = `${window.location.origin}/portal/${project.portalToken}`;

    return (
        <div className="space-y-8">
            {/* Access Control */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Control de Acceso</h3>
                        <p className="text-sm text-gray-500">Gestiona el enlace público y el PIN de seguridad.</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${project.portalEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {project.portalEnabled ? 'ACTIVO' : 'INACTIVO'}
                    </div>
                </div>

                {project.portalEnabled ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Enlace Público</label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-sm bg-white p-2 rounded border border-gray-300 truncate select-all">
                                        {portalUrl}
                                    </code>
                                    <button onClick={() => copyToClipboard(portalUrl)} className="p-2 text-gray-500 hover:text-blue-600">
                                        <Copy size={16} />
                                    </button>
                                    <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-blue-600">
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">PIN de Seguridad</label>
                                <div className="flex items-center gap-2">
                                    <code className="text-xl font-mono font-bold tracking-widest bg-white px-4 py-1 rounded border border-gray-300">
                                        {project.portalPin}
                                    </code>
                                    <button onClick={() => copyToClipboard(project.portalPin || '')} className="p-2 text-gray-500 hover:text-blue-600">
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={handleGeneratePortal} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                <RefreshCw size={14} /> Regenerar Credenciales
                            </button>
                            <button onClick={handleRevokePortal} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 flex items-center gap-2">
                                <Lock size={16} /> Revocar Acceso
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">El portal del cliente está desactivado.</p>
                        <button onClick={handleGeneratePortal} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2 mx-auto">
                            <Unlock size={16} /> Generar Acceso
                        </button>
                    </div>
                )}
            </div>

            {/* Configuration */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Configuración</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enlace a Carpeta (Drive/Dropbox)</label>
                        <input
                            type="url"
                            value={config.driveLink}
                            onChange={e => setConfig({ ...config, driveLink: e.target.value })}
                            placeholder="https://drive.google.com/..."
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Requisitos (Uno por línea)</label>
                        <textarea
                            value={config.requirements}
                            onChange={e => setConfig({ ...config, requirements: e.target.value })}
                            placeholder="- Logo en vector&#10;- Manual de marca&#10;- Textos legales"
                            rows={5}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSaveConfig} disabled={loading} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black flex items-center gap-2">
                            <Save size={16} /> Guardar Configuración
                        </button>
                    </div>
                </div>
            </div>

            {/* Delivery Data */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Datos de Entrega (Credenciales)</h3>
                <p className="text-sm text-gray-500 mb-4">Estos datos se mostrarán al cliente en la etapa "Cierre y Entrega" solo si el pago está completo.</p>
                <div className="space-y-6">
                    {/* Web Credentials */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Lock size={16} /> Credenciales Web (WordPress/Admin)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Acceso</label>
                                <input
                                    type="text"
                                    value={project.deliveryData?.webUrl || ''}
                                    onChange={e => setProject({ ...project, deliveryData: { ...project.deliveryData, webUrl: e.target.value } })}
                                    placeholder="https://midominio.com/wp-admin"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Usuario</label>
                                <input
                                    type="text"
                                    value={project.deliveryData?.webUser || ''}
                                    onChange={e => setProject({ ...project, deliveryData: { ...project.deliveryData, webUser: e.target.value } })}
                                    placeholder="admin"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                                <input
                                    type="text"
                                    value={project.deliveryData?.webPass || ''}
                                    onChange={e => setProject({ ...project, deliveryData: { ...project.deliveryData, webPass: e.target.value } })}
                                    placeholder="********"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Credentials */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Lock size={16} /> Credenciales Email Corporativo
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Webmail</label>
                                <input
                                    type="text"
                                    value={project.deliveryData?.emailUrl || ''}
                                    onChange={e => setProject({ ...project, deliveryData: { ...project.deliveryData, emailUrl: e.target.value } })}
                                    placeholder="https://webmail.midominio.com"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input
                                    type="text"
                                    value={project.deliveryData?.emailUser || ''}
                                    onChange={e => setProject({ ...project, deliveryData: { ...project.deliveryData, emailUser: e.target.value } })}
                                    placeholder="info@midominio.com"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                                <input
                                    type="text"
                                    value={project.deliveryData?.emailPass || ''}
                                    onChange={e => setProject({ ...project, deliveryData: { ...project.deliveryData, emailPass: e.target.value } })}
                                    placeholder="********"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Report Link */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enlace a Informe Final (Drive/PDF)</label>
                        <input
                            type="url"
                            value={project.deliveryData?.reportLink || ''}
                            onChange={e => setProject({ ...project, deliveryData: { ...project.deliveryData, reportLink: e.target.value } })}
                            placeholder="https://drive.google.com/file/d/..."
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    await onRefresh({ deliveryData: project.deliveryData });
                                    setToast({ type: 'success', message: 'Datos de entrega guardados' });
                                } catch (error) {
                                    console.error(error);
                                    setToast({ type: 'error', message: 'Error al guardar' });
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Save size={16} /> Guardar Datos de Entrega
                        </button>
                    </div>
                </div>
            </div>

            {/* Milestones (Fog of War) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Línea de Tiempo (Niebla de Guerra)</h3>
                        <p className="text-sm text-gray-500">Define los pasos. El cliente solo verá hasta el hito activo.</p>
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    {milestones.map((milestone, index) => (
                        <div key={milestone.id} className={`flex items-center gap-3 p-3 rounded-lg border ${milestone.status === 'active' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                            <div className="cursor-move text-gray-400">
                                <GripVertical size={16} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${milestone.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                    {milestone.title}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {milestone.status === 'pending' && (
                                    <button onClick={() => handleUpdateMilestone(milestone.id, { status: 'active' })} className="text-gray-400 hover:text-blue-600" title="Marcar como Activo">
                                        <PlayCircle size={18} />
                                    </button>
                                )}
                                {milestone.status === 'active' && (
                                    <button onClick={() => handleUpdateMilestone(milestone.id, { status: 'completed' })} className="text-blue-600 hover:text-green-600" title="Completar">
                                        <CheckCircle size={18} />
                                    </button>
                                )}
                                {milestone.status === 'completed' && (
                                    <button onClick={() => handleUpdateMilestone(milestone.id, { status: 'active' })} className="text-green-600 hover:text-blue-600" title="Reactivar">
                                        <CheckCircle size={18} fill="currentColor" className="text-green-100" />
                                    </button>
                                )}
                                <button onClick={() => handleDeleteMilestone(milestone.id)} className="text-gray-400 hover:text-red-600 ml-2">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddMilestone} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newMilestone}
                        onChange={e => setNewMilestone(e.target.value)}
                        placeholder="Nuevo hito (ej: Diseño UI)"
                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button type="submit" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 flex items-center gap-2">
                        <Plus size={16} /> Agregar
                    </button>
                </form>

                {/* Milestone Library */}
                <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Sugerencias (Clic para agregar)</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            'Inicio del Proyecto',
                            'Investigación y Estrategia',
                            'Diseño Visual',
                            'Desarrollo',
                            'Carga e Integración de Contenidos',
                            'Pruebas de Calidad (TESTING)',
                            'Revisión con Cliente',
                            'Aplicación de Feedback',
                            'Ajustes Finales',
                            'Creación de Informe',
                            'Lanzamiento y Entrega'
                        ].map(suggestion => (
                            <button
                                key={suggestion}
                                onClick={async () => {
                                    try {
                                        await apiService.addMilestone(project.id, { title: suggestion });
                                        fetchMilestones();
                                        setToast({ type: 'success', message: 'Hito agregado' });
                                    } catch (error) {
                                        console.error('Error adding suggestion:', error);
                                    }
                                }}
                                className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                            >
                                + {suggestion}
                            </button>
                        ))}
                        <div className="w-full mt-2">
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const suggestions = [
                                            'Inicio del Proyecto',
                                            'Investigación y Estrategia',
                                            'Diseño Visual',
                                            'Desarrollo',
                                            'Carga e Integración de Contenidos',
                                            'Pruebas de Calidad (TESTING)',
                                            'Revisión con Cliente',
                                            'Aplicación de Feedback',
                                            'Ajustes Finales',
                                            'Creación de Informe',
                                            'Lanzamiento y Entrega'
                                        ];
                                        for (const title of suggestions) {
                                            // Check if already exists to avoid duplicates
                                            if (!milestones.some(m => m.title === title)) {
                                                await apiService.addMilestone(project.id, { title });
                                            }
                                        }
                                        fetchMilestones();
                                        setToast({ type: 'success', message: 'Hitos sugeridos agregados' });
                                    } catch (error) {
                                        console.error('Error adding all suggestions:', error);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="text-xs text-blue-600 hover:underline font-medium"
                            >
                                Agregar todos los sugeridos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onCancel={() => setToast(null)}
                />
            )}

            {confirmModal && (
                <Toast
                    type="confirm"
                    message={
                        confirmModal.action === 'generate'
                            ? '¿Generar nuevo acceso? Esto invalidará el enlace anterior.'
                            : confirmModal.action === 'revoke'
                                ? '¿Revocar acceso? El cliente ya no podrá entrar.'
                                : '¿Eliminar este hito?'
                    }
                    onConfirm={
                        confirmModal.action === 'generate'
                            ? confirmGeneratePortal
                            : confirmModal.action === 'revoke'
                                ? confirmRevokePortal
                                : confirmDeleteMilestone
                    }
                    onCancel={() => setConfirmModal(null)}
                />
            )}
        </div>
    );
};
