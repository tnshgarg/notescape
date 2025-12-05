/**
 * NST Subject Schema
 * Represents a subject folder containing lecture notes
 */

const mongoose = require('mongoose');

// Note/Lecture schema - individual learning material
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  duration: { type: String }, // e.g., "1:30:00" for lecture duration
  hasAttachment: { type: Boolean, default: false },
  
  // Content - either raw text or extracted from PDF
  content: { type: String },
  
  // Auto-split chapters from content
  chapters: [{
    title: { type: String, required: true },
    content: { type: String, required: true },
    order: { type: Number, default: 0 }
  }],
  
  // File references (if uploaded)
  files: [{
    fileId: { type: mongoose.Schema.Types.ObjectId },
    filename: { type: String },
    mimeType: { type: String }
  }],
  
  // XP configuration
  xpValue: { type: Number, default: 30 },
  
  // Metadata
  order: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Main Subject schema
const nstSubjectSchema = new mongoose.Schema({
  // Basic info
  name: { type: String, required: true }, // e.g., "ADA - Algorithms"
  code: { type: String }, // e.g., "CS301"
  description: { type: String },
  semester: { type: Number },
  
  // Icon/cover
  icon: { type: String, default: '📚' },
  color: { type: String, default: '#6366f1' }, // For folder accent color
  
  // Notes collection
  notes: [noteSchema],
  
  // Teacher personas available for this subject
  teacherPersonas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NstTeacherPersona' }],
  
  // Ownership
  userId: { type: String }, // Clerk user ID (null for global/NST subjects)
  isNstOfficial: { type: Boolean, default: false }, // True for auto-synced NST content
  
  // Stats
  totalNotes: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update totalNotes before saving
nstSubjectSchema.pre('save', function() {
  this.totalNotes = this.notes.length;
  this.updatedAt = new Date();
});

// Index for user queries
nstSubjectSchema.index({ userId: 1 });
nstSubjectSchema.index({ isNstOfficial: 1 });

module.exports = mongoose.model('NstSubject', nstSubjectSchema);
