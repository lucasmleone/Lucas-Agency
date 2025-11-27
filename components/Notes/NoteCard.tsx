import React, { useState, useEffect } from 'react';
import { Note, NoteItem } from '../../types';
import { Trash2, Edit2, Pin, Copy, Plus, X, Link as LinkIcon, Check, ExternalLink, FileText } from 'lucide-react';

interface NoteCardProps {
    note: Note;
    onDelete: (id: string) => void;
    onUpdate: (id: string, note: Partial<Note>) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(note.title);
    const [editedItems, setEditedItems] = useState<NoteItem[]>(note.items || []);
    const [newItemContent, setNewItemContent] = useState('');
    const [newItemTitle, setNewItemTitle] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemTitle, setEditingItemTitle] = useState('');
    const [editingItemContent, setEditingItemContent] = useState('');

    // Sync state with props when note changes (e.g. after save)
    useEffect(() => {
        setEditedTitle(note.title);
        setEditedItems(note.items || []);
    }, [note]);

    const isValidUrl = (string: string): boolean => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSave = () => {
        onUpdate(note.id, { title: editedTitle, items: editedItems });
        setIsEditing(false);
        setEditingItemId(null);
    };

    const handleAddItem = () => {
        if (!newItemContent.trim()) return;
        const itemType: 'link' | 'text' = isValidUrl(newItemContent.trim()) ? 'link' : 'text';
        const newItem: NoteItem = {
            id: Date.now().toString(),
            type: itemType,
            title: newItemTitle.trim() || undefined,
            content: newItemContent.trim()
        };
        setEditedItems([...editedItems, newItem]);
        setNewItemContent('');
        setNewItemTitle('');
    };

    const handleDeleteItem = (itemId: string) => {
        setEditedItems(editedItems.filter(item => item.id !== itemId));
    };

    const handleStartEditItem = (item: NoteItem) => {
        setEditingItemId(item.id);
        setEditingItemTitle(item.title || '');
        setEditingItemContent(item.content);
    };

    const handleSaveEditItem = (itemId: string) => {
        setEditedItems(editedItems.map(item =>
            item.id === itemId
                ? { ...item, title: editingItemTitle.trim() || undefined, content: editingItemContent.trim() }
                : item
        ));
        setEditingItemId(null);
    };

    const handleCopyItem = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border ${note.is_pinned ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'
            } transition-all hover:shadow-md flex flex-col h-full`}>

            {/* Header */}
            <div className="px-5 py-4 flex items-start justify-between border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                {isEditing ? (
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="flex-1 text-base font-semibold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent px-0 pb-1"
                        placeholder="Título de la nota"
                        autoFocus
                    />
                ) : (
                    <h3 className="font-semibold text-gray-900 text-base leading-tight break-words pr-4">{note.title}</h3>
                )}

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => onUpdate(note.id, { is_pinned: !note.is_pinned })}
                        className={`p-1.5 rounded-md transition-colors ${note.is_pinned
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                            }`}
                        title={note.is_pinned ? "Desfijar" : "Fijar"}
                    >
                        <Pin size={16} className={note.is_pinned ? "fill-current" : ""} />
                    </button>
                    {!isEditing && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-md transition-colors"
                                title="Editar"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(note.id)}
                                className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-1 flex flex-col gap-4">
                {isEditing ? (
                    <>
                        {/* Edit Mode: Items List */}
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {editedItems.length === 0 && (
                                <p className="text-sm text-gray-400 italic text-center py-4">Sin items. Agrega uno abajo.</p>
                            )}
                            {editedItems.map((item) => (
                                <div key={item.id} className="group bg-gray-50 rounded-lg border border-gray-100 p-3 transition-all hover:border-gray-300">
                                    {editingItemId === item.id ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editingItemTitle}
                                                onChange={(e) => setEditingItemTitle(e.target.value)}
                                                placeholder="Título (opcional)"
                                                className="w-full text-sm font-medium bg-white border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                            <textarea
                                                value={editingItemContent}
                                                onChange={(e) => setEditingItemContent(e.target.value)}
                                                placeholder="Contenido..."
                                                rows={3}
                                                className="w-full text-sm bg-white border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={handleCancelEditItem} className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
                                                <button onClick={() => handleSaveEditItem(item.id)} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                {item.title && <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{item.title}</div>}
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{item.content}</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleStartEditItem(item)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-gray-400 hover:text-red-600"><X size={14} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Edit Mode: Add Item Form */}
                        <div className="pt-4 border-t border-gray-100 mt-auto">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Agregar Item</h4>
                            <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <input
                                    type="text"
                                    value={newItemTitle}
                                    onChange={(e) => setNewItemTitle(e.target.value)}
                                    placeholder="Título (opcional)"
                                    className="w-full text-sm bg-white border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <textarea
                                    value={newItemContent}
                                    onChange={(e) => setNewItemContent(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddItem();
                                        }
                                    }}
                                    placeholder="Escribe algo o pega un link..."
                                    rows={2}
                                    className="w-full text-sm bg-white border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                />
                                <button
                                    onClick={handleAddItem}
                                    disabled={!newItemContent.trim()}
                                    className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Agregar a la lista
                                </button>
                            </div>
                        </div>

                        {/* Edit Mode: Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedTitle(note.title);
                                    setEditedItems(note.items || []);
                                    setNewItemContent('');
                                    setNewItemTitle('');
                                    setEditingItemId(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </>
                ) : (
                    /* View Mode */
                    <div className="space-y-3">
                        {(note.items || []).length > 0 ? (
                            (note.items || []).map((item) => (
                                <div key={item.id} className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                                    <div className="mt-1 shrink-0">
                                        {item.type === 'link' ? (
                                            <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                                                <LinkIcon size={14} />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                                                <FileText size={14} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {item.title && (
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                                                {item.title}
                                            </div>
                                        )}
                                        {item.type === 'link' ? (
                                            <a
                                                href={item.content}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all block"
                                            >
                                                {item.content} <ExternalLink size={10} className="inline ml-0.5" />
                                            </a>
                                        ) : (
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                                {item.content}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleCopyItem(item.content)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all shrink-0"
                                        title="Copiar"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 px-4 border-2 border-dashed border-gray-100 rounded-xl">
                                <p className="text-sm text-gray-400">Esta nota está vacía.</p>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="mt-2 text-sm text-blue-600 font-medium hover:underline"
                                >
                                    Agregar contenido
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            {!isEditing && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 rounded-b-xl flex justify-between items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {note.category}
                    </span>
                    <span className="text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleDateString()}
                    </span>
                </div>
            )}
        </div>
    );
};

export default NoteCard;
