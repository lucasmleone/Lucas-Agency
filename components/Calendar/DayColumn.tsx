import React, { useMemo } from 'react';
import { CapacityBlock } from '../../types';
import { SmartBlock } from './SmartBlock';
import { Plus } from 'lucide-react';

interface DayColumnProps {
    date: Date;
    blocks: CapacityBlock[];
    maxCapacity?: number;
    isToday?: boolean;
    onAddBlock: (dateStr: string) => void;
    onEditBlock: (block: CapacityBlock) => void;
    onDeleteBlock: (blockId: number) => void;
    onMoveToNextDay: (blockId: number) => void;
    onDuplicateBlock: (block: CapacityBlock) => void;
    onProjectDrop?: (dateStr: string, projectId: number) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
    date,
    blocks,
    maxCapacity = 8,
    isToday = false,
    onAddBlock,
    onEditBlock,
    onDeleteBlock,
    onMoveToNextDay,
    onDuplicateBlock,
    onProjectDrop
}) => {
    const dateStr = date.toISOString().split('T')[0];
    const [isDragOver, setIsDragOver] = React.useState(false);

    // Sort logic: Fixed times first, then creation order or manual sorting
    const sortedBlocks = useMemo(() => {
        return [...blocks].sort((a, b) => {
            if (a.startTime && !b.startTime) return -1;
            if (!a.startTime && b.startTime) return 1;
            if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
            return 0;
        });
    }, [blocks]);

    const totalHours = blocks.reduce((sum, b) => sum + (b.isShadow ? 0 : b.hours), 0);
    const isOverCapacity = totalHours > maxCapacity;
    const capacityPercentage = Math.min((totalHours / maxCapacity) * 100, 100);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const projectId = e.dataTransfer.getData('projectId');
        if (projectId && onProjectDrop) {
            onProjectDrop(dateStr, Number(projectId));
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`min-w-[280px] w-full flex-1 flex flex-col h-full rounded-2xl transition-colors ${isDragOver ? 'bg-indigo-100 ring-2 ring-indigo-300' :
                    isToday ? 'bg-indigo-50/30 ring-1 ring-indigo-100' : 'bg-gray-50/50'
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-white/50 rounded-t-2xl backdrop-blur-sm sticky top-0 z-10">
                <div className="flex justify-between items-center mb-2">
                    <div className={isToday ? 'text-indigo-600 font-bold' : 'text-gray-700 font-medium'}>
                        {date.toLocaleDateString('es-AR', { weekday: 'long' })}
                    </div>
                    <div className={`text-xs font-mono px-2 py-0.5 rounded-full ${isOverCapacity ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                        {totalHours}h / {maxCapacity}h
                    </div>
                </div>

                <div className="text-xl font-bold text-gray-900 mb-3">
                    {date.getDate()}
                </div>

                {/* Capacity Bar */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 rounded-full ${isOverCapacity ? 'bg-red-500' :
                            totalHours >= maxCapacity ? 'bg-green-500' : 'bg-indigo-500'
                            }`}
                        style={{ width: `${capacityPercentage}%` }}
                    />
                </div>
            </div>

            {/* Scrollable Block List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {sortedBlocks.map(block => (
                    <SmartBlock
                        key={block.id}
                        block={block}
                        onEdit={onEditBlock}
                        onDelete={onDeleteBlock}
                        onMoveToNextDay={onMoveToNextDay}
                        onDuplicate={onDuplicateBlock}
                        className={block.isShadow ? 'opacity-50 border-dashed' : ''}
                    />
                ))}
            </div>

            {/* Footer Action */}
            <div className="p-3 border-t border-gray-100 bg-white/50 rounded-b-2xl">
                <button
                    onClick={() => onAddBlock(dateStr)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-indigo-100 dashed"
                >
                    <Plus className="w-4 h-4" />
                    Añadir Bloque
                </button>
            </div>
        </div>
    );
};
