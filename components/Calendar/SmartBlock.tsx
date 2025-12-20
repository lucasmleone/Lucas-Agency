import React, { useState } from 'react';
import { CapacityBlock } from '../../types';
import { Clock, CheckCircle, MoreVertical, ArrowRight, Trash2, Edit3, Copy } from 'lucide-react';

interface SmartBlockProps {
    block: CapacityBlock;
    onEdit: (block: CapacityBlock) => void;
    onDelete: (blockId: number) => void;
    onMoveToNextDay: (blockId: number) => void;
    onDuplicate: (block: CapacityBlock) => void;
    className?: string;
}

export const SmartBlock: React.FC<SmartBlockProps> = ({
    block,
    onEdit,
    onDelete,
    onMoveToNextDay,
    onDuplicate,
    className = ''
}) => {
    const [showMenu, setShowMenu] = useState(false);

    // Color logic (aligned with CalendarView)
    const getColors = () => {
        if (block.completed) return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
        if (block.blockType === 'production') return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
        if (block.blockType === 'meeting') return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100';
        return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
    };

    return (
        <div
            className={`
                group relative p-3 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer
                ${getColors()} ${className}
            `}
            onClick={() => onEdit(block)}
        >
            {/* Header: Title & Time */}
            <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm leading-tight line-clamp-2">
                    {block.title}
                </span>

                {/* Menu Trigger (Hidden unless hovered) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                    className="p-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            {/* Details Row */}
            <div className="flex items-center gap-2 text-xs opacity-80 mt-1">
                {block.startTime && (
                    <span className="flex items-center gap-1 bg-white/50 px-1.5 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" />
                        {block.startTime}
                    </span>
                )}
                <span className="font-medium">{block.hours}h</span>

                {block.clientName && (
                    <span className="truncate max-w-[80px]">
                        • {block.clientName}
                    </span>
                )}
            </div>

            {/* Completion Badge */}
            {block.completed && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full shadow-sm">
                    <CheckCircle className="w-3 h-3" />
                </div>
            )}

            {/* Context Menu */}
            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                        }}
                    />
                    <div className="absolute right-2 top-8 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 text-sm text-gray-700 animation-fade-in">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(block); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Edit3 className="w-4 h-4 text-gray-400" />
                            Editar
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate(block); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Copy className="w-4 h-4 text-gray-400" />
                            Duplicar
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onMoveToNextDay(block.id); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            Mover a Mañana
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(block.id); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
