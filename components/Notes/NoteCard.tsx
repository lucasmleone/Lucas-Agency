import React, { useState } from 'react';
import { Note, NoteItem } from '../../types';
import { Trash2, Edit2, Pin, Copy, Plus, X, Link as LinkIcon, FileText } from 'lucide-react';

interface NoteCardProps {
    note: Note;
    onDelete: (id: number) => void;
    onUpdate: (id: number, note: Partial<Note>) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(note.title);
    const [editedItems, setEditedItems] = useState<NoteItem[]>(note.items || []);
    const [newItemContent, setNewItemContent] = useState('');

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
    };

    const handleAddItem = () => {
        if (!newItemContent.trim()) return;
        const itemType: 'link' | 'text' = isValidUrl(newItemContent) ? 'link' : 'text';
        const newItem: NoteItem = {
            id: Date.now().toString(),
            type: itemType,
            content: newItemContent.trim()
        };
        setEditedItems([...editedItems, newItem]);
        setNewItemContent('');
    };

    const handleDeleteItem = (itemId: string) => {
        setEditedItems(editedItems.filter(item => item.id !== itemId));
    };

    const handleCopyItem = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm border ${note.is_pinned ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'
            } overflow-hidden transition-all hover:shadow-md`}>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{note.title}</h3>
                <div className="flex items-center gap-1 ml-2">
                    <button
                        onClick={() => onUpdate(note.id, { is_pinned: !note.is_pinned })}
                        className={`p-1.5 rounded-lg transition-colors ${note.is_pinned
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                        title={note.is_pinned ? "Unpin" : "Pin"}
                    >
                        <Pin size={14} fill={note.is_pinned ? "currentColor" : "none"} />
                    </button>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(note.id)}
                        className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {isEditing ? (
                    <div className="space-y-3">
                        {/* Title Edit */}
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Note title"
                        />

                        {/* Items List */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {editedItems.map((item) => (
                                <div key={item.id} className="group flex items-start gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="p-1 bg-white rounded shadow-sm">
                                        {item.type === 'link' ? (
                                            <LinkIcon size={12} className="text-blue-500" />
                                        ) : (
                                            <FileText size={12} className="text-gray-500" />
                                        )}
                                    </div>
                                    <p className="flex-1 text-xs text-gray-700 break-all leading-relaxed pt-0.5">{item.content}</p>
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Item */}
                        <div className="pt-2 border-t border-gray-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newItemContent}
                                    onChange={(e) => setNewItemContent(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                                    placeholder="Paste link or add text..."
                                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleAddItem}
                                    disabled={!newItemContent.trim()}
                                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedTitle(note.title);
                                    setEditedItems(note.items || []);
                                    setNewItemContent('');
                                }}
                                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Items Display */}
                        {(note.items || []).length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {(note.items || []).map((item) => (
                                    <div key={item.id} className="group flex items-start gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="p-1 bg-white rounded shadow-sm flex-shrink-0">
                                            {item.type === 'link' ? (
                                                <LinkIcon size={12} className="text-blue-500" />
                                            ) : (
                                                <FileText size={12} className="text-gray-500" />
                                            )}
                                        </div>
                                        {item.type === 'link' ? (
                                            <a
                                                href={item.content}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 text-xs text-blue-600 hover:text-blue-700 hover:underline break-all leading-relaxed pt-0.5"
                                            >
                                                {item.content}
                                            </a>
                                        ) : (
                                            <p className="flex-1 text-xs text-gray-700 break-all leading-relaxed pt-0.5">{item.content}</p>
                                        )}
                                        <button
                                            onClick={() => handleCopyItem(item.content)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-all flex-shrink-0"
                                            title="Copy"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic text-center py-4">No items yet</p>
                        )}

                        {/* Footer */}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-50">
                            <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-50 rounded-full">{note.category}</span>
                            <span className="text-xs text-gray-300">{new Date(note.updated_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoteCard;
