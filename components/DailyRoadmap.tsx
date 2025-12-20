import React, { useState, useEffect } from 'react';
import { CapacityBlock, BlockTask, BlockType } from '../types';
import { Layers, Clock, CheckCircle, AlertTriangle, Plus, Trash2, Calendar } from 'lucide-react';

interface DailyRoadmapProps {
    onOpenCalendar?: () => void;
}

export const DailyRoadmap: React.FC<DailyRoadmapProps> = ({ onOpenCalendar }) => {
    const [blocks, setBlocks] = useState<CapacityBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

    // Fetch today's blocks
    const fetchTodayBlocks = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`/api/capacity/blocks?startDate=${today}&endDate=${today}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setBlocks(data);
        } catch (err) {
            console.error('Error fetching today blocks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayBlocks();
    }, []);

    const toggleTask = async (blockId: number, taskId: string, completed: boolean) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block || !block.tasks) return;

        const updatedTasks = block.tasks.map(t =>
            t.id === taskId ? { ...t, completed } : t
        );

        // Optimistic update
        setBlocks(prev => prev.map(b =>
            b.id === blockId ? { ...b, tasks: updatedTasks } : b
        ));

        // Save to backend
        try {
            await fetch(`/api/capacity/blocks/${blockId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: updatedTasks })
            });
        } catch (err) {
            console.error('Error updating task:', err);
            // Revert on error would be ideal here
        }
    };

    const addTask = async (blockId: number, text: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        const newTask: BlockTask = {
            id: crypto.randomUUID(),
            text,
            completed: false
        };

        const updatedTasks = [...(block.tasks || []), newTask];

        setBlocks(prev => prev.map(b =>
            b.id === blockId ? { ...b, tasks: updatedTasks } : b
        ));

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
        if (!block || !block.tasks) return;

        const updatedTasks = block.tasks.filter(t => t.id !== taskId);

        setBlocks(prev => prev.map(b =>
            b.id === blockId ? { ...b, tasks: updatedTasks } : b
        ));

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

    const getBlockColor = (block: CapacityBlock) => {
        if (block.isShadow) return 'bg-gray-50 border-gray-200 border-dashed text-gray-400';
        if (block.completed) return 'bg-green-50 border-green-200 text-green-800';
        if (block.blockType === 'meeting') return 'bg-purple-50 border-purple-200 text-purple-800';
        return 'bg-white border-gray-200 text-gray-800 shadow-sm';
    };

    const totalHours = blocks.filter(b => !b.isShadow).reduce((sum, b) => sum + b.hours, 0);
    const completedTasks = blocks.flatMap(b => b.tasks || []).filter(t => t.completed).length;
    const totalTasks = blocks.flatMap(b => b.tasks || []).length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    if (loading) return <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-600" />
                        Hoja de Ruta Diaria
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{totalHours}h</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Carga Total</div>
                </div>
            </div>

            {/* Progress Bar */}
            {totalTasks > 0 && (
                <div className="h-1 w-full bg-gray-100">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <div className="p-6 space-y-4">
                {blocks.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No hay bloques para hoy</p>
                        <button
                            onClick={onOpenCalendar}
                            className="text-indigo-600 font-bold text-sm hover:underline mt-2"
                        >
                            Ir al Calendario
                        </button>
                    </div>
                ) : (
                    blocks.map((block, index) => (
                        <div
                            key={block.id}
                            className={`rounded-xl border transition-all ${getBlockColor(block)} ${expandedBlock === block.id ? 'ring-2 ring-indigo-500/20' : ''}`}
                        >
                            {/* Block Header */}
                            <div
                                className="p-4 cursor-pointer flex items-center justify-between"
                                onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${block.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}>
                                        {block.completed ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5 text-gray-500" />}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${block.completed ? 'line-through opacity-70' : ''}`}>
                                            {block.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs opacity-70">
                                            <span>{block.hours}h</span>
                                            {block.startTime && <span>• {block.startTime}</span>}
                                            {block.isShadow && <span className="text-amber-600 font-bold">• Propuesta</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    {block.tasks && block.tasks.length > 0 ? (
                                        <span className="text-xs font-medium bg-white/50 px-2 py-1 rounded-full border">
                                            {block.tasks.filter(t => t.completed).length}/{block.tasks.length}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">Sin tareas</span>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Tasks Area */}
                            {expandedBlock === block.id && (
                                <div className="px-4 pb-4 pt-0 border-t border-gray-100/50 mt-2">
                                    <div className="space-y-2 mt-4">
                                        {block.tasks?.map(task => (
                                            <div key={task.id} className="flex items-center gap-3 group">
                                                <input
                                                    type="checkbox"
                                                    checked={task.completed}
                                                    onChange={(e) => toggleTask(block.id, task.id, e.target.checked)}
                                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                />
                                                <span className={`flex-1 text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                    {task.text}
                                                </span>
                                                <button
                                                    onClick={() => deleteTask(block.id, task.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* New Task Input */}
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="w-4 h-4 flex items-center justify-center">
                                                <Plus className="w-3.5 h-3.5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Agregar tarea..."
                                                className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 placeholder-gray-400"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        addTask(block.id, e.currentTarget.value.trim());
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
