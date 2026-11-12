const mongoose = require('mongoose');

const MockTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  paperNumber: {
    type: Number,
    default: 1,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  division: {
    type: String,
    enum: ['BANKERS_PATH', 'COMPETITIVE_EXAMS', 'ENTRANCE_EXAMS', 'TUITIONS'],
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 60,
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 100,
  },
  passMarks: {
    type: Number,
    default: 40,
  },
  negativeMarkingPerQuestion: {
    type: Number,
    default: 0.25,
  },
  marksPerQuestion: {
    type: Number,
    default: 1,
  },
  isDemoFree: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    default: 0,
  },
  instructions: [{
    type: String,
  }],
  showSolutionImmediately: {
    type: Boolean,
    default: true,
  },
  paperPdfUrl: {
    type: String,
    default: '',
  },
  paperPdfName: {
    type: String,
    default: '',
  },
  solutionPdfUrl: {
    type: String,
    default: '',
  },
  solutionPdfName: {
    type: String,
    default: '',
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  attemptsCount: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 0,  // 0 = unlimited
  },
  negativeMarkingEnabled: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

MockTestSchema.index({ courseId: 1, isPublished: 1 });
MockTestSchema.index({ division: 1, isDemoFree: 1 });

module.exports = mongoose.model('MockTest', MockTestSchema);
