import React from 'react';
import { Note } from '../../types';
import { Pin, Copy, ExternalLink } from 'lucide-react';

interface NoteCardProps {
    note: Note;
    onClick: () => void;
    onPin: (e: React.MouseEvent) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onPin }) => {
    const handleCopyItem = async (e: React.MouseEvent, content: string) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(content);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl shadow-sm border ${note.is_pinned ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'
                } transition-all hover:shadow-md hover:border-blue-300 cursor-pointer flex flex-col h-full group`}
        >
            {/* Header */}
            <div className="px-5 py-4 flex items-start justify-between border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                <h3 className="font-semibold text-gray-900 text-base leading-tight break-words pr-4 line-clamp-2">{note.title}</h3>

                <button
                    onClick={onPin}
                    className={`p-1.5 rounded-md transition-colors shrink-0 ${note.is_pinned
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 opacity-0 group-hover:opacity-100'
                        }`}
                    title={note.is_pinned ? "Desfijar" : "Fijar"}
                >
                    <Pin size={16} className={note.is_pinned ? "fill-current" : ""} />
                </button>
            </div>

            {/* Content Preview */}
            <div className="p-5 flex-1">
                <div className="space-y-2">
                    {(note.items || []).slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                            <div className="flex-1 min-w-0 truncate">
                                {item.title && <span className="font-medium text-gray-700 mr-1">{item.title}:</span>}
                                <span className="truncate">{item.content}</span>
                            </div>
                        </div>
                    ))}
                    {(note.items || []).length > 3 && (
                        <p className="text-xs text-gray-400 italic mt-2">
                            + {(note.items || []).length - 3} más...
                        </p>
                    )}
                    {(note.items || []).length === 0 && (
                        <p className="text-sm text-gray-400 italic">Nota vacía</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 rounded-b-xl flex justify-between items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {note.category}
                </span>
                <span className="text-xs text-gray-400">
                    {new Date(note.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};

export default NoteCard;
