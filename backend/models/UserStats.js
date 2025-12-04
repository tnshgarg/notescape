const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ['notebook_created', 'notes_generated', 'flashcard_studied', 'source_added'],
    required: true 
  },
  notebookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notebook' },
  xpEarned: { type: Number, default: 0 }
});

const userStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Clerk ID
  
  // XP and Leveling
  totalXP: { type: Number, default: 0 },
  
  // Streak Tracking
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  
  // Learning Stats
  topicsLearned: { type: Number, default: 0 },
  flashcardsStudied: { type: Number, default: 0 },
  totalStudyMinutes: { type: Number, default: 0 },
  
  // Weekly Stats (reset every Monday)
  weeklyTopics: { type: Number, default: 0 },
  weeklyFlashcards: { type: Number, default: 0 },
  weeklyXP: { type: Number, default: 0 },
  weekStartDate: { type: Date },
  
  // Activity History (for streak calendar)
  activityHistory: [activitySchema],
  
  // Achievements
  achievements: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    unlockedAt: { type: Date, default: Date.now },
    icon: { type: String }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Methods
userStatsSchema.methods.addXP = function(amount, activityType, notebookId = null) {
  const activity = {
    date: new Date(),
    type: activityType,
    notebookId,
    xpEarned: amount
  };
  
  this.totalXP += amount;
  this.weeklyXP += amount;
  this.activityHistory.push(activity);
  
  // Update streak
  const today = new Date().toDateString();
  const lastActive = this.lastActiveDate ? new Date(this.lastActiveDate).toDateString() : null;
  
  if (lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastActive === yesterday.toDateString()) {
      this.currentStreak += 1;
    } else if (lastActive !== today) {
      this.currentStreak = 1;
    }
    
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
    
    this.lastActiveDate = new Date();
  }
  
  this.updatedAt = new Date();
  return this.save();
};

// Calculate level from XP
userStatsSchema.virtual('level').get(function() {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 11000, 16000, 22000];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (this.totalXP >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
});

userStatsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('UserStats', userStatsSchema);
