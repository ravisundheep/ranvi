const mongoose = require('mongoose');

const ApprovalRequestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: [
        'FEE_CHANGE',
        'DISCOUNT_OVERRIDE',
        'MANUAL_ENTITLEMENT',
        'REFUND_REQUEST',
        'REFERRAL_PAYOUT',
        'REFERRAL_REWARD_ADJUSTMENT',
      ],
      required: true,
    },
    resourceModel: {
      type: String,
      enum: ['Course', 'MockTest', 'Enrollment', 'Entitlement', 'User', 'PayoutRequest'],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetTitle: {
      type: String,
      trim: true,
      default: '',
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    reason: {
      type: String,
      required: [true, 'Justification reason is required for sensitive approvals'],
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedRole: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedNote: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ApprovalRequestSchema.index({ status: 1, createdAt: -1 });
ApprovalRequestSchema.index({ requestedBy: 1, status: 1 });

module.exports = mongoose.model('ApprovalRequest', ApprovalRequestSchema);
