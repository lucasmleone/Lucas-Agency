import React from 'react';
import { AlertCircle, Lock, CheckCircle } from 'lucide-react';
import { Project, ProjectStatus, ProjectLog } from '../types';

interface ActionCenterProps {
    projects: Project[];
    logs?: ProjectLog[];
}

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

export const ActionCenter: React.FC<ActionCenterProps> = ({ projects, logs = [] }) => {
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

                    // Check if resources are confirmed
                    const hasConfirmedResources = logs.some(l =>
                        String(l.projectId) === String(p.id) &&
                        l.comment === 'Cliente confirmó envío de recursos y pago desde el Portal'
                    );

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
                                    hasConfirmedResources ? (
                                        <div className="text-[10px] bg-purple-100 text-purple-800 px-2 py-1 rounded flex items-center font-bold animate-pulse">
                                            <CheckCircle className="w-3 h-3 mr-1" /> Recursos Enviados
                                        </div>
                                    ) : (
                                        <div className="text-[10px] bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center">
                                            <Lock className="w-3 h-3 mr-1" /> Bloqueado: Falta Info/Pago
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
