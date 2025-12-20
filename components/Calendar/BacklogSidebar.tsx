import React, { useState, useEffect, useCallback } from 'react';
import { Project, CapacityBlock } from '../../types';
import { Search, Briefcase, ChevronRight, ChevronLeft, PlusCircle, Inbox, Plus, Clock, GripVertical, Trash2 } from 'lucide-react';

interface BacklogSidebarProps {
    projects: Project[];
    inboxBlocks: CapacityBlock[];
    isOpen: boolean;
    onToggle: () => void;
    onProjectSelect: (project: Project) => void;
    onInboxAdd: (title: string, hours: number) => void;
    onInboxDelete: (blockId: number) => void;
    onRefreshInbox: () => void;
}

export const BacklogSidebar: React.FC<BacklogSidebarProps> = ({
    projects,
    inboxBlocks,
    isOpen,
    onToggle,
    onProjectSelect,
    onInboxAdd,
    onInboxDelete,
    onRefreshInbox
}) => {
    const [search, setSearch] = useState('');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskHours, setNewTaskHours] = useState(2);
    const [activeTab, setActiveTab] = useState<'inbox' | 'projects'>('inbox');

    const filteredProjects = projects.filter(p =>
        p.status !== '7. Entregado' &&
        p.status !== '6. Cancelado' &&
        p.clientName.toLowerCase().includes(search.toLowerCase())
    );

    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        onInboxAdd(newTaskTitle.trim(), newTaskHours);
        setNewTaskTitle('');
        setNewTaskHours(2);
    };

    return (
        <>
            {/* Toggle Button - Always visible */}
            <button
                onClick={onToggle}
                className="fixed right-0 top-24 bg-indigo-600 text-white border-none shadow-lg rounded-l-lg px-2 py-3 z-30 hover:bg-indigo-700 transition-colors"
                title={isOpen ? "Cerrar Panel" : "Abrir Inbox"}
            >
                {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className={`transition-all duration-300 ease-in-out border-l bg-white flex flex-col h-full ${isOpen ? 'w-80' : 'w-0 border-none overflow-hidden'}`}>
                {/* Content Container */}
                <div className={`flex flex-col h-full overflow-hidden ${!isOpen && 'hidden'}`}>
                    {/* Tab Header */}
                    <div className="flex border-b bg-gray-50">
                        <button
                            onClick={() => setActiveTab('inbox')}
                            className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'inbox'
                                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Inbox className="w-4 h-4" />
                            Inbox
                            {inboxBlocks.length > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">
                                    {inboxBlocks.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'projects'
                                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Briefcase className="w-4 h-4" />
                            Proyectos
                        </button>
                    </div>

                    {/* Inbox Tab */}
                    {activeTab === 'inbox' && (
                        <>
                            {/* Quick Add Form */}
                            <form onSubmit={handleQuickAdd} className="p-3 border-b bg-gray-50 space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nueva tarea..."
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <div className="flex items-center gap-1 bg-white border rounded-lg px-2">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <input
                                            type="number"
                                            min="0.5"
                                            step="0.5"
                                            value={newTaskHours}
                                            onChange={e => setNewTaskHours(Number(e.target.value))}
                                            className="w-12 text-sm text-center border-none focus:ring-0"
                                        />
                                        <span className="text-xs text-gray-400">h</span>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newTaskTitle.trim()}
                                    className="w-full py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Agregar a Inbox
                                </button>
                            </form>

                            {/* Inbox Items */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {inboxBlocks.map(block => (
                                    <div
                                        key={block.id}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('inboxBlockId', String(block.id));
                                            e.dataTransfer.setData('blockTitle', block.title);
                                            e.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="group p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
                                    >
                                        <div className="flex items-start gap-2">
                                            <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-800 truncate">{block.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-indigo-600 font-bold">{block.hours}h</span>
                                                    {block.clientName && (
                                                        <span className="text-xs text-gray-400 truncate">{block.clientName}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onInboxDelete(block.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {inboxBlocks.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>Tu inbox está vacío.</p>
                                        <p className="text-xs mt-1">Agrega tareas arriba para organizarlas luego.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 text-center">
                                Arrastra tareas al calendario para agendarlas.
                            </div>
                        </>
                    )}

                    {/* Projects Tab */}
                    {activeTab === 'projects' && (
                        <>
                            <div className="p-3 border-b bg-gray-50">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {filteredProjects.map(project => (
                                    <div
                                        key={project.id}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('projectId', String(project.id));
                                            e.dataTransfer.setData('clientName', project.clientName);
                                            e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                        className="group p-3 border border-gray-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
                                        onClick={() => onProjectSelect(project)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm text-gray-800">{project.clientName}</span>
                                            <PlusCircle className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="text-xs text-gray-500 mb-2">
                                            {project.planType}
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-black">
                                            <span>{project.confirmedDeliveryDate ? new Date(project.confirmedDeliveryDate).toLocaleDateString() : 'Sin fecha'}</span>
                                            {project.hoursCompleted !== undefined && (
                                                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                                    {project.hoursCompleted}/{project.estimatedHours || '?'}h
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {filteredProjects.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        No se encontraron proyectos activos.
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 text-center">
                                Arrastra proyectos al calendario para crear bloques.
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};
