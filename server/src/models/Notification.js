const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['LIVE_CLASS', 'EXAM', 'PAYMENT', 'ANNOUNCEMENT', 'SYSTEM', 'EXAM_ALERT', 'ADMISSION', 'RESULT', 'JOB_ALERT', 'GENERAL'],
      default: 'ANNOUNCEMENT',
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
    link: {
      type: String,
      default: '',
    },
    attachment: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT', 'INACTIVE'],
      default: 'PUBLISHED',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ isPublic: 1, status: 1, expiresAt: 1, isPinned: -1, publishedAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
