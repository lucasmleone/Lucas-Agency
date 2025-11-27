import React, { useState } from 'react';
import { Note } from '../../types';
import { Trash2, Edit2, Pin, ExternalLink } from 'lucide-react';

interface NoteCardProps {
    note: Note;
    onDelete: (id: number) => void;
    onUpdate: (id: number, note: Partial<Note>) => void;
    onDragStart: (e: React.DragEvent, id: number) => void;
    onDragOver: (e: React.DragEvent, id: number) => void;
    onDrop: (e: React.DragEvent, id: number) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onUpdate, onDragStart, onDragOver, onDrop }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(note.title);
    const [editedContent, setEditedContent] = useState(note.content);

    const handleSave = () => {
        onUpdate(note.id, { title: editedTitle, content: editedContent });
        setIsEditing(false);
    };

    const isUrl = (text: string) => {
        return text.startsWith('http://') || text.startsWith('https://');
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, note.id)}
            onDragOver={(e) => onDragOver(e, note.id)}
            onDrop={(e) => onDrop(e, note.id)}
            className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${note.is_pinned ? 'border-yellow-400' : 'border-blue-500'
                } hover:shadow-lg transition-shadow cursor-move relative group`}
        >
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
                <div className="space-y-2">
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full p-1 border rounded font-semibold"
                        placeholder="Title"
                    />
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-1 border rounded text-sm h-24"
                        placeholder="Content or URL"
                    />
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                        <button onClick={handleSave} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Save</button>
                    </div>
                </div>
            ) : (
                <div>
                    <h3 className="font-semibold text-gray-800 pr-16 truncate">{note.title}</h3>
                    <div className="mt-2 text-sm text-gray-600 break-words whitespace-pre-wrap">
                        {isUrl(note.content) ? (
                            <a
                                href={note.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()} // Prevent drag start on click
                            >
                                {note.content} <ExternalLink size={12} />
                            </a>
                        ) : (
                            note.content
                        )}
                    </div>
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
