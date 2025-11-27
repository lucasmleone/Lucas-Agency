import React, { useState } from 'react';
import { Note, NoteItem } from '../../types';
import { Trash2, Edit2, Pin, Copy, Plus, X } from 'lucide-react';

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
    const [newItemType, setNewItemType] = useState<'text' | 'link'>('text');

    const handleSave = () => {
        onUpdate(note.id, { title: editedTitle, items: editedItems });
        setIsEditing(false);
    };

    const handleAddItem = () => {
        if (!newItemContent.trim()) return;
        const newItem: NoteItem = {
            id: Date.now().toString(),
            type: newItemType,
            content: newItemContent
        };
        setEditedItems([...editedItems, newItem]);
        setNewItemContent('');
    };

    const handleDeleteItem = (itemId: string) => {
        setEditedItems(editedItems.filter(item => item.id !== itemId));
    };

    const handleCopyItem = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    return (
        <div className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${note.is_pinned ? 'border-yellow-400' : 'border-blue-500'
            } hover:shadow-lg transition-shadow relative group`}>
            {/* Actions */}
            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onUpdate(note.id, { is_pinned: !note.is_pinned })}
                    className={`p-1 rounded hover:bg-gray-100 ${note.is_pinned ? 'text-yellow-500' : 'text-gray-400'}`}
                    title={note.is_pinned ? "Unpin" : "Pin"}
                >
                    <Pin size={16} fill={note.is_pinned ? "currentColor" : "none"} />
                </button>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 text-gray-400 hover:text-blue-500 rounded hover:bg-gray-100"
                    title="Edit"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => onDelete(note.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Content */}
            {isEditing ? (
                <div className="space-y-3">
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full p-2 border rounded font-semibold text-sm"
                        placeholder="Title"
                    />

                    {/* Items List */}
                    <div className="space-y-2">
                        {editedItems.map((item) => (
                            <div key={item.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500">{item.type === 'link' ? '🔗' : '📝'}</span>
                                    <p className="text-sm break-words">{item.content}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Item */}
                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex gap-2">
                            <select
                                value={newItemType}
                                onChange={(e) => setNewItemType(e.target.value as 'text' | 'link')}
                                className="p-1 border rounded text-sm"
                            >
                                <option value="text">Text</option>
                                <option value="link">Link</option>
                            </select>
                            <input
                                type="text"
                                value={newItemContent}
                                onChange={(e) => setNewItemContent(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                                placeholder="Add item..."
                                className="flex-1 p-1 border rounded text-sm"
                            />
                            <button
                                onClick={handleAddItem}
                                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                        <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                        <button onClick={handleSave} className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Save</button>
                    </div>
                </div>
            ) : (
                <div>
                    <h3 className="font-semibold text-gray-800 pr-16 truncate mb-3">{note.title}</h3>

                    {/* Items Display */}
                    <div className="space-y-2">
                        {(note.items || []).map((item) => (
                            <div key={item.id} className="flex items-start gap-2 group/item">
                                <div className="flex-1 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                                    {item.type === 'link' ? (
                                        <a
                                            href={item.content}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                        >
                                            🔗 {item.content}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-gray-700">📝 {item.content}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleCopyItem(item.content)}
                                    className="opacity-0 group-hover/item:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-opacity"
                                    title="Copy"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {(note.items || []).length === 0 && (
                        <p className="text-xs text-gray-400 italic">No items yet</p>
                    )}

                    <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{note.category}</span>
                        <span className="text-xs text-gray-300">{new Date(note.updated_at).toLocaleDateString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoteCard;
