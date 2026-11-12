const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  whatsappNumber: {
    type: String,
    trim: true,
    default: '',
  },
  requestACall: {
    type: Boolean,
    default: false,
  },
  qualification: {
    type: String,
    trim: true,
    default: '',
  },
  careerGoals: {
    type: String,
    trim: true,
    default: '',
  },
  division: {
    type: String,
    enum: ['BANKERS_PATH', 'COMPETITIVE_EXAMS', 'ENTRANCE_EXAMS', 'TUITIONS', 'GENERAL'],
    default: 'GENERAL',
  },
  courseInterest: {
    type: String,
    default: 'General Coaching Enquiry',
  },
  type: {
    type: String,
    enum: ['GENERAL', 'DEMO_CLASS', 'OFFLINE_ADMISSION', 'COUNSELING', 'CAREER_GUIDANCE', 'SUPPORT_TICKET'],
    default: 'GENERAL',
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
  },
  preferredMode: {
    type: String,
    enum: ['ONLINE', 'OFFLINE', 'BOTH'],
    default: 'BOTH',
  },
  preferredSchedule: {
    type: String,
    default: 'Flexible',
  },
  message: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['NEW', 'PENDING', 'IN_PROGRESS', 'ANSWERED', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'CLOSED'],
    default: 'NEW',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedRole: {
    type: String,
    enum: ['NONE', 'STAFF', 'FACULTY', 'COUNSELOR', 'ADMIN'],
    default: 'NONE',
  },
  resolutionNote: {
    type: String,
    default: '',
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  adminNotes: [{
    note: String,
    addedBy: String,
    addedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

EnquirySchema.index({ status: 1, createdAt: -1 });
EnquirySchema.index({ studentId: 1, createdAt: -1 });
EnquirySchema.index({ type: 1, division: 1 });

module.exports = mongoose.model('Enquiry', EnquirySchema);
