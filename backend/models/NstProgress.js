/**
 * NST Progress Schema
 * Tracks user progress per subject and notes
 */

const mongoose = require('mongoose');

// Progress for individual note
const noteProgressSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  // Completion tracking
  started: { type: Boolean, default: false },
  startedAt: { type: Date },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  
  // Chapter progress
  chaptersCompleted: [{ type: Number }], // Array of completed chapter indices
  currentChapter: { type: Number, default: 0 },
  
  // Difficulty used
  difficultyUsed: {
    type: String,
    enum: ['easy', 'medium', 'advanced'],
    default: 'medium'
  },
  
  // XP earned from this note
  xpEarned: { type: Number, default: 0 },
  xpMultiplier: { type: Number, default: 1 }, // 1x, 1.5x, 2x based on difficulty
  
  // Quiz attempts
  quizAttempts: { type: Number, default: 0 },
  bestQuizScore: { type: Number, default: 0 },
  
  // Teacher used
  teacherPersonaUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'NstTeacherPersona' },
  
  // Time spent (in seconds)
  timeSpent: { type: Number, default: 0 }
});

// Main progress schema per user per subject
const nstProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Clerk user ID
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'NstSubject', required: true },
  
  // Overall stats for this subject
  totalXp: { type: Number, default: 0 },
  completedNotes: { type: Number, default: 0 },
  
  // Progress per note
  noteProgress: [noteProgressSchema],
  
  // Preferred settings
  preferredDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'advanced'],
    default: 'medium'
  },
  preferredTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'NstTeacherPersona' },
  
  // Streak tracking
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for user-subject queries
nstProgressSchema.index({ userId: 1, subjectId: 1 }, { unique: true });

// Calculate completion percentage
nstProgressSchema.methods.getCompletionPercentage = function(totalNotes) {
  if (totalNotes === 0) return 0;
  return Math.round((this.completedNotes / totalNotes) * 100);
};

module.exports = mongoose.model('NstProgress', nstProgressSchema);
