import React, { useState, useEffect } from 'react';
import { CapacityBlock } from '../../types';
import { Clock, CheckCircle, MoreVertical, ArrowRight, Trash2, Edit3, Copy, Play, Square, Check, RotateCcw } from 'lucide-react';

interface SmartBlockProps {
    block: CapacityBlock;
    onEdit: (block: CapacityBlock) => void;
    onDelete: (blockId: number) => void;
    onMoveToNextDay: (blockId: number) => void;
    onDuplicate: (block: CapacityBlock) => void;
    onToggleComplete?: (blockId: number, completed: boolean) => void;
    onStartTracking?: (blockId: number) => void;
    onStopTracking?: (blockId: number, elapsedMinutes: number) => void;
    className?: string;
}

export const SmartBlock: React.FC<SmartBlockProps> = ({
    block,
    onEdit,
    onDelete,
    onMoveToNextDay,
    onDuplicate,
    onToggleComplete,
    onStartTracking,
    onStopTracking,
    className = ''
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Calculate if currently tracking based on trackingStartTime
    const isTracking = !!block.trackingStartTime;

    // Timer effect - update every second when tracking
    useEffect(() => {
        if (!isTracking || !block.trackingStartTime) {
            setElapsedSeconds(0);
            return;
        }

        const startTime = new Date(block.trackingStartTime).getTime();

        const updateElapsed = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            setElapsedSeconds(elapsed);
        };

        updateElapsed(); // Initial update
        const timer = setInterval(updateElapsed, 1000);

        return () => clearInterval(timer);
    }, [isTracking, block.trackingStartTime]);

    // Format elapsed time
    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Format actual hours display
    const formatActualHours = (hours: number) => {
        if (hours < 1) {
            return `${Math.round(hours * 60)}m`;
        }
        return `${hours.toFixed(1)}h`;
    };

    // Color logic
    const getColors = () => {
        if (block.completed) return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
        if (block.blockType === 'production') return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
        if (block.blockType === 'meeting') return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100';
        return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
    };

    const handleToggleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleComplete) {
            onToggleComplete(block.id, !block.completed);
        }
    };

    const handleToggleTracking = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isTracking) {
            if (onStopTracking) {
                const elapsedMinutes = Math.round(elapsedSeconds / 60);
                onStopTracking(block.id, elapsedMinutes);
            }
        } else {
            if (onStartTracking) {
                onStartTracking(block.id);
            }
        }
    };

    return (
        <div
            className={`
                group relative p-3 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer
                ${getColors()} ${className}
                ${isTracking ? 'ring-2 ring-red-400 ring-offset-1' : ''}
            `}
            onClick={() => onEdit(block)}
        >
            {/* Header: Title & Quick Actions */}
            <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm leading-tight line-clamp-2 flex-1 pr-2">
                    {block.title}
                </span>

                {/* Quick Action Buttons (visible on hover or when tracking) */}
                <div className={`flex items-center gap-1 transition-opacity ${isTracking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {/* Timer Button */}
                    <button
                        onClick={handleToggleTracking}
                        className={`p-1.5 rounded-lg transition-colors ${isTracking
                                ? 'bg-red-500 text-white shadow-md animate-pulse'
                                : 'bg-white/70 hover:bg-white text-current shadow-sm'
                            }`}
                        title={isTracking ? "Detener Timer" : "Iniciar Timer"}
                    >
                        {isTracking ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>

                    {/* Complete/Uncomplete Button */}
                    {onToggleComplete && (
                        <button
                            onClick={handleToggleComplete}
                            className={`p-1.5 rounded-lg shadow-sm transition-colors ${block.completed
                                    ? 'bg-green-500 text-white hover:bg-amber-500'
                                    : 'bg-white/70 hover:bg-green-500 hover:text-white text-current'
                                }`}
                            title={block.completed ? "Desmarcar Completado" : "Marcar Completado"}
                        >
                            {block.completed ? <RotateCcw className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        </button>
                    )}

                    {/* Menu Trigger */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 rounded-lg bg-white/70 hover:bg-white text-current shadow-sm transition-colors"
                    >
                        <MoreVertical className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Details Row */}
            <div className="flex items-center gap-2 text-xs opacity-80 mt-1 flex-wrap">
                {block.startTime && (
                    <span className="flex items-center gap-1 bg-white/50 px-1.5 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" />
                        {block.startTime}
                    </span>
                )}

                {/* Planned vs Actual hours */}
                <span className="font-medium">
                    {block.hours}h
                    {block.actualHours !== undefined && block.actualHours > 0 && (
                        <span className={`ml-1 ${block.actualHours > block.hours ? 'text-red-600' : 'text-green-600'}`}>
                            ({formatActualHours(block.actualHours)} real)
                        </span>
                    )}
                </span>

                {block.clientName && (
                    <span className="truncate max-w-[80px]">
                        • {block.clientName}
                    </span>
                )}

                {/* Live Timer indicator */}
                {isTracking && (
                    <span className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-md font-mono text-xs">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        {formatTime(elapsedSeconds)}
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
                            Duplicar (Mismo Día)
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onMoveToNextDay(block.id); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            Mover a Mañana
                        </button>
                        {onToggleComplete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleComplete(block.id, !block.completed); setShowMenu(false); }}
                                className={`w-full text-left px-4 py-2 flex items-center gap-2 ${block.completed ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-green-50 text-green-600'
                                    }`}
                            >
                                {block.completed ? <RotateCcw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                {block.completed ? 'Desmarcar Completado' : 'Marcar Completado'}
                            </button>
                        )}
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
