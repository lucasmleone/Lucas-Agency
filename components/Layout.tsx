import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
    children: React.ReactNode;
    currentView: string;
    onNavigate: (view: 'dashboard' | 'projects' | 'clients' | 'finance') => void;
    onLogout: () => void;
    userEmail?: string;
    title: string;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    currentView,
    onNavigate,
    onLogout,
    userEmail,
    title
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                currentView={currentView}
                onNavigate={(view) => {
                    onNavigate(view);
                    setSidebarOpen(false); // Close on mobile nav
                }}
                onLogout={onLogout}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    userEmail={userEmail}
                    onMenuClick={() => setSidebarOpen(true)}
                    title={title}
                />

                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
