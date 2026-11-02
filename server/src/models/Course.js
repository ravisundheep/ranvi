const mongoose = require('mongoose');

const SyllabusModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  topics: [{ type: String }],
});

const FacultyMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String, default: '' },
  experience: { type: String, default: '' },
  bio: { type: String, default: '' },
  photo: { type: String, default: '' },
});

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  division: {
    type: String,
    enum: ['BANKERS_PATH', 'COMPETITIVE_EXAMS', 'ENTRANCE_EXAMS', 'TUITIONS'],
    required: true,
  },
  states: {
    type: [String],
    default: ['All India'],
  },
  tileSubtitle: {
    type: String,
    trim: true,
    default: '',
  },
  tileColor: {
    type: String,
    trim: true,
    default: '',
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false,
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 300,
  },
  fullDescription: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  mode: {
    type: String,
    enum: ['ONLINE', 'OFFLINE', 'BOTH'],
    default: 'BOTH',
  },
  duration: {
    type: String,
    default: '3 Months',
  },
  batchSchedule: {
    type: String,
    default: 'Morning & Evening Batches Available',
  },
  startDate: {
    type: Date,
  },
  fee: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  validityDays: {
    type: Number,
    default: 180, // 6 months access
  },
  isDemoEligible: {
    type: Boolean,
    default: true,
  },
  demoLessonsCount: {
    type: Number,
    default: 2, // Allow first 2 lessons for free demo
  },
  demoExamsCount: {
    type: Number,
    default: 1, // Allow 1 free mock test
  },
  syllabus: [SyllabusModuleSchema],
  learningObjectives: [{ type: String }],
  faculty: [FacultyMemberSchema],
  features: [{ type: String }],
  faqs: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
  }],
  seoTitle: { type: String },
  seoDescription: { type: String },
  tags: [{ type: String }],
  isPublished: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  enrolledStudentsCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

CourseSchema.index({ division: 1, categoryId: 1, isPublished: 1 });
CourseSchema.index({ states: 1, isPublished: 1 });
CourseSchema.index({ isPublished: 1, displayOrder: 1, isFeatured: -1, createdAt: -1 });
CourseSchema.index({ isFeatured: 1 });
CourseSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('Course', CourseSchema);
