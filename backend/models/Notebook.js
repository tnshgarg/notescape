const mongoose = require('mongoose');

// Chapter schema for storing sections/chunks of content
const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startPage: { type: Number },
  endPage: { type: Number },
  content: { type: String, required: true },
  order: { type: Number, default: 0 },
  wordCount: { type: Number },
  generatedNotes: {
    socrates: { type: String, default: '' },
    aristotle: { type: String, default: '' },
    plato: { type: String, default: '' }
  }
});

const sourceSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'text', 'markdown', 'url', 'youtube'], required: true },
  content: { type: String }, // For text/markdown, or extracted PDF text
  pdfData: { type: String }, // Base64-encoded PDF binary for rendering
  url: { type: String }, // For URL/YouTube sources
  uploadedAt: { type: Date, default: Date.now },
  size: { type: Number }, // File size in bytes
  pageCount: { type: Number }, // For PDFs
  chapters: [chapterSchema], // Extracted chapters/sections
  isChunked: { type: Boolean, default: false } // Whether chapters have been extracted
});

const notebookSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Creator's Clerk ID
  authorName: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  sources: [sourceSchema], // Uploaded files and content
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
  generatedNotes: {
    socrates: { type: String, default: '' },
    aristotle: { type: String, default: '' },
    plato: { type: String, default: '' }
  },
  isPublic: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }], // Array of user IDs who liked
  category: { type: String },
  coverImage: { type: String }, // URL or base64 thumbnail
  lastAccessed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notebook', notebookSchema);
