import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Wrench } from 'lucide-react';
import { Project, ProjectStatus } from '../types';

interface WorkloadWidgetProps {
    projects: Project[];
}

interface CalendarEvent {
    type: 'delivery' | 'maintenance';
    project: Project;
    date: Date;
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

    // Collect all calendar events (deliveries + maintenance) for this month
    const monthEvents = useMemo(() => {
        const events: CalendarEvent[] = [];

        projects.forEach(p => {
            // Add delivery events
            if (p.deadline) {
                const dateStr = p.deadline.includes('T') ? p.deadline : p.deadline + 'T00:00:00';
                const pDate = new Date(dateStr);
                if (pDate.getMonth() === month && pDate.getFullYear() === year) {
                    events.push({ type: 'delivery', project: p, date: pDate });
                }
            }

            // Add maintenance events
            if (p.nextMaintenanceDate) {
                const dateStr = p.nextMaintenanceDate.includes('T') ? p.nextMaintenanceDate : p.nextMaintenanceDate + 'T00:00:00';
                const mDate = new Date(dateStr);
                if (mDate.getMonth() === month && mDate.getFullYear() === year) {
                    events.push({ type: 'maintenance', project: p, date: mDate });
                }
            }
        });

        return events;
    }, [projects, month, year]);

    // Group events by day
    const eventsByDay = useMemo(() => {
        const map: Record<number, CalendarEvent[]> = {};
        monthEvents.forEach(event => {
            const day = event.date.getDate();
            if (!map[day]) map[day] = [];
            map[day].push(event);
        });
        return map;
    }, [monthEvents]);

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
            const dayEvents = eventsByDay[day] || [];
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

            // Calculate load level (count all events)
            const loadLevel = dayEvents.length;
            let loadColor = 'bg-gray-50';
            if (loadLevel === 1) loadColor = 'bg-green-50';
            if (loadLevel === 2) loadColor = 'bg-yellow-50';
            if (loadLevel >= 3) loadColor = 'bg-red-50';

            days.push(
                <div key={day} className={`h-24 border border-gray-100 p-1 relative group transition-colors hover:bg-white ${loadColor} ${isToday ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}>
                    <span className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-gray-400'} absolute top-1 left-2`}>{day}</span>

                    <div className="mt-5 space-y-1 overflow-y-auto max-h-[calc(100%-1.25rem)] custom-scrollbar">
                        {dayEvents.map((event, idx) => (
                            <div
                                key={`${event.type}-${event.project.id}-${idx}`}
                                className={`text-[10px] px-1.5 py-0.5 rounded border shadow-sm truncate cursor-help ${event.type === 'maintenance'
                                    ? 'bg-purple-50 border-purple-200'
                                    : 'bg-white border-gray-200'
                                    }`}
                                title={event.type === 'maintenance'
                                    ? `Mantenimiento - ${event.project.clientName}`
                                    : `${event.project.clientName} - ${event.project.planType}`
                                }
                            >
                                {event.type === 'maintenance' ? (
                                    <>
                                        <Wrench className="w-2.5 h-2.5 inline-block mr-1 text-purple-600" />
                                        <span className="text-purple-700">{event.project.clientName}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${event.project.status === ProjectStatus.DISCOVERY ? 'bg-indigo-400' :
                                            event.project.status === ProjectStatus.PROPOSAL ? 'bg-blue-400' :
                                                event.project.status === ProjectStatus.WAITING_RESOURCES ? 'bg-orange-400' :
                                                    'bg-green-400'
                                            }`}></span>
                                        {event.project.clientName}
                                    </>
                                )}
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
                    <h3 className="font-bold text-gray-800">Carga de Trabajo (Entregas y Mantenimientos)</h3>
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

            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    <div className="grid grid-cols-7 text-center py-2 bg-gray-50 border-b border-gray-200">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                            <div key={d} className="text-xs font-bold text-gray-400 uppercase">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 bg-white">
                        {renderCalendarDays()}
                    </div>
                </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-2">
                <div className="flex gap-4 text-xs text-gray-500 justify-center">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-50 border border-green-100"></div> Baja (1)</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-50 border border-yellow-100"></div> Media (2)</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-50 border border-red-100"></div> Alta (3+)</div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 justify-center border-t border-gray-200 pt-2">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-300"></div> Entrega</div>
                    <div className="flex items-center gap-1"><Wrench className="w-3 h-3 text-purple-600" /> Mantenimiento</div>
                </div>
            </div>
        </div>
    );
};
