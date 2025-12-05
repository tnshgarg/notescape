const mongoose = require('mongoose');

// Topic schema for individual topics within units
const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String }, // Extracted text content
  slides: [{
    fileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS file reference
    filename: { type: String },
    pageCount: { type: Number }
  }],
  externalRefs: [{ type: String }], // External reference links
  order: { type: Number, default: 0 },
  generatedNotes: {
    easy: { type: String, default: '' },
    medium: { type: String, default: '' },
    advanced: { type: String, default: '' }
  },
  exploreNotes: { type: String, default: '' } // Beyond slides content
});

// Unit schema for course units
const unitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  topics: [topicSchema],
  order: { type: Number, default: 0 }
});

// Main NST Course schema
const nstCourseSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  subject: { type: String, required: true },
  subjectCode: { type: String }, // e.g., "FIN101"
  description: { type: String },
  coverImage: { type: String },
  units: [unitSchema],
  totalTopics: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update totalTopics before saving
nstCourseSchema.pre('save', function() {
  let count = 0;
  this.units.forEach(unit => {
    count += unit.topics.length;
  });
  this.totalTopics = count;
  this.updatedAt = new Date();
});

module.exports = mongoose.model('NstCourse', nstCourseSchema);
