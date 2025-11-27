import React, { useState } from 'react';
import { Note, NoteItem } from '../../types';
import { Trash2, Edit2, Pin, Copy, Plus, X, Link as LinkIcon, FileText, Check } from 'lucide-react';

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
    const [newItemTitle, setNewItemTitle] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemTitle, setEditingItemTitle] = useState('');
    const [editingItemContent, setEditingItemContent] = useState('');

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

    const handleCancelEditItem = () => {
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
        <div className={`bg-white rounded-2xl shadow-sm border ${note.is_pinned ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'
            } overflow-hidden transition-all hover:shadow-md min-w-0`}>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
                {isEditing ? (
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="flex-1 text-sm font-semibold text-gray-900 border-0 focus:outline-none focus:ring-0 px-0 py-0 bg-transparent"
                        placeholder="Note title"
                    />
                ) : (
                    <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{note.title}</h3>
                )}
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
                        {/* Items List - Edit Mode */}
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {editedItems.map((item) => (
                                <div key={item.id} className="group">
                                    {editingItemId === item.id ? (
                                        // Edit item inline
                                        <div className="p-3 bg-blue-50 rounded-lg space-y-2 border border-blue-200">
                                            <input
                                                type="text"
                                                value={editingItemTitle}
                                                onChange={(e) => setEditingItemTitle(e.target.value)}
                                                placeholder="Title (optional)"
                                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <textarea
                                                value={editingItemContent}
                                                onChange={(e) => setEditingItemContent(e.target.value)}
                                                placeholder="Content"
                                                rows={3}
                                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            />
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={handleCancelEditItem}
                                                    className="px-2 py-1 text-xs text-gray-600 hover:bg-white rounded transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleSaveEditItem(item.id)}
                                                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                                >
                                                    <Check size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View item
                                        <div className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            {item.title && (
                                                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                    {item.title}
                                                </div>
                                            )}
                                            <div className="flex items-start gap-2">
                                                <div className="p-1 bg-white rounded shadow-sm flex-shrink-0">
                                                    {item.type === 'link' ? (
                                                        <LinkIcon size={12} className="text-blue-500" />
                                                    ) : (
                                                        <FileText size={12} className="text-gray-500" />
                                                    )}
                                                </div>
                                                <p className="flex-1 text-xs text-gray-700 break-words whitespace-pre-wrap leading-relaxed pt-0.5">
                                                    {item.content}
                                                </p>
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleStartEditItem(item)}
                                                        className="p-1 text-gray-400 hover:text-blue-500 transition-all"
                                                    >
                                                        <Edit2 size={11} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="p-1 text-gray-400 hover:text-red-500 transition-all"
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Item */}
                        <div className="pt-2 border-t border-gray-100">
                            <div className="space-y-1.5">
                                <input
                                    type="text"
                                    value={newItemTitle}
                                    onChange={(e) => setNewItemTitle(e.target.value)}
                                    placeholder="Title (optional)"
                                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <div className="flex gap-2">
                                    <textarea
                                        value={newItemContent}
                                        onChange={(e) => setNewItemContent(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddItem();
                                            }
                                        }}
                                        placeholder="Paste link or add text... (Shift+Enter for new line)"
                                        rows={2}
                                        className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                    <button
                                        onClick={handleAddItem}
                                        disabled={!newItemContent.trim()}
                                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-start"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
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
                                    setNewItemTitle('');
                                    setEditingItemId(null);
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
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {(note.items || []).map((item) => (
                                    <div key={item.id} className="group">
                                        {item.title && (
                                            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 px-2">
                                                {item.title}
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                                                    className="flex-1 text-xs text-blue-600 hover:text-blue-700 hover:underline break-all whitespace-pre-wrap leading-relaxed pt-0.5 overflow-wrap-anywhere"
                                                >
                                                    {item.content}
                                                </a>
                                            ) : (
                                                <p className="flex-1 text-xs text-gray-700 break-words whitespace-pre-wrap leading-relaxed pt-0.5 overflow-wrap-anywhere">
                                                    {item.content}
                                                </p>
                                            )}
                                            <button
                                                onClick={() => handleCopyItem(item.content)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-all flex-shrink-0"
                                                title="Copy content"
                                            >
                                                <Copy size={12} />
                                            </button>
                                        </div>
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
