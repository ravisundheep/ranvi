const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userEmail: {
    type: String,
  },
  userRole: {
    type: String,
  },
  action: {
    type: String,
    required: true,
  },
  resource: {
    type: String,
    required: true,
  },
  resourceId: {
    type: String,
  },
  category: {
    type: String,
    enum: ['AUTH', 'FINANCIAL', 'STAFF_RBAC', 'CONTENT', 'SYSTEM'],
    default: 'SYSTEM',
  },
  isImmutable: {
    type: Boolean,
    default: false,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
});

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 });
AuditLogSchema.index({ resource: 1, action: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
