const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
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
  division: {
    type: String,
    enum: ['BANKERS_PATH', 'COMPETITIVE_EXAMS', 'ENTRANCE_EXAMS', 'TUITIONS'],
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'BookOpen',
  },
  color: {
    type: String,
    default: '#1769D2',
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

CategorySchema.index({ division: 1, sortOrder: 1 });

module.exports = mongoose.model('Category', CategorySchema);
