import React, { useState } from 'react';
import { Project } from '../../types';
import { Search, Briefcase, ChevronRight, ChevronLeft, PlusCircle } from 'lucide-react';

interface BacklogSidebarProps {
    projects: Project[];
    isOpen: boolean;
    onToggle: () => void;
    onProjectSelect: (project: Project) => void;
}

export const BacklogSidebar: React.FC<BacklogSidebarProps> = ({
    projects,
    isOpen,
    onToggle,
    onProjectSelect
}) => {
    const [search, setSearch] = useState('');

    const filteredProjects = projects.filter(p =>
        p.status !== '7. Entregado' &&
        p.status !== '6. Cancelado' &&
        p.clientName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={`transition-all duration-300 ease-in-out border-l bg-white flex flex-col h-full relative ${isOpen ? 'w-80' : 'w-0 border-none'}`}>
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -left-3 top-6 bg-white border shadow-md rounded-full p-1 z-20 hover:bg-gray-50"
                title={isOpen ? "Cerrar Panel" : "Abrir Proyectos"}
            >
                {isOpen ? <ChevronRight className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
            </button>

            {/* Content Container */}
            <div className={`flex flex-col h-full overflow-hidden ${!isOpen && 'hidden'}`}>
                {/* Header */}
                <div className="p-4 border-b bg-gray-50 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-gray-700 font-bold">
                        <Briefcase className="w-5 h-5" />
                        <h3>El Banco de Proyectos</h3>
                    </div>

                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Project List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

                            {/* Mini Progress / Deadline */}
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

                {/* Footer Tip */}
                <div className="p-4 bg-gray-50 border-t text-xs text-gray-500 text-center">
                    Selecciona un proyecto y luego un día para agendar 2hs rápido.
                </div>
            </div>
        </div>
    );
};
