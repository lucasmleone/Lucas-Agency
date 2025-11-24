import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Project, ProjectStatus } from '../types';

interface WorkloadWidgetProps {
    projects: Project[];
}

export const WorkloadWidget: React.FC<WorkloadWidgetProps> = ({ projects }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper to get days in month
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Helper to get day of week for first day (0-6, 0=Sunday)
    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Filter active projects with deadlines in this month
    const monthProjects = useMemo(() => {
        return projects.filter(p => {
            if (!p.deadline || p.status === ProjectStatus.DELIVERED || p.status === ProjectStatus.CANCELLED) return false;
            const pDate = new Date(p.deadline + 'T00:00:00'); // Fix timezone issue
            return pDate.getMonth() === month && pDate.getFullYear() === year;
        });
    }, [projects, month, year]);

    // Group projects by day
    const projectsByDay = useMemo(() => {
        const map: Record<number, Project[]> = {};
        monthProjects.forEach(p => {
            const day = new Date(p.deadline + 'T00:00:00').getDate();
            if (!map[day]) map[day] = [];
            map[day].push(p);
        });
        return map;
    }, [monthProjects]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Generate calendar grid
    const renderCalendarDays = () => {
        const days = [];
        // Empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 border border-gray-100"></div>);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayProjects = projectsByDay[day] || [];
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

            // Calculate load level
            const loadLevel = dayProjects.length;
            let loadColor = 'bg-gray-50';
            if (loadLevel === 1) loadColor = 'bg-green-50';
            if (loadLevel === 2) loadColor = 'bg-yellow-50';
            if (loadLevel >= 3) loadColor = 'bg-red-50';

            days.push(
                <div key={day} className={`h-24 border border-gray-100 p-1 relative group transition-colors hover:bg-white ${loadColor} ${isToday ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}>
                    <span className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-gray-400'} absolute top-1 left-2`}>{day}</span>

                    <div className="mt-5 space-y-1 overflow-y-auto max-h-[calc(100%-1.25rem)] custom-scrollbar">
                        {dayProjects.map(p => (
                            <div
                                key={p.id}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-200 shadow-sm truncate cursor-help"
                                title={`${p.clientName} - ${p.planType}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${p.status === ProjectStatus.DISCOVERY ? 'bg-indigo-400' :
                                        p.status === ProjectStatus.PROPOSAL ? 'bg-blue-400' :
                                            p.status === ProjectStatus.WAITING_RESOURCES ? 'bg-orange-400' :
                                                'bg-green-400'
                                    }`}></span>
                                {p.clientName}
                            </div>
                        ))}
                    </div>

                    {/* Add button for empty days? Maybe later */}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-gray-800">Carga de Trabajo (Entregas)</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="text-sm font-bold text-gray-900 min-w-[100px] text-center">
                        {monthNames[month]} {year}
                    </span>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 text-center py-2 bg-gray-50 border-b border-gray-200">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-400 uppercase">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 bg-white">
                {renderCalendarDays()}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-4 text-xs text-gray-500 justify-center">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-50 border border-green-100"></div> Baja (1)</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-50 border border-yellow-100"></div> Media (2)</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-50 border border-red-100"></div> Alta (3+)</div>
            </div>
        </div>
    );
};
