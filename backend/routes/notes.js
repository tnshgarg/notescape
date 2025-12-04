const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// Get all notes for a user
router.get('/', async (req, res) => {
  try {
    // TODO: Filter by authenticated user
    const notes = await Note.find(); 
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a note
router.post('/', async (req, res) => {
  const note = new Note({
    userId: req.body.userId, // Should come from auth middleware
    title: req.body.title,
    mode: req.body.mode,
    originalContent: req.body.originalContent,
    generatedContent: req.body.generatedContent
  });

  try {
    const newNote = await note.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
