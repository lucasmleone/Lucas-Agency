import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, Copy, Mail, Calendar } from 'lucide-react';
import { MonthlyTask, ChecklistItem } from '../types';

interface MonthlyTaskCardProps {
    task: MonthlyTask;
    isCurrentMonth: boolean;
    onChecklistUpdate: (monthIndex: number, itemId: string, completed: boolean) => void;
    onGenerateReport: (task: MonthlyTask) => void;
    onCompleteTask: (monthIndex: number) => void;
}

export const MonthlyTaskCard: React.FC<MonthlyTaskCardProps> = ({
    task,
    isCurrentMonth,
    onChecklistUpdate,
    onGenerateReport,
    onCompleteTask
}) => {
    const [expanded, setExpanded] = useState(isCurrentMonth);

    const completedCount = task.checklist.filter(i => i.completed).length;
    const totalCount = task.checklist.length;
    const progress = (completedCount / totalCount) * 100;
    const isFullyCompleted = completedCount === totalCount;

    return (
        <div className={`bg-white rounded-lg border transition-all duration-200 ${isCurrentMonth ? 'border-indigo-200 shadow-md ring-1 ring-indigo-100' : 'border-gray-200'
            }`}>
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-t-lg"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${task.completed ? 'bg-green-100 text-green-600' :
                            isCurrentMonth ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className={`font-medium ${isCurrentMonth ? 'text-indigo-900' : 'text-gray-900'}`}>
                            Mes {task.month}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {new Date(task.date).toLocaleDateString()}
                        </p>
                    </div>
                    {isCurrentMonth && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            Actual
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{completedCount}/{totalCount}</span>
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isFullyCompleted ? 'bg-green-500' : 'bg-indigo-500'
                                        }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </div>
            </div>

            {/* Content */}
            {expanded && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                    <div className="space-y-3 mb-6">
                        {task.checklist.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-start gap-3 p-2 hover:bg-white rounded transition-colors"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChecklistUpdate(task.month - 1, item.id, !item.completed);
                                    }}
                                    className={`mt-0.5 flex-shrink-0 transition-colors ${item.completed ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'
                                        }`}
                                >
                                    {item.completed ? (
                                        <CheckCircle className="h-5 w-5" />
                                    ) : (
                                        <Circle className="h-5 w-5" />
                                    )}
                                </button>
                                <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                    {item.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            {task.reportSent && (
                                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                    <Mail className="h-3 w-3" /> Reporte Enviado
                                </span>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onGenerateReport(task);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm"
                            >
                                <Copy className="h-4 w-4" />
                                Copiar Reporte
                            </button>

                            {!task.completed && isFullyCompleted && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCompleteTask(task.month - 1);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 shadow-sm"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Completar Mes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
