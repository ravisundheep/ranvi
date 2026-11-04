const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    studentEmail: {
      type: String,
      required: [true, 'Student email is required'],
      trim: true,
      lowercase: true,
    },
    studentPhone: {
      type: String,
      required: [true, 'Student phone number is required'],
      trim: true,
    },
    educationQualification: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    preferredBatch: {
      type: String,
      trim: true,
      default: 'Morning Batch',
    },
    modeOfLearning: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'HYBRID', 'BOTH'],
      default: 'ONLINE',
    },
    feeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    enrollmentStatus: {
      type: String,
      enum: [
        'ACTIVE',
        'ENROLLED',
        'PENDING_PAYMENT',
        'PAYMENT_PENDING_VERIFICATION',
        'EXPIRED',
        'CANCELLED',
        'SUSPENDED',
        'FAILED',
        'REFUNDED',
        'REJECTED',
      ],
      default: 'PENDING_PAYMENT',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
    suspendedReason: {
      type: String,
      default: '',
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

EnrollmentSchema.index({ studentId: 1, courseId: 1 });
EnrollmentSchema.index({ enrollmentStatus: 1, paymentStatus: 1 });
EnrollmentSchema.index({ studentId: 1, enrollmentStatus: 1 });
EnrollmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
