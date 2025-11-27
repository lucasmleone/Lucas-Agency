import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Note } from '../../types';
import NoteCard from './NoteCard';
import { Plus, Search, Filter } from 'lucide-react';

const NotesBoard: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // New Note State
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('general');
    const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const data = await apiService.getNotes();
            setNotes(data);
        } catch (error) {
            console.error('Failed to fetch notes', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;

        const categoryToUse = isCreatingNewCategory && customCategory.trim()
            ? customCategory.trim()
            : newCategory;

        try {
            const created = await apiService.createNote({
                title: newTitle,
                category: categoryToUse,
                items: [],
                is_pinned: false
            });
            setNotes([created, ...notes]);
            setIsCreating(false);
            setNewTitle('');
            setNewCategory('general');
            setIsCreatingNewCategory(false);
            setCustomCategory('');
        } catch (error) {
            console.error('Failed to create note', error);
            alert('Error creating note. Please try again.');
        }
    };

    const handleUpdate = async (id: number, updates: Partial<Note>) => {
        try {
            // Optimistic update
            setNotes(notes.map(n => n.id === id ? { ...n, ...updates } : n));
            await apiService.updateNote(id, updates);
        } catch (error) {
            console.error('Failed to update note', error);
            alert('Error updating note. Please try again.');
            fetchNotes(); // Revert on error
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            setNotes(notes.filter(n => n.id !== id));
            await apiService.deleteNote(id);
        } catch (error) {
            console.error('Failed to delete note', error);
            alert('Error deleting note. Please try again.');
            fetchNotes();
        }
    };

    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (note.items || []).some(item =>
                item?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item?.content?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...Array.from(new Set(notes.map(n => n.category)))];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Notes & Resources</h1>
                    <p className="text-gray-500 mt-1">Manage your tools, links, and ideas.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all"
                >
                    <Plus size={20} /> New Note
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {categories.map((c: string) => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-blue-100">
                    <h3 className="text-lg font-semibold mb-4">Add New Note</h3>
                    <div className="grid gap-4">
                        <input
                            type="text"
                            placeholder="Title (e.g., Useful Tools)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                        <div className="flex gap-4">
                            {isCreatingNewCategory ? (
                                <input
                                    type="text"
                                    placeholder="Enter new category name"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    autoFocus
                                />
                            ) : (
                                <select
                                    value={newCategory}
                                    onChange={(e) => {
                                        if (e.target.value === '__new__') {
                                            setIsCreatingNewCategory(true);
                                        } else {
                                            setNewCategory(e.target.value);
                                        }
                                    }}
                                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {categories.filter(c => c !== 'all').map(cat => (
                                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                    ))}
                                    <option value="__new__">+ Create New Category</option>
                                </select>
                            )}
                            <div className="flex gap-2">
                                {isCreatingNewCategory && (
                                    <button
                                        onClick={() => {
                                            setIsCreatingNewCategory(false);
                                            setCustomCategory('');
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        Back
                                    </button>
                                )}
                                <button onClick={() => {
                                    setIsCreating(false);
                                    setIsCreatingNewCategory(false);
                                    setCustomCategory('');
                                }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button onClick={handleCreate} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Create</button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">You can add items (links, text) after creating the note.</p>
                    </div>
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading notes...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredNotes.map(note => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onDelete={handleDelete}
                            onUpdate={handleUpdate}
                        />
                    ))}
                </div>
            )}

            {!loading && filteredNotes.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">No notes found. Create your first one!</p>
                </div>
            )}
        </div>
    );
};

export default NotesBoard;
