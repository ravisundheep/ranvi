const mongoose = require('mongoose');

const LatestUpdateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Update title is required'],
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      required: [true, 'Update content or description is required'],
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    imageOrAttachment: {
      type: String,
      trim: true,
      default: '',
    },
    badgeText: {
      type: String,
      trim: true,
      default: 'Latest Update',
    },
    isJobAlert: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ['BANKING', 'CENTRAL_GOVT', 'STATE_GOVT', 'INSURANCE', 'RAILWAYS', 'DEFENSE', 'TEACHING', 'GENERAL'],
      default: 'GENERAL',
    },
    organization: {
      type: String,
      trim: true,
      default: '',
    },
    postName: {
      type: String,
      trim: true,
      default: '',
    },
    vacancies: {
      type: Number,
      default: 0,
    },
    qualification: {
      type: String,
      trim: true,
      default: '',
    },
    ageLimit: {
      type: String,
      trim: true,
      default: '',
    },
    applicationStartDate: {
      type: Date,
    },
    applicationEndDate: {
      type: Date,
    },
    applyOnlineUrl: {
      type: String,
      trim: true,
      default: '',
    },
    officialNotificationPdfUrl: {
      type: String,
      trim: true,
      default: '',
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT'],
      default: 'PUBLISHED',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

LatestUpdateSchema.index({ status: 1, isPinned: -1, displayOrder: 1, publishedAt: -1 });

module.exports = mongoose.model('LatestUpdate', LatestUpdateSchema);
