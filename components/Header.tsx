import React from 'react';
import { Menu, Search, User } from 'lucide-react';

interface HeaderProps {
    userEmail?: string;
    onMenuClick: () => void;
    title: string;
}

export const Header: React.FC<HeaderProps> = ({ userEmail, onMenuClick, title }) => {
    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 hidden sm:block">{title}</h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
                {/* Search Bar - Hidden on mobile for now */}
                <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 w-64">
                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-700 placeholder-slate-400"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">L</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">Lucas Agency <span className="text-xs text-green-600 bg-green-100 px-1 rounded">v2.1 FIX</span></span>
                </div>
                <div className="flex items-center gap-3 pl-1">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-700 leading-none">{userEmail?.split('@')[0]}</p>
                        <p className="text-xs text-slate-500 mt-1">Admin</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-white" />
                    </div>
                </div>
            </div>
        </header>
    );
};
