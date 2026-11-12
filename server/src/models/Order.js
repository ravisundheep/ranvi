const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemType: {
    type: String,
    enum: ['COURSE', 'MOCK_TEST_PACKAGE'],
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemModel',
  },
  itemModel: {
    type: String,
    enum: ['Course', 'MockTest'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  receiptNumber: {
    type: String,
    unique: true,
  },
  durationMonths: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
});

OrderSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
