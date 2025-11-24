import React, { useState, useEffect } from 'react';
import { MaintenanceTask, MonthlyTask, Project } from '../types';
import { apiService } from '../services/apiService';
import { MonthlyTaskCard } from './MonthlyTaskCard';
import { Shield } from 'lucide-react';
import { Toast } from './Toast';

interface MaintenanceViewProps {
    project: Project;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ project }) => {
    const [task, setTask] = useState<MaintenanceTask | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadTask();
    }, [project.id]);

    const loadTask = async () => {
        setLoading(true);
        const data = await apiService.getMaintenanceTask(project.id);
        setTask(data);
        setLoading(false);
    };

    const handleChecklistUpdate = async (monthIndex: number, itemId: string, completed: boolean) => {
        if (!task) return;

        const updatedTasks = [...task.monthlyTasks];
        const checklist = updatedTasks[monthIndex].checklist.map(item =>
            item.id === itemId ? { ...item, completed } : item
        );
        updatedTasks[monthIndex] = { ...updatedTasks[monthIndex], checklist };

        const updatedTask = { ...task, monthlyTasks: updatedTasks };
        setTask(updatedTask); // Optimistic update

        try {
            await apiService.updateMaintenanceTask(updatedTask);

            // Auto-complete if all items are checked
            const allCompleted = checklist.every(i => i.completed);
            if (allCompleted && !updatedTasks[monthIndex].completed) {
                // Small delay to allow the checkbox animation to finish
                setTimeout(() => {
                    handleCompleteTask(monthIndex);
                }, 500);
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleCompleteTask = async (monthIndex: number) => {
        if (!task) return;
        try {
            // Robustly find the correct task index in case array is not sorted or sparse
            let realIndex = monthIndex;
            // Check if the task at this index matches the expected month (monthIndex + 1)
            // If not, find the index where month === monthIndex + 1
            if (!task.monthlyTasks[realIndex] || task.monthlyTasks[realIndex].month !== monthIndex + 1) {
                realIndex = task.monthlyTasks.findIndex(t => t.month === monthIndex + 1);
            }

            if (realIndex === -1) {
                console.error('Task not found for month index', monthIndex);
                setToast({ show: true, message: 'Error: No se encontró el mes correspondiente', type: 'error' });
                return;
            }

            await apiService.completeMaintenanceTask(task.id, realIndex);

            // Reload task to get updated status (e.g., if it became inactive)
            await loadTask();
            setToast({ show: true, message: 'Mes completado correctamente', type: 'success' });
        } catch (error) {
            console.error('Error completing task:', error);
            setToast({ show: true, message: 'Error al completar el mes', type: 'error' });
        }
    };

    const generateEmailReport = (monthlyTask: MonthlyTask) => {
        if (!task) return;

        const freeUntil = new Date(task.freeUntil);
        const taskDate = new Date(monthlyTask.date);
        const daysUntilExpiry = Math.ceil((freeUntil.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));

        // Logic for variant
        const isLastMonth = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        const clientName = project.clientName.split(' ')[0];

        let subject = `Reporte de Mantenimiento Mensual - ${project.name}`;
        let body = '';

        if (isLastMonth) {
            // Variant B
            body = `Hola ${clientName},

Te enviamos el reporte de mantenimiento de este mes (todo OK).

⚠️ IMPORTANTE: Este es el último mes de mantenimiento gratuito incluido en tu proyecto.

Para continuar protegiendo tu web con actualizaciones y backups a partir del próximo mes, debemos formalizar el plan anual. ¿Te envío la propuesta?

Detalles del mantenimiento de este mes:
${monthlyTask.checklist.map(i => i.completed ? `✓ ${i.text}` : `• ${i.text}`).join('\n')}

Cualquier consulta, estamos a disposición.

Saludos,
Leone Agency`;
        } else {
            // Variant A
            body = `Hola ${clientName},

Te confirmamos que tu web está actualizada y segura. Se realizaron backups externos, actualizaciones de seguridad y optimización de base de datos. Todo funciona correctamente.

Detalles del mantenimiento:
${monthlyTask.checklist.map(i => i.completed ? `✓ ${i.text}` : `• ${i.text}`).join('\n')}

Cualquier consulta, estamos a disposición.

Saludos,
Leone Agency`;
        }

        const fullText = `ASUNTO: ${subject}\n\n${body}`;
        navigator.clipboard.writeText(fullText);
        setToast({ show: true, message: 'Reporte copiado al portapapeles', type: 'success' });

        // Mark report as sent locally
        const updatedTasks = [...task.monthlyTasks];
        updatedTasks[monthlyTask.month - 1].reportSent = true;
        setTask({ ...task, monthlyTasks: updatedTasks });
        apiService.updateMaintenanceTask({ ...task, monthlyTasks: updatedTasks });
    };

    const [showReactivateModal, setShowReactivateModal] = useState(false);
    const [reactivateForm, setReactivateForm] = useState({ months: 3, amount: 0 });

    const handleReactivate = async () => {
        if (!task) return;
        try {
            await apiService.reactivateMaintenance(task.id, reactivateForm.months, reactivateForm.amount);
            setToast({ show: true, message: 'Mantenimiento reactivado correctamente', type: 'success' });
            setShowReactivateModal(false);
            loadTask(); // Reload to see new months
        } catch (error) {
            setToast({ show: true, message: 'Error al reactivar mantenimiento', type: 'error' });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando mantenimiento...</div>;

    if (!task) return (
        <div className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Mantenimiento no activo</h3>
            <p className="text-gray-500 mt-2">Este proyecto no tiene un plan de mantenimiento activo.</p>
        </div>
    );

    const now = new Date();
    const freeUntil = new Date(task.freeUntil);
    const daysRemaining = Math.ceil((freeUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = task.status === 'inactive' || (task.status !== 'active' && daysRemaining < 0);

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            <div className={`p-4 rounded-lg border ${isExpired ? 'bg-gray-50 border-gray-200' :
                daysRemaining < 30 ? 'bg-orange-50 border-orange-200' :
                    'bg-green-50 border-green-200'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className={`h-6 w-6 ${isExpired ? 'text-gray-400' : daysRemaining < 30 ? 'text-orange-600' : 'text-green-600'
                            }`} />
                        <div>
                            <h3 className={`font-medium ${isExpired ? 'text-gray-700' : daysRemaining < 30 ? 'text-orange-900' : 'text-green-900'
                                }`}>
                                {isExpired ? 'Mantenimiento Finalizado' : 'Mantenimiento Activo'}
                            </h3>
                            <p className={`text-sm ${isExpired ? 'text-gray-500' : daysRemaining < 30 ? 'text-orange-700' : 'text-green-700'
                                }`}>
                                {isExpired
                                    ? `El periodo de mantenimiento ha finalizado.`
                                    : (
                                        <span className="flex flex-col">
                                            <span>
                                                Cubierto hasta: {new Date(task.monthlyTasks[task.monthlyTasks.length - 1].date).toLocaleDateString()}
                                            </span>
                                            {daysRemaining > 0 && (
                                                <span className="text-xs opacity-75">
                                                    (Periodo gratuito finaliza: {freeUntil.toLocaleDateString()})
                                                </span>
                                            )}
                                        </span>
                                    )}
                            </p>
                        </div>
                    </div>
                    {isExpired && (
                        <button
                            onClick={() => setShowReactivateModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Reactivar Mantenimiento
                        </button>
                    )}
                </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
                {task.monthlyTasks.map((monthlyTask) => {
                    const taskDate = new Date(monthlyTask.date);
                    const isCurrentMonth = taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();

                    return (
                        <MonthlyTaskCard
                            key={monthlyTask.id}
                            task={monthlyTask}
                            isCurrentMonth={isCurrentMonth}
                            onChecklistUpdate={handleChecklistUpdate}
                            onGenerateReport={generateEmailReport}
                            onCompleteTask={handleCompleteTask}
                        />
                    );
                })}
            </div>

            {/* Reactivate Modal */}
            {showReactivateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Reactivar Mantenimiento</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Meses a agregar
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={reactivateForm.months}
                                    onChange={(e) => setReactivateForm({ ...reactivateForm, months: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Monto a cobrar (USD)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={reactivateForm.amount}
                                        onChange={(e) => setReactivateForm({ ...reactivateForm, amount: parseFloat(e.target.value) })}
                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Se creará un registro de ingreso en Finanzas automáticamente.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowReactivateModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReactivate}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                            >
                                Confirmar Reactivación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onCancel={() => setToast(null)}
                />
            )}
        </div>
    );
};
