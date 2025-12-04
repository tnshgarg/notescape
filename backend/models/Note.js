const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Clerk ID
  title: { type: String, required: true },
  originalContent: { type: String }, // Text content or URL
  generatedContent: { type: String }, // Markdown/HTML
  mode: { type: String, enum: ['Socrates', 'Aristotle', 'Plato'], required: true },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);
