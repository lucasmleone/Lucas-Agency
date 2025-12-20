import React, { useState, useEffect, useCallback } from 'react';
import { CapacityBlock, BlockType, Project } from '../types';
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
    Trash2,
    Eraser // New icon for bulk delete
} from 'lucide-react';
import { WeekBoard } from './Calendar/WeekBoard';

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
    const [showDayDetail, setShowDayDetail] = useState(false);
    const [showDeleteOptions, setShowDeleteOptions] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const [projects, setProjects] = useState<Project[]>([]);
    const [inboxBlocks, setInboxBlocks] = useState<CapacityBlock[]>([]);

    // New block form
    const [newBlock, setNewBlock] = useState({
        title: '',
        blockType: 'manual' as BlockType,
        hours: 2,
        startTime: '',
        notes: '',
        projectId: '' // Optional linkage
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
        fetchProjects();
        fetchInbox();
    }, [fetchBlocks]);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        } catch (err) {
            console.error('Failed to fetch projects', err);
        }
    };

    // Fetch inbox (unscheduled blocks)
    const fetchInbox = async () => {
        try {
            const response = await fetch('/api/capacity/inbox', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setInboxBlocks(data);
            }
        } catch (err) {
            console.error('Failed to fetch inbox', err);
        }
    };

    // Inbox handlers
    const handleInboxAdd = async (title: string, hours: number) => {
        try {
            await fetch('/api/capacity/inbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title, hours, blockType: 'manual' })
            });
            fetchInbox();
        } catch (err) {
            console.error('Failed to add inbox item', err);
        }
    };

    const handleInboxDelete = async (blockId: number) => {
        try {
            await fetch(`/api/capacity/blocks/${blockId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            fetchInbox();
        } catch (err) {
            console.error('Failed to delete inbox item', err);
        }
    };

    const handleScheduleInboxBlock = async (blockId: number, dateStr: string) => {
        try {
            await fetch(`/api/capacity/blocks/${blockId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ date: dateStr })
            });
            fetchBlocks();
            fetchInbox();
        } catch (err) {
            console.error('Failed to schedule inbox block', err);
        }
    };

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

        // Validation: Production blocks must have a project
        if (newBlock.blockType === 'production' && !newBlock.projectId) {
            alert('Los bloques de producción deben estar asociados a un proyecto.');
            return;
        }

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

    // Delete future blocks
    const handleDeleteFuture = async (blockId: number, projectId: string, date: string) => {
        if (!confirm('¿Eliminar este bloque Y TODOS LOS FUTUROS de este proyecto?\n\nEsta acción borrará toda la planificación futura desde esta fecha.')) return;

        try {
            const response = await fetch('/api/capacity/future-blocks', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ projectId, fromDate: date })
            });

            if (!response.ok) throw new Error('Failed');

            setSelectedBlock(null);
            fetchBlocks();
            alert('Planificación futura eliminada correctamente');
        } catch (err) {
            console.error('Error deleting future blocks:', err);
            alert('Error al eliminar planificación');
        }
    };

    // Task Management Handlers
    const toggleTask = async (blockId: number, taskId: string, completed: boolean) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        // Optimistic update for local state
        const updatedTasks = (block.tasks || []).map(t =>
            t.id === taskId ? { ...t, completed } : t
        );

        // Update both main blocks list and selected block
        const updateBlockState = (b: CapacityBlock) =>
            b.id === blockId ? { ...b, tasks: updatedTasks } : b;

        setBlocks(prev => prev.map(updateBlockState));
        if (selectedBlock && selectedBlock.id === blockId) {
            setSelectedBlock(prev => prev ? { ...prev, tasks: updatedTasks } : null);
        }

        try {
            await fetch(`/api/capacity/blocks/${blockId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: updatedTasks })
            });
        } catch (err) {
            console.error('Error updating task:', err);
        }
    };

    const addTask = async (blockId: number, text: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        const newTask = {
            id: crypto.randomUUID(),
            text,
            completed: false
        };

        const updatedTasks = [...(block.tasks || []), newTask];

        // Update both main blocks list and selected block
        const updateBlockState = (b: CapacityBlock) =>
            b.id === blockId ? { ...b, tasks: updatedTasks } : b;

        setBlocks(prev => prev.map(updateBlockState));
        if (selectedBlock && selectedBlock.id === blockId) {
            setSelectedBlock(prev => prev ? { ...prev, tasks: updatedTasks } : null);
        }

        try {
            await fetch(`/api/capacity/blocks/${blockId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: updatedTasks })
            });
        } catch (err) {
            console.error('Error adding task:', err);
        }
    };

    const deleteTask = async (blockId: number, taskId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        const updatedTasks = (block.tasks || []).filter(t => t.id !== taskId);

        // Update both main blocks list and selected block
        const updateBlockState = (b: CapacityBlock) =>
            b.id === blockId ? { ...b, tasks: updatedTasks } : b;

        setBlocks(prev => prev.map(updateBlockState));
        if (selectedBlock && selectedBlock.id === blockId) {
            setSelectedBlock(prev => prev ? { ...prev, tasks: updatedTasks } : null);
        }

        try {
            await fetch(`/api/capacity/blocks/${blockId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: updatedTasks })
            });
        } catch (err) {
            console.error('Error deleting task:', err);
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

    // --- NEW HANDLERS FOR WEEK BOARD ---

    const handleMoveToNextDay = async (blockId: number) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;
        const current = new Date(block.date);
        current.setDate(current.getDate() + 1);
        const nextDateStr = current.toISOString().split('T')[0];

        try {
            await fetch(`/api/capacity/blocks/${blockId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: nextDateStr })
            });
            fetchBlocks();
        } catch (err) {
            console.error('Failed to move block', err);
        }
    };

    const handleDuplicateBlock = async (block: CapacityBlock) => {
        try {
            await fetch('/api/capacity/blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: block.title,
                    blockType: block.blockType,
                    date: block.date, // Same day duplicate
                    hours: block.hours,
                    startTime: block.startTime,
                    projectId: block.projectId,
                    isShadow: false
                })
            });
            fetchBlocks();
        } catch (err) {
            console.error('Failed to duplicate block', err);
        }
    };

    const handleSmartAdd = (dateStr: string, project?: Project) => {
        if (project) {
            createInstantBlock(dateStr, project);
        } else {
            setSelectedDate(dateStr);
            setNewBlock({ title: '', blockType: 'manual', hours: 2, startTime: '', notes: '', projectId: '' });
            setShowAddModal(true);
        }
    };

    const createInstantBlock = async (dateStr: string, project: Project) => {
        try {
            await fetch('/api/capacity/blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Trabajo en: ${project.clientName}`,
                    blockType: 'production',
                    hours: 2,
                    date: dateStr,
                    startTime: '',
                    projectId: project.id,
                    isShadow: false
                })
            });
            fetchBlocks();
        } catch (err) {
            console.error('Instant Add Failed', err);
        }
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
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-indigo-600" />
                        <h1 className="text-2xl font-bold text-gray-900">
                            Planificación {viewMode === 'week' ? 'Semanal' : 'Mensual'}
                        </h1>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-4">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${viewMode === 'week'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${viewMode === 'month'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Mes
                        </button>
                    </div>

                    <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-2">
                        <button
                            onClick={() => navigate('prev')}
                            className="p-1 hover:bg-white rounded shadow-sm transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-3 py-1 text-sm font-medium hover:bg-white rounded transition-all"
                        >
                            {viewMode === 'week' ? 'Esta Semana' : 'Este Mes'}
                        </button>
                        <button
                            onClick={() => navigate('next')}
                            className="p-1 hover:bg-white rounded shadow-sm transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="text-sm font-medium text-gray-500 ml-2">
                        {viewMode === 'week' && days.length > 0 && (
                            `${new Date(days[0].date).toLocaleDateString('es-AR', { month: 'long', day: 'numeric' })} - ${new Date(days[days.length - 1].date).toLocaleDateString('es-AR', { month: 'long', day: 'numeric' })}`
                        )}
                        {viewMode === 'month' && (
                            currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Weekly Stats Summary */}
                    {viewMode === 'week' && days.length > 0 && (() => {
                        const totalHours = days.reduce((sum, d) => sum + d.totalHours, 0);
                        const maxWeekHours = days.length * 8;
                        const utilizationPct = Math.round((totalHours / maxWeekHours) * 100);
                        const overloadedDays = days.filter(d => d.totalHours > 8).length;

                        return (
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
                                <div className={`text-sm font-bold ${utilizationPct > 100 ? 'text-red-600' :
                                        utilizationPct >= 75 ? 'text-green-600' :
                                            utilizationPct >= 50 ? 'text-yellow-600' : 'text-gray-500'
                                    }`}>
                                    {totalHours.toFixed(0)}h / {maxWeekHours}h
                                </div>
                                <div className={`text-xs px-1.5 py-0.5 rounded ${utilizationPct > 100 ? 'bg-red-100 text-red-700' :
                                        utilizationPct >= 75 ? 'bg-green-100 text-green-700' :
                                            utilizationPct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {utilizationPct}%
                                </div>
                                {overloadedDays > 0 && (
                                    <div className="text-xs text-red-600 font-medium">
                                        ⚠️ {overloadedDays} día{overloadedDays > 1 ? 's' : ''} sobrecargado{overloadedDays > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> Producción
                        <div className="w-2 h-2 rounded-full bg-purple-500 ml-2"></div> Reunión
                        <div className="w-2 h-2 rounded-full bg-amber-500 ml-2"></div> Manual
                    </div>
                </div>
            </div>

            {/* Main Week Board */}
            <div className="flex-1 overflow-hidden">
                <WeekBoard
                    days={days}
                    projects={projects}
                    inboxBlocks={inboxBlocks}
                    onAddBlock={handleSmartAdd}
                    onEditBlock={(block) => { setSelectedBlock(block); setShowDayDetail(true); }}
                    onDeleteBlock={(id) => { setSelectedBlock(blocks.find(b => b.id === id) || null); setShowDeleteOptions(true); }}
                    onMoveToNextDay={handleMoveToNextDay}
                    onDuplicateBlock={handleDuplicateBlock}
                    onScheduleInboxBlock={handleScheduleInboxBlock}
                    onInboxAdd={handleInboxAdd}
                    onInboxDelete={handleInboxDelete}
                    onRefreshInbox={fetchInbox}
                />
            </div>

            {/* ---------------- MODALS ---------------- */}

            {/* DELETE MODAL */}
            {showDeleteOptions && selectedBlock && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDeleteOptions(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Bloque</h3>

                            <div className="grid grid-cols-1 gap-3 w-full mt-4">
                                <button
                                    onClick={() => { handleDeleteBlock(selectedBlock.id); setShowDeleteOptions(false); }}
                                    className="w-full py-3 bg-white border border-gray-300 shadow-sm rounded-xl font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                                >
                                    Solo este bloque
                                </button>
                                {selectedBlock.projectId && (
                                    <button
                                        onClick={() => { handleDeleteFuture(selectedBlock.id, selectedBlock.projectId!, new Date(selectedBlock.date).toISOString().split('T')[0]); setShowDeleteOptions(false); }}
                                        className="w-full py-3 bg-red-600 shadow-sm rounded-xl font-medium text-white hover:bg-red-700 flex items-center justify-center gap-2"
                                    >
                                        <Eraser className="w-4 h-4" />
                                        Este y futuras
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setShowDeleteOptions(false)} className="mt-4 text-sm text-gray-500 hover:text-gray-800">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD BLOCK MODAL */}
            {showAddModal && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b flex justify-between">
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
                            <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Título</label>
                                <input
                                    value={newBlock.title}
                                    onChange={e => setNewBlock({ ...newBlock, title: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo</label>
                                    <select value={newBlock.blockType} onChange={e => setNewBlock({ ...newBlock, blockType: e.target.value as BlockType })} className="w-full border rounded-lg px-3 py-2">
                                        <option value="manual">Manual</option>
                                        <option value="production">Producción</option>
                                        <option value="meeting">Reunión</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Horas</label>
                                    <input type="number" value={newBlock.hours} onChange={e => setNewBlock({ ...newBlock, hours: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" step={0.5} />
                                </div>
                            </div>

                            {newBlock.blockType === 'production' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Proyecto</label>
                                    <select
                                        value={newBlock.projectId}
                                        onChange={e => {
                                            const pid = e.target.value;
                                            const p = projects.find(pr => pr.id === pid);
                                            setNewBlock({
                                                ...newBlock,
                                                projectId: pid,
                                                title: p ? `Trabajo en: ${p.clientName}` : newBlock.title
                                            });
                                        }}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {projects.filter(p => !['7. Entregado', '6. Cancelado'].includes(p.status)).map(p => (
                                            <option key={p.id} value={p.id}>{p.clientName}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Notas</label>
                                <textarea value={newBlock.notes} onChange={e => setNewBlock({ ...newBlock, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} />
                            </div>

                            <button onClick={handleCreateBlock} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-4">Crear Bloque</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL / EDIT MODAL */}
            {showDayDetail && selectedBlock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDayDetail(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className={`p-6 rounded-t-2xl ${getBlockColor(selectedBlock)}`}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">{selectedBlock.title}</h3>
                                <button onClick={() => setShowDayDetail(false)} className="p-1 hover:bg-white/20 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <span className="font-bold text-2xl">{selectedBlock.hours}h</span>
                                </div>
                                {selectedBlock.clientName && (
                                    <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                        {selectedBlock.clientName}
                                    </div>
                                )}
                            </div>

                            {selectedBlock.notes && (
                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-gray-600">{selectedBlock.notes}</p>
                                </div>
                            )}

                            <div className="border-t pt-4 mt-2">
                                <h4 className="font-bold text-sm mb-2">Acciones</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setShowDayDetail(false)}
                                        className="w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDayDetail(false);
                                            setShowDeleteOptions(true);
                                        }}
                                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;

