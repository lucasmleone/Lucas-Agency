import React, { useState } from 'react';
import { X, Mail, Phone, Building, Calendar, FileText } from 'lucide-react';
import { Client } from '../types';
import NotesBoard from './Notes/NotesBoard';

interface ClientDetailProps {
    client: Client;
    onClose: () => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ client, onClose }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'notes'>('info');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                            {client.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
                            <p className="text-sm text-gray-500">{client.company || 'Sin empresa'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-gray-50 px-6 py-2 flex gap-2 border-b border-gray-200 shrink-0">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-2 text-sm font-bold rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === 'info'
                            ? 'bg-white text-gray-900 border-t border-x border-gray-200'
                            : 'text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        <Building className="w-4 h-4" /> Información
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`px-4 py-2 text-sm font-bold rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === 'notes'
                            ? 'bg-white text-gray-900 border-t border-x border-gray-200'
                            : 'text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        <FileText className="w-4 h-4" /> Notas
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {activeTab === 'info' && (
                        <div className="space-y-6 max-w-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacto</label>
                                    <p className="text-base font-medium text-gray-900">{client.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</label>
                                    <p className="text-base font-medium text-gray-900">{client.company || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <a href={`mailto:${client.email}`} className="hover:text-blue-600 hover:underline">
                                            {client.email}
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</label>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{client.phone || '-'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha de Registro</label>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>{client.registeredAt}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 min-h-[400px]">
                            <NotesBoard entityType="client" entityId={String(client.id)} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
