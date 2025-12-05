const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  username: { type: String },
  savedNotebooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notebook' }],
  
  // Onboarding
  onboardingComplete: { type: Boolean, default: false },
  interests: [{ type: String }],
  college: { type: String }, // 'nst' for now
  
  // NST Access
  isNstVerified: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-verify NST access based on email domain
userSchema.pre('save', async function() {
  if (this.email && this.email.endsWith('@nst.rishihood.edu.in')) {
    this.isNstVerified = true;
    this.college = 'nst';
  }
  this.updatedAt = new Date();
});

module.exports = mongoose.model('User', userSchema);

