/**
 * NST Teacher Persona Schema
 * AI personalities that students can learn from
 */

const mongoose = require('mongoose');

const nstTeacherPersonaSchema = new mongoose.Schema({
  // Identity
  name: { type: String, required: true },
  title: { type: String }, // e.g., "Professor of Algorithms"
  avatar: { type: String }, // URL or emoji
  
  // Teaching style
  style: {
    type: String,
    enum: ['academic', 'practical', 'socratic', 'visual'],
    default: 'academic'
  },
  
  // Short description of teaching approach
  description: { type: String },
  
  // AI personality configuration
  personality: { type: String }, // Short personality traits
  
  // System prompt for AI - defines how this teacher responds
  systemPrompt: { type: String, required: true },
  
  // What subjects this teacher specializes in
  subjects: [{ type: String }], // Subject codes
  
  // Visual styling
  accentColor: { type: String, default: '#6366f1' },
  
  // Availability
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false }, // One default teacher
  
  // Stats
  totalSessions: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NstTeacherPersona', nstTeacherPersonaSchema);
