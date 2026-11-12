const mongoose = require('mongoose');

const PayoutRequestSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 100, // Minimum payout limit in INR
    },
    payoutMethod: {
      type: String,
      enum: ['UPI', 'BANK_TRANSFER'],
      default: 'UPI',
    },
    paymentDetails: {
      upiId: { type: String, trim: true, default: '' },
      bankAccountNumber: { type: String, trim: true, default: '' },
      ifscCode: { type: String, trim: true, uppercase: true, default: '' },
      accountHolderName: { type: String, trim: true, default: '' },
      bankName: { type: String, trim: true, default: '' },
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'],
      default: 'PENDING',
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '', // UTR / IMPS / Bank Transaction Reference
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PayoutRequestSchema.index({ status: 1, createdAt: -1 });
PayoutRequestSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PayoutRequest', PayoutRequestSchema);
