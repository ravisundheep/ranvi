const User = require('../models/User');
const ApprovalRequest = require('../models/ApprovalRequest');
const AuditLog = require('../models/AuditLog');
const Course = require('../models/Course');
const MockTest = require('../models/MockTest');
const Enrollment = require('../models/Enrollment');
const Entitlement = require('../models/Entitlement');
const PayoutRequest = require('../models/PayoutRequest');
const WalletTransaction = require('../models/WalletTransaction');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { reverseReferralReward } = require('./walletController');
const { emitAdminStatsUpdate } = require('../utils/socketService');

const STAFF_ROLES = ['ADMIN', 'FACULTY', 'SUPPORT_STAFF', 'FINANCE_STAFF', 'SUPER_ADMIN'];

// GET /admin/staff - List staff members with optional role filter & search
const getStaffMembers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;

    const query = { role: { $in: STAFF_ROLES } };
    if (role && STAFF_ROLES.includes(role)) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { staffDepartment: { $regex: search, $options: 'i' } },
        { staffDesignation: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await User.countDocuments(query);
    const staff = await User.find(query)
      .populate('assignedCourses', 'title division')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return sendSuccess(res, 'Staff directory retrieved', {
      staff,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/staff - Create a new staff account (Admin or Super Admin only)
const createStaffMember = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      staffDepartment,
      staffDesignation,
      assignedCourses,
    } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return sendError(res, 'name, email, phone, password, and role are required', 400);
    }
    if (!STAFF_ROLES.includes(role)) {
      return sendError(res, `Invalid staff role. Must be one of: ${STAFF_ROLES.join(', ')}`, 400);
    }

    // Only Super Admin can create SUPER_ADMIN or ADMIN accounts
    if (['SUPER_ADMIN', 'ADMIN'].includes(role) && req.user.role !== 'SUPER_ADMIN') {
      return sendError(res, 'Only Super Admin can create SUPER_ADMIN or ADMIN accounts', 403);
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return sendError(res, 'An account with this email already exists', 409);
    }

    const passwordHash = await User.hashPassword(password);

    const newStaff = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      role,
      staffDepartment: staffDepartment ? staffDepartment.trim() : '',
      staffDesignation: staffDesignation ? staffDesignation.trim() : '',
      assignedCourses: Array.isArray(assignedCourses) ? assignedCourses : [],
      createdBy: req.user._id,
      isActive: true,
      isVerified: true,
    });

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'STAFF_CREATED',
      resource: 'User',
      resourceId: newStaff._id.toString(),
      details: { staffEmail: newStaff.email, role: newStaff.role },
      ipAddress: req.ip || '',
    });

    emitAdminStatsUpdate();

    const staffObj = newStaff.toObject();
    delete staffObj.passwordHash;
    return sendSuccess(res, `${role} account created successfully`, staffObj, 201);
  } catch (error) {
    next(error);
  }
};

// PUT /admin/staff/:staffId - Update a staff member's profile, role, or assignments
const updateStaffMember = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const {
      name,
      phone,
      role,
      staffDepartment,
      staffDesignation,
      assignedCourses,
      isActive,
    } = req.body;

    const staffMember = await User.findOne({ _id: staffId, role: { $in: STAFF_ROLES } });
    if (!staffMember) {
      return sendError(res, 'Staff member not found', 404);
    }

    // Prevent non-Super Admins from modifying SUPER_ADMIN or ADMIN accounts
    if (['SUPER_ADMIN', 'ADMIN'].includes(staffMember.role) && req.user.role !== 'SUPER_ADMIN') {
      return sendError(res, 'Only Super Admin can modify ADMIN or SUPER_ADMIN accounts', 403);
    }
    // Prevent promoting to SUPER_ADMIN/ADMIN by non-Super Admin
    if (role && ['SUPER_ADMIN', 'ADMIN'].includes(role) && req.user.role !== 'SUPER_ADMIN') {
      return sendError(res, 'Only Super Admin can assign SUPER_ADMIN or ADMIN roles', 403);
    }

    if (name !== undefined) staffMember.name = name.trim();
    if (phone !== undefined) staffMember.phone = phone.trim();
    if (role !== undefined && STAFF_ROLES.includes(role)) staffMember.role = role;
    if (staffDepartment !== undefined) staffMember.staffDepartment = staffDepartment.trim();
    if (staffDesignation !== undefined) staffMember.staffDesignation = staffDesignation.trim();
    if (Array.isArray(assignedCourses)) staffMember.assignedCourses = assignedCourses;
    if (isActive !== undefined) staffMember.isActive = Boolean(isActive);

    await staffMember.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'STAFF_UPDATED',
      resource: 'User',
      resourceId: staffMember._id.toString(),
      details: { staffEmail: staffMember.email, changes: req.body },
      ipAddress: req.ip || '',
    });

    emitAdminStatsUpdate();

    return sendSuccess(res, 'Staff account updated successfully', staffMember);
  } catch (error) {
    next(error);
  }
};

// POST /admin/staff/:staffId/reset-password - Reset a staff member's password
const resetStaffPassword = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters', 400);
    }

    const staffMember = await User.findOne({ _id: staffId, role: { $in: STAFF_ROLES } }).select('+passwordHash');
    if (!staffMember) {
      return sendError(res, 'Staff member not found', 404);
    }

    // Only Super Admin can reset SUPER_ADMIN/ADMIN passwords
    if (['SUPER_ADMIN', 'ADMIN'].includes(staffMember.role) && req.user.role !== 'SUPER_ADMIN') {
      return sendError(res, 'Only Super Admin can reset ADMIN or SUPER_ADMIN passwords', 403);
    }

    staffMember.passwordHash = await User.hashPassword(newPassword);
    // Invalidate any active refresh token
    staffMember.refreshToken = undefined;
    await staffMember.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'STAFF_PASSWORD_RESET',
      resource: 'User',
      resourceId: staffMember._id.toString(),
      details: { staffEmail: staffMember.email },
      ipAddress: req.ip || '',
    });

    return sendSuccess(res, `Password for ${staffMember.name} has been reset successfully`);
  } catch (error) {
    next(error);
  }
};

// GET /admin/approvals - List maker-checker approval requests
const getApprovalRequests = async (req, res, next) => {
  try {
    const { status, requestType, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      query.status = status;
    }
    if (requestType) {
      query.requestType = requestType;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await ApprovalRequest.countDocuments(query);
    const approvals = await ApprovalRequest.find(query)
      .populate('requestedBy', 'name email role')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return sendSuccess(res, 'Approval requests retrieved', {
      approvals,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/approvals - Create an approval request (Finance / Admin staff)
const createApprovalRequest = async (req, res, next) => {
  try {
    const { requestType, resourceModel, resourceId, targetTitle, payload, reason } = req.body;

    if (!requestType || !resourceModel || !resourceId || !reason) {
      return sendError(res, 'requestType, resourceModel, resourceId, and reason are required', 400);
    }

    const approval = await ApprovalRequest.create({
      requestType,
      resourceModel,
      resourceId,
      targetTitle: targetTitle || '',
      payload: payload || {},
      reason: reason.trim(),
      requestedBy: req.user._id,
      requestedRole: req.user.role,
      status: 'PENDING',
    });

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'APPROVAL_REQUESTED',
      resource: 'ApprovalRequest',
      resourceId: approval._id.toString(),
      details: { requestType, resourceModel, reason },
      ipAddress: req.ip || '',
    });

    return sendSuccess(res, 'Approval request submitted and pending review', approval, 201);
  } catch (error) {
    next(error);
  }
};

// PUT /admin/approvals/:id/review - Approve or reject a pending request (Admin/Super Admin only)
const reviewApprovalRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, reviewedNote } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return sendError(res, 'decision must be APPROVED or REJECTED', 400);
    }

    const approval = await ApprovalRequest.findById(id).populate('requestedBy', 'name email role');
    if (!approval) {
      return sendError(res, 'Approval request not found', 404);
    }
    if (approval.status !== 'PENDING') {
      return sendError(res, `This request has already been ${approval.status.toLowerCase()}`, 409);
    }
    // Prevent self-approval (the requester cannot approve their own request)
    if (String(approval.requestedBy?._id) === String(req.user._id)) {
      return sendError(res, 'You cannot approve or reject your own approval request', 403);
    }

    approval.status = decision;
    approval.reviewedBy = req.user._id;
    approval.reviewedNote = reviewedNote ? reviewedNote.trim() : '';
    approval.reviewedAt = new Date();
    await approval.save();

    // Execute approved business mutation atomically
    if (decision === 'APPROVED') {
      const p = approval.payload || {};
      if (approval.requestType === 'FEE_CHANGE' || approval.requestType === 'DISCOUNT_OVERRIDE') {
        const feePatch = {};
        if (p.fee !== undefined) feePatch.fee = Number(p.fee);
        if (p.originalPrice !== undefined) feePatch.originalPrice = Number(p.originalPrice);
        if (p.price !== undefined) feePatch.price = Number(p.price);

        if (approval.resourceModel === 'Course' && Object.keys(feePatch).length > 0) {
          await Course.findByIdAndUpdate(approval.resourceId, feePatch, { new: true });
        } else if (approval.resourceModel === 'MockTest' && Object.keys(feePatch).length > 0) {
          await MockTest.findByIdAndUpdate(approval.resourceId, feePatch, { new: true });
        }
      } else if (approval.requestType === 'REFUND_REQUEST' && approval.resourceModel === 'Enrollment') {
        const enrollment = await Enrollment.findById(approval.resourceId);
        if (enrollment) {
          enrollment.enrollmentStatus = 'REFUNDED';
          enrollment.paymentStatus = 'REFUNDED';
          enrollment.refundedAt = new Date();
          if (approval.reviewedNote) enrollment.notes = approval.reviewedNote;
          await enrollment.save();

          await Entitlement.updateMany(
            { studentId: enrollment.studentId, itemId: enrollment.courseId },
            { isActive: false, status: 'REFUNDED', refundedAt: new Date() }
          );
          await reverseReferralReward(enrollment.orderId, enrollment.studentId, 'Approved refund request');
        }
      } else if (approval.requestType === 'REFERRAL_PAYOUT' && approval.resourceModel === 'PayoutRequest') {
        await PayoutRequest.findByIdAndUpdate(approval.resourceId, {
          status: 'APPROVED',
          adminNote: approval.reviewedNote || 'Approved via Maker-Checker Approvals Queue',
        });
      } else if (approval.requestType === 'REFERRAL_REWARD_ADJUSTMENT' && approval.resourceModel === 'User') {
        const delta = Number(p.amount || 0);
        if (delta !== 0) {
          const targetStudent = await User.findById(approval.resourceId);
          if (targetStudent) {
            targetStudent.walletBalance = Math.max(0, (targetStudent.walletBalance || 0) + delta);
            await targetStudent.save();
            await WalletTransaction.create({
              transactionId: `WTX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
              userId: targetStudent._id,
              type: delta >= 0 ? 'CREDIT' : 'DEBIT',
              source: 'ADMIN_ADJUSTMENT',
              amount: Math.abs(delta),
              balanceAfter: targetStudent.walletBalance,
              description: approval.reason || 'Approved referral reward adjustment',
              status: 'COMPLETED',
            });
          }
        }
      } else if (approval.requestType === 'MANUAL_ENTITLEMENT' && p.studentId && p.itemId) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + Number(p.validityDays || 180));
        await Entitlement.findOneAndUpdate(
          { studentId: p.studentId, itemId: p.itemId },
          {
            studentId: p.studentId,
            itemType: p.itemType || 'COURSE',
            itemId: p.itemId,
            itemModel: p.itemModel || 'Course',
            isActive: true,
            status: 'ACTIVE',
            validUntil,
            grantedBy: req.user._id,
          },
          { upsert: true, new: true }
        );
      }
    }

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: `APPROVAL_${decision}`,
      resource: 'ApprovalRequest',
      resourceId: approval._id.toString(),
      details: {
        requestType: approval.requestType,
        decision,
        reviewedNote: approval.reviewedNote,
        requestedBy: approval.requestedBy?.email,
      },
      ipAddress: req.ip || '',
    });

    return sendSuccess(res, `Approval request has been ${decision.toLowerCase()}`, approval);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  resetStaffPassword,
  getApprovalRequests,
  createApprovalRequest,
  reviewApprovalRequest,
};
