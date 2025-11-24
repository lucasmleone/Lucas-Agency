import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp, Briefcase, DollarSign, CheckCircle } from 'lucide-react';
import { Project, ProjectStatus, FinanceRecord, PaymentStatus } from '../types';
import { ActionCenter } from './ActionCenter';
import { WorkloadWidget } from './WorkloadWidget';

interface DashboardProps {
    projects: Project[];
    finances: FinanceRecord[];
    logs?: any[];
    onNavigate?: (view: 'projects' | 'clients' | 'finance' | 'dashboard') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, finances, logs }) => {
    const totalIncome = finances.filter(f => f.type === 'Ingreso').reduce((a, b) => a + b.amount, 0);
    const totalExpenses = finances.filter(f => f.type === 'Gasto').reduce((a, b) => a + b.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    const activeProjects = projects.filter(p => p.status !== ProjectStatus.DELIVERED && p.status !== ProjectStatus.CANCELLED && p.status !== ProjectStatus.LOST).length;
    const pendingPayments = projects.filter(p => p.paymentStatus !== PaymentStatus.FULLY_PAID && p.status !== ProjectStatus.CANCELLED).length;
    const deliveredProjects = projects.filter(p => p.status === ProjectStatus.DELIVERED).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Dashboard</h2>
                <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Action Center */}
            <ActionCenter projects={projects} />

            {/* Workload Calendar */}
            <div className="mb-8">
                <WorkloadWidget projects={projects} />
            </div>

            {/* Stats Cards - Apple Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Net Income Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-semibold text-gray-900">${netIncome.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Ingresos Netos</p>
                </div>

                {/* Active Projects Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-semibold text-gray-900">{activeProjects}</p>
                    <p className="text-sm text-gray-500 mt-1">Proyectos Activos</p>
                </div>

                {/* Pending Payments Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-semibold text-gray-900">{pendingPayments}</p>
                    <p className="text-sm text-gray-500 mt-1">Por Cobrar</p>
                </div>

                {/* Delivered Projects Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-semibold text-gray-900">{deliveredProjects}</p>
                    <p className="text-sm text-gray-500 mt-1">Entregados</p>
                </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Flujo de Caja</h3>
                    <p className="text-sm text-gray-500 mt-1">Ingresos vs Gastos</p>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Total', Ingresos: totalIncome, Gastos: totalExpenses }]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '13px' }} />
                            <YAxis stroke="#6B7280" style={{ fontSize: '13px' }} />
                            <Tooltip
                                formatter={(value) => `$${value}`}
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '13px' }} />
                            <Bar dataKey="Ingresos" fill="#007AFF" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="Gastos" fill="#FF3B30" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                <div className="space-y-4">
                    {/* We need to fetch logs. For now, we'll assume they are passed or fetch them. 
                        The Dashboard component receives 'logs' prop but it's optional and currently undefined in App.tsx usage.
                        Let's update App.tsx to pass logs to Dashboard first. 
                        But for now, let's just render what we have or a placeholder if empty.
                    */}
                    {logs && logs.length > 0 ? (
                        logs.slice(0, 5).map((log: any) => {
                            const project = projects.find(p => String(p.id) === String(log.projectId));
                            return (
                                <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm text-gray-800">{log.message || log.comment}</p>
                                            {project && (
                                                <span className="text-xs text-blue-600 font-medium px-2 py-0.5 bg-blue-50 rounded">
                                                    {project.clientName}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Fecha desconocida'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-gray-500">No hay actividad reciente.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
