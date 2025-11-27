import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Get all notes
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM notes ORDER BY position ASC, created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Create a new note
router.post('/', async (req, res) => {
    const { title, content, category, is_pinned } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO notes (title, content, category, is_pinned) VALUES (?, ?, ?, ?)',
            [title, content, category || 'general', is_pinned || false]
        );
        const newNoteId = result.insertId;
        const [newNote] = await pool.query('SELECT * FROM notes WHERE id = ?', [newNoteId]);
        res.status(201).json(newNote[0]);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Update a note
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, category, is_pinned, position } = req.body;

    try {
        // Build query dynamically based on provided fields
        const fields = [];
        const values = [];

        if (title !== undefined) { fields.push('title = ?'); values.push(title); }
        if (content !== undefined) { fields.push('content = ?'); values.push(content); }
        if (category !== undefined) { fields.push('category = ?'); values.push(category); }
        if (is_pinned !== undefined) { fields.push('is_pinned = ?'); values.push(is_pinned); }
        if (position !== undefined) { fields.push('position = ?'); values.push(position); }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        await pool.query(
            `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        const [updatedNote] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);

        if (updatedNote.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json(updatedNote[0]);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Delete a note
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM notes WHERE id = ?', [id]);
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
