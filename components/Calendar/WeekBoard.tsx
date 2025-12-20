import React, { useState } from 'react';
import { CapacityBlock, Project } from '../../types';
import { DayColumn } from './DayColumn';
import { BacklogSidebar } from './BacklogSidebar';

interface WeekBoardProps {
    days: { date: Date; blocks: CapacityBlock[] }[];
    projects: Project[];
    onAddBlock: (dateStr: string, project?: Project) => void;
    onEditBlock: (block: CapacityBlock) => void;
    onDeleteBlock: (blockId: number) => void;
    onMoveToNextDay: (blockId: number) => void;
    onDuplicateBlock: (block: CapacityBlock) => void;
}

export const WeekBoard: React.FC<WeekBoardProps> = ({
    days,
    projects,
    onAddBlock,
    onEditBlock,
    onDeleteBlock,
    onMoveToNextDay,
    onDuplicateBlock
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Handle interaction: Selecting a project from bench puts us in "Placement Mode"
    const handleProjectSelect = (project: Project) => {
        setSelectedProject(prev => prev?.id === project.id ? null : project);
    };

    const handleColumnAdd = (dateStr: string) => {
        if (selectedProject) {
            // Quick Add Mode: Add block for this project immediately
            onAddBlock(dateStr, selectedProject);
            // Optional: clear selection after add if we want one-off
            // setSelectedProject(null); 
        } else {
            // Default Mode: Open empty modal
            onAddBlock(dateStr);
        }
    };

    const handleProjectDrop = (dateStr: string, projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            onAddBlock(dateStr, project);
        }
    };

    return (
        <div className="flex flex-1 h-full overflow-hidden bg-white/50 backdrop-blur-xl relative">
            {/* Selection Indicator Overlay */}
            {selectedProject && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-2 rounded-full shadow-lg animate-bounce flex items-center gap-2 pointer-events-none">
                    <span className="font-bold">Colocando:</span> {selectedProject.clientName}
                    <span className="text-xs opacity-80">(Click en un día para agendar)</span>
                </div>
            )}

            {/* Main Board - Scrollable horizontally */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex h-full gap-5 min-w-max">
                    {days.map((day, index) => (
                        <DayColumn
                            key={day.date.toISOString()}
                            date={day.date}
                            blocks={day.blocks}
                            isToday={day.date.toDateString() === new Date().toDateString()}
                            onAddBlock={handleColumnAdd}
                            onEditBlock={onEditBlock}
                            onDeleteBlock={onDeleteBlock}
                            onMoveToNextDay={onMoveToNextDay}
                            onDuplicateBlock={onDuplicateBlock}
                            onProjectDrop={handleProjectDrop}
                        />
                    ))}
                </div>
            </div>

            {/* Right Sidebar */}
            <BacklogSidebar
                projects={projects}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onProjectSelect={handleProjectSelect}
            />
        </div>
    );
};
