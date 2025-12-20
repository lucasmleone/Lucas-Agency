import React, { useState, useEffect, useCallback } from 'react';
import { CapacityBlock, BlockType } from '../types';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    CheckCircle,
    AlertTriangle,
    X,
    Calendar as CalendarIcon,
    Layers,
    Edit3,
    Trash2
} from 'lucide-react';

interface CalendarViewProps {
    onClose?: () => void;
}

type ViewMode = 'week' | 'month';

interface DayData {
    date: Date;
    dateStr: string;
    isToday: boolean;
    isWeekend: boolean;
    blocks: CapacityBlock[];
    totalHours: number;
    shadowHours: number;
    hasOverlap: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onClose }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [blocks, setBlocks] = useState<CapacityBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlock, setSelectedBlock] = useState<CapacityBlock | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // New block form
    const [newBlock, setNewBlock] = useState({
        title: '',
        blockType: 'manual' as BlockType,
        hours: 2,
        startTime: '',
        notes: ''
    });

    // Calculate date range based on view mode
    const getDateRange = useCallback(() => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        if (viewMode === 'week') {
            // Start from Monday
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            end.setDate(start.getDate() + 6);
        } else {
            // Full month
            start.setDate(1);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }, [currentDate, viewMode]);

    // Fetch blocks
    const fetchBlocks = useCallback(async () => {
        setLoading(true);
        try {
            const { start, end } = getDateRange();
            const response = await fetch(`/api/capacity/blocks?startDate=${start}&endDate=${end}`, {
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setBlocks(data);
        } catch (err) {
            console.error('Error fetching blocks:', err);
        } finally {
            setLoading(false);
        }
    }, [getDateRange]);

    useEffect(() => {
        fetchBlocks();
    }, [fetchBlocks]);

    // Navigate
    const navigate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Generate days for display
    const getDays = (): DayData[] => {
        const days: DayData[] = [];
        const { start, end } = getDateRange();
        const startDate = new Date(start + 'T12:00:00');
        const endDate = new Date(end + 'T12:00:00');
        const today = new Date().toISOString().split('T')[0];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayBlocks = blocks.filter(b => {
                const blockDate = new Date(b.date).toISOString().split('T')[0];
                return blockDate === dateStr;
            });

            const solidBlocks = dayBlocks.filter(b => !b.isShadow);
            const shadowBlocks = dayBlocks.filter(b => b.isShadow);

            days.push({
                date: new Date(d),
                dateStr,
                isToday: dateStr === today,
                isWeekend: d.getDay() === 0 || d.getDay() === 6,
                blocks: dayBlocks,
                totalHours: solidBlocks.reduce((sum, b) => sum + b.hours, 0),
                shadowHours: shadowBlocks.reduce((sum, b) => sum + b.hours, 0),
                hasOverlap: shadowBlocks.length > 1
            });
        }

        return days;
    };

    // Create block
    const handleCreateBlock = async () => {
        if (!selectedDate || !newBlock.title) return;

        try {
            const response = await fetch('/api/capacity/blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...newBlock,
                    date: selectedDate,
                    isShadow: false
                })
            });

            if (!response.ok) throw new Error('Failed to create');

            setShowAddModal(false);
            setNewBlock({ title: '', blockType: 'manual', hours: 2, startTime: '', notes: '' });
            fetchBlocks();
        } catch (err) {
            console.error('Error creating block:', err);
            alert('Error al crear bloque');
        }
    };

    // Complete shift
    const handleCompleteShift = async (blockId: number) => {
        try {
            const response = await fetch(`/api/capacity/complete-shift/${blockId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed');

            setSelectedBlock(null);
            fetchBlocks();
        } catch (err) {
            console.error('Error completing shift:', err);
        }
    };

    // Delete block
    const handleDeleteBlock = async (blockId: number) => {
        if (!confirm('¿Eliminar este bloque?')) return;

        try {
            const response = await fetch(`/api/capacity/blocks/${blockId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed');

            setSelectedBlock(null);
            fetchBlocks();
        } catch (err) {
            console.error('Error deleting block:', err);
        }
    };

    // Format date for header
    const formatHeader = () => {
        if (viewMode === 'week') {
            const days = getDays();
            if (days.length === 0) return '';
            const start = days[0].date;
            const end = days[days.length - 1].date;
            return `${start.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        return currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    };

    const days = getDays();

    // Block color based on type
    const getBlockColor = (block: CapacityBlock) => {
        if (block.isShadow) return 'bg-gray-100 border-gray-300 border-dashed text-gray-500';
        if (block.completed) return 'bg-green-100 border-green-300 text-green-700';
        if (block.blockType === 'meeting') return 'bg-purple-100 border-purple-300 text-purple-700';
        if (block.blockType === 'manual') return 'bg-amber-100 border-amber-300 text-amber-700';
        return 'bg-blue-100 border-blue-300 text-blue-700';
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Calendario de Capacidad</h1>
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('week')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'week'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Semana
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'month'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Mes
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Hoy
                        </button>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => navigate('prev')}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="min-w-[200px] text-center font-medium text-gray-900">
                                {formatHeader()}
                            </span>
                            <button
                                onClick={() => navigate('next')}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
                        <span className="text-gray-600">Producción</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300 border-dashed"></div>
                        <span className="text-gray-600">Propuesta (Shadow)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
                        <span className="text-gray-600">Reunión</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300"></div>
                        <span className="text-gray-600">Manual</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
                        <span className="text-gray-600">Completado</span>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className={`grid gap-4 ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
                        {/* Day Headers */}
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 pb-2">
                                {day}
                            </div>
                        ))}

                        {/* Days */}
                        {days.map(day => (
                            <div
                                key={day.dateStr}
                                className={`min-h-[120px] rounded-xl border-2 p-2 transition-all ${day.isToday
                                    ? 'border-indigo-500 bg-indigo-50/50'
                                    : day.isWeekend
                                        ? 'border-gray-200 bg-gray-100/50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    } ${day.hasOverlap ? 'ring-2 ring-yellow-400' : ''}`}
                            >
                                {/* Day Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold ${day.isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                                        {day.date.getDate()}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {day.totalHours > 0 && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                                {day.totalHours}h
                                            </span>
                                        )}
                                        {day.hasOverlap && (
                                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                                        )}
                                        <button
                                            onClick={() => {
                                                setSelectedDate(day.dateStr);
                                                setShowAddModal(true);
                                            }}
                                            className="p-0.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Plus className="w-3.5 h-3.5 text-gray-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Blocks */}
                                <div className="space-y-1">
                                    {day.blocks.slice(0, viewMode === 'week' ? 4 : 2).map(block => (
                                        <button
                                            key={block.id}
                                            onClick={() => setSelectedBlock(block)}
                                            className={`w-full text-left px-2 py-1 rounded border text-xs truncate ${getBlockColor(block)} hover:opacity-80 transition-opacity`}
                                        >
                                            <div className="flex items-center gap-1">
                                                {block.completed && <CheckCircle className="w-3 h-3" />}
                                                <span className="truncate">{block.title}</span>
                                                <span className="ml-auto text-[10px] opacity-70">{block.hours}h</span>
                                            </div>
                                        </button>
                                    ))}
                                    {day.blocks.length > (viewMode === 'week' ? 4 : 2) && (
                                        <div className="text-xs text-gray-400 text-center">
                                            +{day.blocks.length - (viewMode === 'week' ? 4 : 2)} más
                                        </div>
                                    )}
                                </div>

                                {/* Add button for empty days */}
                                {day.blocks.length === 0 && !day.isWeekend && (
                                    <button
                                        onClick={() => {
                                            setSelectedDate(day.dateStr);
                                            setShowAddModal(true);
                                        }}
                                        className="w-full h-16 flex items-center justify-center text-gray-300 hover:text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Block Detail Modal */}
            {selectedBlock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedBlock(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className={`p-6 rounded-t-2xl ${getBlockColor(selectedBlock)}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">{selectedBlock.title}</h3>
                                    <p className="text-sm opacity-80">
                                        {new Date(selectedBlock.date + 'T12:00:00').toLocaleDateString('es-AR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long'
                                        })}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedBlock(null)} className="p-1 hover:bg-white/20 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <span className="font-bold text-2xl">{selectedBlock.hours}h</span>
                                </div>
                                {selectedBlock.startTime && (
                                    <span className="text-gray-500">@ {selectedBlock.startTime}</span>
                                )}
                                {selectedBlock.isShadow && (
                                    <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                                        Shadow (Propuesta)
                                    </span>
                                )}
                            </div>

                            {selectedBlock.clientName && (
                                <div className="text-sm text-gray-600">
                                    Cliente: <span className="font-medium">{selectedBlock.clientName}</span>
                                </div>
                            )}

                            {selectedBlock.notes && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notas</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedBlock.notes}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t">
                                {!selectedBlock.completed && !selectedBlock.isShadow && (
                                    <button
                                        onClick={() => handleCompleteShift(selectedBlock.id)}
                                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Completar Turno
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteBlock(selectedBlock.id)}
                                    className="p-3 text-red-600 hover:bg-red-50 rounded-xl"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Block Modal */}
            {showAddModal && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">Agregar Bloque</h3>
                                    <p className="text-sm text-gray-500">
                                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long'
                                        })}
                                    </p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    value={newBlock.title}
                                    onChange={e => setNewBlock({ ...newBlock, title: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Ej: Estudiar React, Reunión con cliente..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        value={newBlock.blockType}
                                        onChange={e => setNewBlock({ ...newBlock, blockType: e.target.value as BlockType })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    >
                                        <option value="manual">Manual</option>
                                        <option value="meeting">Reunión</option>
                                        <option value="production">Producción</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Horas</label>
                                    <input
                                        type="number"
                                        value={newBlock.hours}
                                        onChange={e => setNewBlock({ ...newBlock, hours: Number(e.target.value) })}
                                        min={0.5}
                                        max={8}
                                        step={0.5}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    />
                                </div>
                            </div>

                            {newBlock.blockType === 'meeting' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                                    <input
                                        type="time"
                                        value={newBlock.startTime}
                                        onChange={e => setNewBlock({ ...newBlock, startTime: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                                <textarea
                                    value={newBlock.notes}
                                    onChange={e => setNewBlock({ ...newBlock, notes: e.target.value })}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    placeholder="Detalles adicionales..."
                                />
                            </div>

                            <button
                                onClick={handleCreateBlock}
                                disabled={!newBlock.title}
                                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Crear Bloque
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
