import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProjectAddOn } from '../types';
import { Calendar, Clock, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { calculateTotalHours, WORK_CONFIG, formatHours } from '../utils/timeConfig';

interface DeliveryProjectionProps {
    project: Project;
    addons: ProjectAddOn[];
    onUpdate: (updates: Partial<Project>) => Promise<void>;
}

export const DeliveryProjection: React.FC<DeliveryProjectionProps> = ({
    project,
    addons,
    onUpdate
}) => {
    const [dailyDedication, setDailyDedication] = useState(project.dailyDedication || WORK_CONFIG.DEFAULT_DAILY_HOURS);
    const [estimatedDate, setEstimatedDate] = useState<string | null>(null);
    const [workDays, setWorkDays] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate hours based on plan and addons
    const hoursData = calculateTotalHours(
        project.planType,
        addons,
        project.customHours
    );

    // Fetch estimated delivery date from backend
    const fetchDeliveryDate = useCallback(async () => {
        if (hoursData.bufferedHours <= 0) {
            setEstimatedDate(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/capacity/calculate-delivery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    totalHours: hoursData.bufferedHours,
                    dailyDedication,
                    startDate: new Date().toISOString().split('T')[0]
                })
            });

            if (!response.ok) throw new Error('Failed to calculate');

            const data = await response.json();
            setEstimatedDate(data.estimatedDate);
            setWorkDays(data.workDays);
        } catch (err) {
            console.error('Error calculating delivery date:', err);
            setError('Error al calcular');
            // Fallback calculation
            const fallbackDays = Math.ceil(hoursData.bufferedHours / dailyDedication);
            const fallbackDate = new Date();
            let addedDays = 0;
            while (addedDays < fallbackDays) {
                fallbackDate.setDate(fallbackDate.getDate() + 1);
                const day = fallbackDate.getDay();
                if (day !== 0 && day !== 6) addedDays++;
            }
            setEstimatedDate(fallbackDate.toISOString().split('T')[0]);
            setWorkDays(fallbackDays);
        } finally {
            setLoading(false);
        }
    }, [hoursData.bufferedHours, dailyDedication]);

    useEffect(() => {
        fetchDeliveryDate();
    }, [fetchDeliveryDate]);

    // Handle slider change with debounce
    const handleDedicationChange = async (value: number) => {
        setDailyDedication(value);

        // Save to project after a delay
        try {
            await onUpdate({ dailyDedication: value });
        } catch (err) {
            console.error('Error saving dedication:', err);
        }
    };

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Don't show if plan is custom without hours
    if (project.planType === 'Personalizado' && !project.customHours && !project.isHourlyQuote) {
        return null;
    }

    // Progress calculation
    const progress = project.hoursCompleted && hoursData.bufferedHours > 0
        ? Math.min(100, Math.round((project.hoursCompleted / hoursData.bufferedHours) * 100))
        : 0;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-indigo-600 text-white">
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Proyección de Entrega</h3>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Hours Breakdown */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                        <div className="text-sm text-gray-500 mb-1">Horas Base</div>
                        <div className="text-2xl font-bold text-gray-900">{hoursData.rawHours}h</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                        <div className="text-sm text-gray-500 mb-1">+ Buffer (30%)</div>
                        <div className="text-2xl font-bold text-indigo-600">{hoursData.bufferedHours}h</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                        <div className="text-sm text-gray-500 mb-1">Días Laborales</div>
                        <div className="text-2xl font-bold text-gray-900">{workDays}</div>
                    </div>
                </div>

                {/* Buffer Breakdown */}
                <div className="bg-white rounded-lg p-4 border border-indigo-100">
                    <div className="text-sm font-medium text-gray-700 mb-2">Desglose del Buffer:</div>
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                            <span>Técnico: {hoursData.breakdown.technical}h (20%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            <span>Colchón Venta: {hoursData.breakdown.admin}h (10%)</span>
                        </div>
                    </div>
                </div>

                {/* Daily Dedication Slider */}
                <div className="bg-white rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="font-medium text-gray-900">Dedicación Diaria Máxima</div>
                            <div className="text-sm text-gray-500">
                                ¿Cuántas horas al día le vas a dedicar a ESTE proyecto?
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-indigo-600">{dailyDedication}h</div>
                    </div>
                    <input
                        type="range"
                        min={WORK_CONFIG.MIN_DAILY_HOURS}
                        max={WORK_CONFIG.MAX_DAILY_HOURS}
                        step={0.5}
                        value={dailyDedication}
                        onChange={(e) => handleDedicationChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{WORK_CONFIG.MIN_DAILY_HOURS}h</span>
                        <span>{WORK_CONFIG.MAX_DAILY_HOURS}h</span>
                    </div>
                </div>

                {/* Estimated Date - The Promise */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="text-indigo-200 text-sm mb-1">Estimación de Entrega</div>
                            {loading ? (
                                <div className="text-xl font-bold">Calculando...</div>
                            ) : estimatedDate ? (
                                <>
                                    <div className="text-2xl font-bold capitalize">
                                        {formatDate(estimatedDate)}
                                    </div>
                                    {project.confirmedDeliveryDate && (
                                        <div className="mt-2 flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-1.5 w-fit">
                                            <Clock className="w-4 h-4" />
                                            Fecha confirmada: {formatDate(project.confirmedDeliveryDate)}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-xl">No disponible</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="flex items-start gap-2 text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>
                        Fecha calculada con tu disponibilidad actual.
                        Se <strong>congela únicamente al confirmar el pago</strong> del anticipo.
                    </span>
                </div>

                {/* Progress (if project has started) */}
                {project.hoursCompleted && project.hoursCompleted > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">Progreso</span>
                            <span className="text-sm text-gray-500">
                                {formatHours(project.hoursCompleted)} / {formatHours(hoursData.bufferedHours)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="text-right text-sm text-gray-500 mt-1">{progress}% completado</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryProjection;
