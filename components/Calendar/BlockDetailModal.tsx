import React, { useState, useEffect } from 'react';
import { CapacityBlock } from '../../types';
import { X, Clock, Check, Plus, Trash2, Save, StickyNote, ListTodo } from 'lucide-react';

interface Task {
    id: string;
    text: string;
    completed: boolean;
}

interface BlockDetailModalProps {
    block: CapacityBlock;
    onClose: () => void;
    onDelete: () => void;
    onSave: (updates: { notes?: string; tasks?: Task[] }) => void;
}

export const BlockDetailModal: React.FC<BlockDetailModalProps> = ({
    block,
    onClose,
    onDelete,
    onSave
}) => {
    const [notes, setNotes] = useState(block.notes || '');
    const [tasks, setTasks] = useState<Task[]>(() => {
        if (Array.isArray(block.tasks)) {
            return block.tasks;
        }
        return [];
    });
    const [newTaskText, setNewTaskText] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const originalNotes = block.notes || '';
        const originalTasks = Array.isArray(block.tasks) ? block.tasks : [];

        const notesChanged = notes !== originalNotes;
        const tasksChanged = JSON.stringify(tasks) !== JSON.stringify(originalTasks);

        setHasChanges(notesChanged || tasksChanged);
    }, [notes, tasks, block.notes, block.tasks]);

    const handleAddTask = () => {
        if (!newTaskText.trim()) return;
        const newTask: Task = {
            id: Date.now().toString(),
            text: newTaskText.trim(),
            completed: false
        };
        setTasks([...tasks, newTask]);
        setNewTaskText('');
    };

    const toggleTask = (taskId: string) => {
        setTasks(tasks.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
        ));
    };

    const removeTask = (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const handleSave = () => {
        onSave({ notes, tasks });
    };

    // Block color based on type
    const getColors = () => {
        if (block.completed) return 'bg-green-100 border-green-200';
        if (block.blockType === 'production') return 'bg-blue-100 border-blue-200';
        if (block.blockType === 'meeting') return 'bg-purple-100 border-purple-200';
        return 'bg-amber-100 border-amber-200';
    };

    const completedCount = tasks.filter(t => t.completed).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={`p-5 ${getColors()} border-b`}>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{block.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-medium">{block.hours}h</span>
                                </div>
                                {block.clientName && (
                                    <span className="text-sm text-gray-500">• {block.clientName}</span>
                                )}
                                {block.completed && (
                                    <span className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                        <Check className="w-3 h-3" /> Completado
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Tasks Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="flex items-center gap-2 font-bold text-gray-800">
                                <ListTodo className="w-4 h-4 text-indigo-500" />
                                Tareas
                                {tasks.length > 0 && (
                                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {completedCount}/{tasks.length}
                                    </span>
                                )}
                            </h4>
                        </div>

                        {/* Add Task Input */}
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newTaskText}
                                onChange={e => setNewTaskText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                                placeholder="Nueva tarea..."
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                onClick={handleAddTask}
                                disabled={!newTaskText.trim()}
                                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Task List */}
                        <div className="space-y-2">
                            {tasks.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    Sin tareas. Agrega una para trackear progreso.
                                </p>
                            ) : (
                                tasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${task.completed
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-gray-50 border-gray-200 hover:border-indigo-200'
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleTask(task.id)}
                                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.completed
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-gray-300 hover:border-indigo-500'
                                                }`}
                                        >
                                            {task.completed && <Check className="w-3 h-3" />}
                                        </button>
                                        <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                            {task.text}
                                        </span>
                                        <button
                                            onClick={() => removeTask(task.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                            <StickyNote className="w-4 h-4 text-amber-500" />
                            Notas
                            <span className="text-xs font-normal text-gray-400">(en qué me quedé, qué sigue)</span>
                        </h4>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Escribe notas sobre este bloque de trabajo..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            rows={4}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t bg-gray-50 flex gap-3">
                    <button
                        onClick={onDelete}
                        className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                    >
                        Eliminar
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${hasChanges
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <Save className="w-4 h-4" />
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};
