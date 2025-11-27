import express from 'express';
import pool from '../db.js';
import { verifyToken } from './auth.js';

const router = express.Router();

router.use(verifyToken);

// Get all notes for the authenticated user
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM notes WHERE user_id = ? ORDER BY position ASC, created_at DESC',
            [req.user.id]
        );

        // Parse JSON items field
        const notes = rows.map(note => ({
            ...note,
            items: typeof note.items === 'string' ? JSON.parse(note.items) : note.items
        }));

        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Create a new note
router.post('/', async (req, res) => {
    const { title, category, items, is_pinned } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO notes (user_id, title, category, items, is_pinned) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, title, category || 'general', JSON.stringify(items || []), is_pinned || false]
        );
        const newNoteId = result.insertId;
        const [newNote] = await pool.query('SELECT * FROM notes WHERE id = ?', [newNoteId]);

        const note = newNote[0];
        res.status(201).json({
            ...note,
            items: typeof note.items === 'string' ? JSON.parse(note.items) : note.items
        });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Update a note
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, category, items, is_pinned, position } = req.body;

    try {
        const fields = [];
        const values = [];

        if (title !== undefined) { fields.push('title = ?'); values.push(title); }
        if (category !== undefined) { fields.push('category = ?'); values.push(category); }
        if (items !== undefined) { fields.push('items = ?'); values.push(JSON.stringify(items)); }
        if (is_pinned !== undefined) { fields.push('is_pinned = ?'); values.push(is_pinned); }
        if (position !== undefined) { fields.push('position = ?'); values.push(position); }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        values.push(req.user.id);

        await pool.query(
            `UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );

        const [updatedNote] = await pool.query('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, req.user.id]);

        if (updatedNote.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const note = updatedNote[0];
        res.json({
            ...note,
            items: typeof note.items === 'string' ? JSON.parse(note.items) : note.items
        });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Delete a note
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

export default router;
