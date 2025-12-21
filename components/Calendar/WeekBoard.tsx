import React, { useState, useRef, useEffect } from 'react';
import { CapacityBlock, Project } from '../../types';
import { DayColumn } from './DayColumn';
import { BacklogSidebar } from './BacklogSidebar';

interface WeekBoardProps {
    days: { date: Date; blocks: CapacityBlock[] }[];
    projects: Project[];
    inboxBlocks: CapacityBlock[];
    onAddBlock: (dateStr: string, project?: Project) => void;
    onEditBlock: (block: CapacityBlock) => void;
    onDeleteBlock: (blockId: number) => void;
    onMoveToNextDay: (blockId: number) => void;
    onDuplicateBlock: (block: CapacityBlock) => void;
    onToggleComplete: (blockId: number, completed: boolean) => void;
    onStartTracking: (blockId: number) => void;
    onStopTracking: (blockId: number, elapsedMinutes: number) => void;
    onScheduleInboxBlock: (blockId: number, dateStr: string) => void;
    onInboxAdd: (title: string, hours: number) => void;
    onInboxDelete: (blockId: number) => void;
    onRefreshInbox: () => void;
}

export const WeekBoard: React.FC<WeekBoardProps> = ({
    days,
    projects,
    inboxBlocks,
    onAddBlock,
    onEditBlock,
    onDeleteBlock,
    onMoveToNextDay,
    onDuplicateBlock,
    onToggleComplete,
    onStartTracking,
    onStopTracking,
    onScheduleInboxBlock,
    onInboxAdd,
    onInboxDelete,
    onRefreshInbox
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const todayRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to today on mount
    useEffect(() => {
        if (todayRef.current && scrollRef.current) {
            // Scroll today into center of view
            const container = scrollRef.current;
            const todayEl = todayRef.current;
            const scrollLeft = todayEl.offsetLeft - (container.clientWidth / 2) + (todayEl.clientWidth / 2);
            container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
        }
    }, [days]);

    const handleProjectSelect = (project: Project) => {
        setSelectedProject(prev => prev?.id === project.id ? null : project);
    };

    const handleColumnAdd = (dateStr: string) => {
        if (selectedProject) {
            onAddBlock(dateStr, selectedProject);
        } else {
            onAddBlock(dateStr);
        }
    };

    const handleProjectDrop = (dateStr: string, projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            onAddBlock(dateStr, project);
        }
    };

    const handleInboxBlockDrop = (dateStr: string, blockId: number) => {
        onScheduleInboxBlock(blockId, dateStr);
    };

    // Find today's index for ref assignment
    const todayIndex = days.findIndex(d => d.date.toDateString() === new Date().toDateString());

    return (
        <div className="flex flex-1 h-full overflow-hidden bg-white/50 backdrop-blur-xl relative">
            {/* Selection Indicator Overlay */}
            {selectedProject && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-2 rounded-full shadow-lg animate-bounce flex items-center gap-2 pointer-events-none">
                    <span className="font-bold">Colocando:</span> {selectedProject.clientName}
                    <span className="text-xs opacity-80">(Click en un día para agendar)</span>
                </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex h-full gap-4 min-w-max">
                    {days.map((day, index) => (
                        <div key={day.date.toISOString()} ref={index === todayIndex ? todayRef : null}>
                            <DayColumn
                                date={day.date}
                                blocks={day.blocks}
                                isToday={day.date.toDateString() === new Date().toDateString()}
                                onAddBlock={handleColumnAdd}
                                onEditBlock={onEditBlock}
                                onDeleteBlock={onDeleteBlock}
                                onMoveToNextDay={onMoveToNextDay}
                                onDuplicateBlock={onDuplicateBlock}
                                onToggleComplete={onToggleComplete}
                                onStartTracking={onStartTracking}
                                onStopTracking={onStopTracking}
                                onProjectDrop={handleProjectDrop}
                                onInboxBlockDrop={handleInboxBlockDrop}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Sidebar */}
            <BacklogSidebar
                projects={projects}
                inboxBlocks={inboxBlocks}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onProjectSelect={handleProjectSelect}
                onInboxAdd={onInboxAdd}
                onInboxDelete={onInboxDelete}
                onRefreshInbox={onRefreshInbox}
            />
        </div>
    );
};
