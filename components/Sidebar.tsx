import React from 'react';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    DollarSign,
    LogOut,
    X,
    Calendar
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: string;
    onNavigate: (view: 'dashboard' | 'projects' | 'clients' | 'finance' | 'calendar') => void;
    onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    currentView,
    onNavigate,
    onLogout
}) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Proyectos', icon: Briefcase },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'finance', label: 'Finanzas', icon: DollarSign },
        { id: 'calendar', label: 'Calendario', icon: Calendar },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container - Dark Glassmorphism */}
            <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 ease-in-out shadow-2xl
        lg:translate-x-0 lg:static
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="font-bold text-white text-lg">A</span>
                        </div>
                        <span className="font-bold text-white text-lg tracking-tight">AgencyFlow</span>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1.5 mt-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id as any)}
                                className={`
                  group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }
                `}
                            >
                                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="absolute bottom-0 left-0 w-full p-3 border-t border-white/10 bg-black/20 backdrop-blur-xl">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
};
