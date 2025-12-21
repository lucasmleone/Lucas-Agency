import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProjectAddOn } from '../types';
import { Calendar, Clock, TrendingUp, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
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

    // Buffer percentage (customizable, default 30%)
    const [bufferPercent, setBufferPercent] = useState(project.bufferPercentage ?? 30);

    // Delivery acceleration tracking
    const [scheduledHours, setScheduledHours] = useState<number>(0);
    const [acceleratedDate, setAcceleratedDate] = useState<string | null>(null);
    const [daysAdvanced, setDaysAdvanced] = useState<number>(0);

    // Calculate hours based on plan, addons, and custom buffer
    const hoursData = calculateTotalHours(
        project.planType,
        addons,
        project.customHours,
        bufferPercent
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

    // Generate shadow blocks for calendar
    const [blocksGenerated, setBlocksGenerated] = useState(false);
    const [generatingBlocks, setGeneratingBlocks] = useState(false);

    // Check if blocks already exist for this project and calculate acceleration
    useEffect(() => {
        const checkExistingBlocks = async () => {
            try {
                const response = await fetch(`/api/capacity/project/${project.id}/blocks`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.blocks && data.blocks.length > 0) {
                        setBlocksGenerated(true);

                        // Get production blocks (not shadow) and sort by date
                        const productionBlocks = data.blocks
                            .filter((b: any) => !b.isShadow && b.blockType === 'production')
                            .map((b: any) => ({
                                ...b,
                                dateStr: typeof b.date === 'string' ? b.date.split('T')[0] : new Date(b.date).toISOString().split('T')[0],
                                hours: b.hours || b.plannedHours || 0
                            }))
                            .sort((a: any, b: any) => a.dateStr.localeCompare(b.dateStr));

                        // Calculate total scheduled hours
                        const totalScheduled = productionBlocks.reduce((sum: number, b: any) => sum + b.hours, 0);
                        setScheduledHours(totalScheduled);

                        // Calculate base delivery date = last block date (without acceleration)
                        if (productionBlocks.length > 0) {
                            const lastBlockDate = productionBlocks[productionBlocks.length - 1].dateStr;

                            // Update estimatedDate to use actual last block (override backend calculation)
                            setEstimatedDate(lastBlockDate);

                            // Calculate if there are EXTRA hours beyond what's needed
                            const neededHours = hoursData.bufferedHours;
                            const extraHours = totalScheduled - neededHours;

                            if (extraHours > 0) {
                                // Work backwards: remove hours from end until extraHours consumed
                                let hoursToRemove = extraHours;
                                let newLastBlockIndex = productionBlocks.length - 1;

                                for (let i = productionBlocks.length - 1; i >= 0 && hoursToRemove > 0; i--) {
                                    const blockHours = productionBlocks[i].hours;
                                    if (hoursToRemove >= blockHours) {
                                        // Entire block is eliminated
                                        hoursToRemove -= blockHours;
                                        newLastBlockIndex = i - 1;
                                    } else {
                                        // Partial block - still ends on this day
                                        newLastBlockIndex = i;
                                        hoursToRemove = 0;
                                    }
                                }

                                if (newLastBlockIndex >= 0 && newLastBlockIndex < productionBlocks.length - 1) {
                                    const acceleratedDateStr = productionBlocks[newLastBlockIndex].dateStr;

                                    // Calculate days advanced
                                    const original = new Date(lastBlockDate + 'T12:00:00');
                                    const accelerated = new Date(acceleratedDateStr + 'T12:00:00');
                                    const diffMs = original.getTime() - accelerated.getTime();
                                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                                    if (diffDays > 0) {
                                        setAcceleratedDate(acceleratedDateStr);
                                        setDaysAdvanced(diffDays);
                                        // Persist to DB for Cartera display
                                        fetch(`/api/projects/${project.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            credentials: 'include',
                                            body: JSON.stringify({ daysAdvanced: diffDays })
                                        }).catch(() => { });
                                    } else {
                                        setAcceleratedDate(null);
                                        setDaysAdvanced(0);
                                        fetch(`/api/projects/${project.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            credentials: 'include',
                                            body: JSON.stringify({ daysAdvanced: 0 })
                                        }).catch(() => { });
                                    }
                                } else {
                                    setAcceleratedDate(null);
                                    setDaysAdvanced(0);
                                }
                            } else {
                                setAcceleratedDate(null);
                                setDaysAdvanced(0);
                            }
                        }
                    }
                }
            } catch (err) {
                // Ignore errors - just means no blocks yet
            }
        };
        checkExistingBlocks();
    }, [project.id, estimatedDate, hoursData.bufferedHours, dailyDedication]);

    const generateBlocks = async (forceRegenerate: boolean = false) => {
        if (!hoursData.bufferedHours || hoursData.bufferedHours <= 0) return;

        // If already generated and not forcing, ask for confirmation
        if (blocksGenerated && !forceRegenerate) {
            const confirm = window.confirm(
                '⚠️ Ya existen bloques para este proyecto.\n\n' +
                '¿Deseas regenerar los bloques? Esto eliminará los bloques actuales y creará nuevos.'
            );
            if (!confirm) return;
        }

        setGeneratingBlocks(true);
        try {
            const response = await fetch('/api/capacity/generate-project-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    projectId: project.id,
                    totalHours: hoursData.bufferedHours,
                    dailyDedication,
                    startDate: new Date().toISOString().split('T')[0],
                    isShadow: true, // Shadow because not confirmed yet
                    deleteExisting: true // Always delete existing before creating new
                })
            });

            if (response.ok) {
                setBlocksGenerated(true);
                // Update project with estimated hours and quoted date
                if (estimatedDate) {
                    await onUpdate({
                        estimatedHours: hoursData.bufferedHours,
                        quotedDeliveryDate: estimatedDate,
                        dailyDedication
                    });
                }
            }
        } catch (err) {
            console.error('Error generating blocks:', err);
        } finally {
            setGeneratingBlocks(false);
        }
    };

    // Handle slider change with debounce
    const handleDedicationChange = async (value: number) => {
        setDailyDedication(value);
        setBlocksGenerated(false); // Reset so user can regenerate

        // Save to project after a delay
        try {
            await onUpdate({ dailyDedication: value });
        } catch (err) {
            console.error('Error saving dedication:', err);
        }
    };

    // Handle buffer percentage change
    const handleBufferChange = async (value: number) => {
        setBufferPercent(value);
        setBlocksGenerated(false); // Reset so user can regenerate

        // Save to project
        try {
            await onUpdate({ bufferPercentage: value });
        } catch (err) {
            console.error('Error saving buffer:', err);
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

    // Only hide if there are no hours to project AND it is not manually forced to show?
    // User requested "se ropio toda la ui... quedo afuera toda esa seccion".
    // Better to render the container with "Sin estimación" than hiding it.

    // Progress calculation
    const progress = project.hoursCompleted && hoursData.bufferedHours > 0
        ? Math.min(100, Math.round((project.hoursCompleted / hoursData.bufferedHours) * 100))
        : 0;

    const hasHours = hoursData.bufferedHours > 0;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 overflow-hidden">
            {/* Header - Compact */}
            <div className="px-4 py-3 bg-indigo-600 text-white">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <h3 className="font-bold text-sm">Proyección de Entrega</h3>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {!hasHours ? (
                    <div className="text-center py-4 text-gray-400 text-xs">
                        <p>Sin horas para proyectar.</p>
                        <p>Selecciona un plan o añade horas.</p>
                    </div>
                ) : (
                    <>
                        {/* Hours Breakdown - Compact Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white rounded-lg p-2 border border-indigo-100 text-center">
                                <div className="text-xs text-gray-500">Horas Base</div>
                                <div className="text-lg font-bold text-gray-900">{hoursData.rawHours}h</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-indigo-100 text-center">
                                <div className="text-xs text-gray-500">+ Buffer</div>
                                <div className="text-lg font-bold text-indigo-600">{hoursData.bufferedHours}h</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-indigo-100 text-center">
                                <div className="text-xs text-gray-500">Días</div>
                                <div className="text-lg font-bold text-gray-900">{workDays}</div>
                            </div>
                        </div>

                        {/* Buffer Breakdown - With Slider */}
                        <div className="bg-white rounded-lg p-3 border border-indigo-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-medium text-gray-600">Buffer</div>
                                <div className="text-sm font-bold text-indigo-600">{bufferPercent}%</div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={50}
                                step={5}
                                value={bufferPercent}
                                onChange={(e) => handleBufferChange(parseInt(e.target.value))}
                                className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>0%</span>
                                <span>50%</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-2">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                    Técnico: {hoursData.breakdown.technical}h
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                    Venta: {hoursData.breakdown.admin}h
                                </span>
                            </div>
                        </div>

                        {/* Daily Dedication Slider - Compact */}
                        <div className="bg-white rounded-lg p-3 border border-indigo-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-gray-900">Dedicación Máx/Día</div>
                                <div className="text-lg font-bold text-indigo-600">{dailyDedication}h</div>
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

                        {/* Estimated Date - Compact */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
                            <div className="text-indigo-200 text-xs mb-1">Estimación de Entrega</div>
                            {loading ? (
                                <div className="text-lg font-bold">Calculando...</div>
                            ) : estimatedDate ? (
                                <div className="text-lg font-bold capitalize">
                                    {formatDate(estimatedDate)}
                                </div>
                            ) : (
                                <div className="text-base">No disponible</div>
                            )}
                            {project.confirmedDeliveryDate && (
                                <div className="mt-2 text-xs text-indigo-200">
                                    ✓ Confirmada: {formatDate(project.confirmedDeliveryDate)}
                                </div>
                            )}
                        </div>

                        {/* Delivery Acceleration - Show when extra hours scheduled */}
                        {daysAdvanced > 0 && acceleratedDate && (
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-sm font-bold">¡Entrega Acelerada!</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-green-100">Fecha original:</span>
                                        <span className="line-through text-green-200">{formatDate(estimatedDate!)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-100">Nueva fecha:</span>
                                        <span className="font-bold">{formatDate(acceleratedDate)}</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-green-400 text-center">
                                        <span className="text-lg font-bold">✅ Adelantas {daysAdvanced} día{daysAdvanced > 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-green-200">
                                    Horas programadas: {scheduledHours}h de {hoursData.bufferedHours}h
                                </div>
                            </div>
                        )}

                        {/* Disclaimer - Compact */}
                        <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-2">
                            <span className="text-amber-500">⚠</span> Se congela al confirmar el pago del anticipo.
                        </div>

                        {/* Generate Blocks Button */}
                        {estimatedDate && hoursData.bufferedHours > 0 && (
                            <button
                                onClick={() => generateBlocks()}
                                disabled={generatingBlocks}
                                className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${blocksGenerated
                                    ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                            >
                                {generatingBlocks ? (
                                    'Generando...'
                                ) : blocksGenerated ? (
                                    <>
                                        <Calendar className="w-4 h-4" />
                                        ✓ Reservado • Click para regenerar
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="w-4 h-4" />
                                        Reservar en Calendario (Propuesta)
                                    </>
                                )}
                            </button>
                        )}

                        {/* Progress (if project has started) */}
                        {(project.hoursCompleted || 0) > 0 && (
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
                    </>
                )}
            </div>
        </div>
    );
};

export default DeliveryProjection;
