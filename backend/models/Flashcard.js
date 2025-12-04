const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Clerk ID
  notebookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notebook', required: true },
  sourceId: { type: String }, // Optional - specific source the card was generated from
  
  // Card Content
  front: { type: String, required: true }, // Question/prompt
  back: { type: String, required: true }, // Answer
  
  // Categorization
  topic: { type: String },
  tags: [{ type: String }],
  
  // Spaced Repetition Fields (SM-2 algorithm)
  easeFactor: { type: Number, default: 2.5 }, // Difficulty multiplier
  interval: { type: Number, default: 1 }, // Days until next review
  repetitions: { type: Number, default: 0 }, // Times correctly answered in a row
  nextReviewDate: { type: Date, default: Date.now },
  
  // Stats
  timesReviewed: { type: Number, default: 0 },
  timesCorrect: { type: Number, default: 0 },
  lastReviewedAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// SM-2 Algorithm for spaced repetition
flashcardSchema.methods.updateAfterReview = function(quality) {
  // quality: 0-5 (0-2 = incorrect, 3-5 = correct with varying ease)
  this.timesReviewed += 1;
  this.lastReviewedAt = new Date();
  
  if (quality >= 3) {
    this.timesCorrect += 1;
    
    if (this.repetitions === 0) {
      this.interval = 1;
    } else if (this.repetitions === 1) {
      this.interval = 6;
    } else {
      this.interval = Math.round(this.interval * this.easeFactor);
    }
    
    this.repetitions += 1;
  } else {
    this.repetitions = 0;
    this.interval = 1;
  }
  
  // Update ease factor
  this.easeFactor = Math.max(1.3, this.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  
  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + this.interval);
  this.nextReviewDate = nextReview;
  
  this.updatedAt = new Date();
  return this.save();
};

// Index for efficient querying
flashcardSchema.index({ userId: 1, notebookId: 1 });
flashcardSchema.index({ userId: 1, nextReviewDate: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
