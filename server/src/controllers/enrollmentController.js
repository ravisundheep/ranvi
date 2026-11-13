const crypto = require('crypto');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Entitlement = require('../models/Entitlement');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const ApprovalRequest = require('../models/ApprovalRequest');
const env = require('../config/env');
const { razorpayInstance, isRazorpayConfigured, verifySignature } = require('../config/razorpay');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { emitEnrollmentChange, emitNewOrderPlaced, emitAdminStatsUpdate } = require('../utils/socketService');
const { reverseReferralReward } = require('./walletController');

// Student: Initiate enrollment & create gateway checkout intent
const createEnrollmentIntent = async (req, res) => {
  try {
    const studentId = req.user._id;
    const {
      courseId,
      preferredBatch,
      batchTiming,
      modeOfLearning = 'ONLINE',
      educationQualification = '',
      city = '',
      state = '',
      phone = '',
      name = '',
      parentName = '',
      studentSchool = '',
      address = '',
      notes = '',
      durationMonths = null,
    } = req.body;

    const resolvedBatch = preferredBatch || batchTiming || 'Morning Batch';

    if (!courseId) {
      return sendError(res, 'Course/Program ID is required', 400);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Coaching/Tuition program not found', 404);
    }

    if (!course.isPublished) {
      return sendError(res, 'This program is currently not published for enrollment', 400);
    }

    if (course.isEnrollmentOpen === false) {
      return sendError(res, 'Enrollment for this program is currently closed', 400);
    }

    if (typeof course.availableSeats === 'number' && course.availableSeats <= 0) {
      return sendError(res, 'Registration is full for this program. No seats available.', 400);
    }

    const now = new Date();

    // Check duplicate active enrollment or active entitlement
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      courseId,
      enrollmentStatus: { $in: ['ENROLLED', 'ACTIVE'] },
      $or: [{ validUntil: { $gte: now } }, { validUntil: null }, { validUntil: { $exists: false } }],
    });

    const existingEntitlement = await Entitlement.findOne({
      studentId,
      itemId: courseId,
      isActive: true,
      status: { $in: ['ACTIVE', 'ENROLLED'] },
      validUntil: { $gte: now },
    });

    if (existingEnrollment || existingEntitlement) {
      return sendError(res, 'You already have an active subscription for this program', 400, {
        enrollmentId: existingEnrollment?.enrollmentId,
        validUntil: existingEnrollment?.validUntil || existingEntitlement?.validUntil,
      });
    }

    const studentName = (name || req.user.name || 'Student').trim();
    const studentEmail = (req.user.email || '').trim().toLowerCase();
    const studentPhone = (phone || req.user.phone || '').trim();

    if (!studentPhone) {
      return sendError(res, 'Phone number is required for enrollment', 400);
    }

    let feeAmount = course.fee;
    let finalAmount = course.fee;
    let resolvedDurationMonths = durationMonths ? Number(durationMonths) : null;

    if (resolvedDurationMonths && Array.isArray(course.subscriptionPlans)) {
      const matchedPlan = course.subscriptionPlans.find((p) => p.durationMonths === resolvedDurationMonths);
      if (matchedPlan) {
        feeAmount = matchedPlan.price;
        finalAmount = matchedPlan.price;
      }
    }

    const discountAmount = course.originalPrice && course.originalPrice > feeAmount
      ? course.originalPrice - feeAmount
      : 0;

    const enrollmentId = `ENR-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Free program handling (fee === 0)
    if (finalAmount === 0) {
      const receiptNumber = `FREE-RANVI-${Date.now()}`;
      const validUntil = new Date(Date.now() + (course.validityDays || 180) * 24 * 60 * 60 * 1000);

      const order = await Order.create({
        studentId,
        itemType: 'COURSE',
        itemId: course._id,
        itemModel: 'Course',
        amount: 0,
        currency: 'INR',
        razorpayOrderId: `free_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        status: 'PAID',
        receiptNumber,
        durationMonths: resolvedDurationMonths,
      });

      await Entitlement.findOneAndUpdate(
        { studentId, itemId: course._id },
        {
          studentId,
          itemType: 'COURSE',
          itemId: course._id,
          itemModel: 'Course',
          orderId: order._id,
          validFrom: now,
          validUntil,
          isActive: true,
          status: 'ACTIVE',
          grantedBy: 'PAYMENT',
          grantReason: `Enrolled in ${course.title} (Free Access)`,
        },
        { upsert: true, new: true }
      );

      await Enrollment.create({
        enrollmentId,
        studentId,
        courseId: course._id,
        orderId: order._id,
        studentName,
        studentEmail,
        studentPhone,
        educationQualification,
        city,
        state,
        preferredBatch: resolvedBatch,
        parentName,
        studentSchool,
        address,
        notes,
        modeOfLearning,
        feeAmount: 0,
        discountAmount,
        finalAmount: 0,
        enrollmentStatus: 'ENROLLED',
        paymentStatus: 'PAID',
        validFrom: now,
        validUntil,
      });

      // Update seat counts safely
      const courseUpdate = { $inc: { enrolledStudentsCount: 1 } };
      if (typeof course.availableSeats === 'number' && course.availableSeats > 0) {
        courseUpdate.$inc.availableSeats = -1;
      }
      await Course.findByIdAndUpdate(course._id, courseUpdate);

      // Student notification
      await Notification.create({
        recipientId: studentId,
        title: 'Enrollment Confirmed!',
        message: `You are successfully enrolled in ${course.title}. Welcome aboard!`,
        type: 'ADMISSION',
        link: `/student/enrollments`,
      });

      emitEnrollmentChange(studentId, {
        type: 'ENROLLMENT_COMPLETED',
        enrollmentId,
        courseTitle: course.title,
      });
      emitAdminStatsUpdate({ reason: 'FREE_ENROLLMENT_COMPLETED' });

      return sendSuccess(res, 'Free enrollment confirmed successfully', {
        enrollmentId,
        isFree: true,
        enrollmentStatus: 'ENROLLED',
        receiptNumber,
      }, 201);
    }

    if (!isRazorpayConfigured()) {
      return sendError(
        res,
        'Online payment gateway is not configured. Please contact administration or configure Razorpay keys.',
        503
      );
    }

    // Paid program -> Create Gateway Order (Razorpay)
    let razorpayOrder;
    try {
      razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(finalAmount * 100), // in paise
        currency: 'INR',
        receipt: `rcpt_${enrollmentId.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        notes: {
          enrollmentId,
          courseId: course._id.toString(),
          studentId: studentId.toString(),
          studentEmail,
        },
      });
    } catch (gatewayErr) {
      console.error('Gateway order creation failed:', gatewayErr);
      return sendError(res, 'Unable to initialize payment gateway order. Please try again.', 502);
    }

    const order = await Order.create({
      studentId,
      itemType: 'COURSE',
      itemId: course._id,
      itemModel: 'Course',
      amount: finalAmount,
      currency: 'INR',
      razorpayOrderId: razorpayOrder.id,
      status: 'PENDING',
      receiptNumber: `REC-${Date.now()}`,
      durationMonths: resolvedDurationMonths,
    });

    await Enrollment.create({
      enrollmentId,
      studentId,
      courseId: course._id,
      orderId: order._id,
      studentName,
      studentEmail,
      studentPhone,
      educationQualification,
      city,
      state,
      preferredBatch: resolvedBatch,
      parentName,
      studentSchool,
      address,
      notes,
      modeOfLearning,
      feeAmount,
      discountAmount,
      finalAmount,
      enrollmentStatus: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
    });

    return sendSuccess(res, 'Enrollment order initialized', {
      enrollmentId,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: finalAmount,
      currency: 'INR',
      key: env.RAZORPAY_KEY_ID,
      keyId: env.RAZORPAY_KEY_ID,
      programTitle: course.title,
      studentName,
      studentEmail,
      studentPhone,
    }, 201);
  } catch (error) {
    console.error('Error in createEnrollmentIntent:', error);
    return sendError(res, error.message || 'Failed to initiate enrollment', 500);
  }
};

// Student: Securely verify payment signature on backend
const verifyEnrollmentPayment = async (req, res) => {
  try {
    const studentId = req.user._id;
    const {
      enrollmentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!enrollmentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, 'Payment verification credentials missing', 400);
    }

    const enrollment = await Enrollment.findOne({ enrollmentId, studentId }).populate('courseId');
    if (!enrollment) {
      return sendError(res, 'Enrollment record not found', 404);
    }

    // Check if already enrolled to prevent double execution
    if (enrollment.enrollmentStatus === 'ENROLLED' && enrollment.paymentStatus === 'PAID') {
      return sendSuccess(res, 'Enrollment already verified and active', enrollment);
    }

    // Load linked Order and verify order ID binding
    let order = null;
    if (enrollment.orderId) {
      order = await Order.findById(enrollment.orderId);
    }
    if (!order) {
      order = await Order.findOne({ razorpayOrderId: razorpay_order_id, studentId });
    }
    if (!order || order.razorpayOrderId !== razorpay_order_id) {
      return sendError(res, 'Order ID mismatch. Verification rejected.', 400);
    }

    // Check duplicate payment reference reuse across different orders
    const duplicatePayment = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (duplicatePayment && duplicatePayment.orderId.toString() !== order._id.toString()) {
      return sendError(res, 'Payment ID has already been applied to another order', 409);
    }

    // Strict HMAC-SHA256 signature verification (no bypasses)
    const isSignatureValid = verifySignature(order.razorpayOrderId, razorpay_payment_id, razorpay_signature);
    if (!isSignatureValid) {
      order.status = 'FAILED';
      await order.save();
      await Enrollment.findByIdAndUpdate(enrollment._id, {
        enrollmentStatus: 'CANCELLED',
        paymentStatus: 'FAILED',
        notes: 'Payment verification signature mismatch',
      });
      await AuditLog.create({
        userId: studentId,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'ENROLLMENT_SIGNATURE_FAILED',
        resource: 'Enrollment',
        resourceId: enrollment._id.toString(),
        ipAddress: req.ip || '127.0.0.1',
        details: { enrollmentId, razorpay_order_id, razorpay_payment_id },
      });
      return sendError(res, 'Payment verification failed: Signature mismatch', 400);
    }

    const receiptNumber = order.receiptNumber || `REC-RANVI-${Date.now()}`;

    // Create Payment record idempotently
    let payment = duplicatePayment;
    if (!payment) {
      payment = await Payment.create({
        orderId: order._id,
        studentId,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: order.razorpayOrderId,
        razorpaySignature: razorpay_signature,
        amount: enrollment.finalAmount,
        currency: 'INR',
        status: 'SUCCESS',
        paymentMethod: 'ONLINE_GATEWAY',
        transactionRef: razorpay_payment_id,
      });
    }

    order.status = 'PAID';
    order.paymentId = payment._id;
    await order.save();

    // Update Enrollment
    const now = new Date();
    let validUntil;
    if (order.durationMonths && order.durationMonths > 0) {
      validUntil = new Date(now);
      validUntil.setMonth(validUntil.getMonth() + order.durationMonths);
    } else {
      const validityDays = enrollment.courseId?.validityDays || 180;
      validUntil = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
    }

    enrollment.enrollmentStatus = 'ENROLLED';
    enrollment.paymentStatus = 'PAID';
    enrollment.paymentId = payment._id;
    enrollment.validFrom = now;
    enrollment.validUntil = validUntil;
    await enrollment.save();

    // Create or update Entitlement atomically
    await Entitlement.findOneAndUpdate(
      { studentId, itemId: enrollment.courseId?._id || enrollment.courseId },
      {
        studentId,
        itemType: 'COURSE',
        itemId: enrollment.courseId?._id || enrollment.courseId,
        itemModel: 'Course',
        orderId: order._id,
        validFrom: now,
        validUntil,
        isActive: true,
        status: 'ACTIVE',
        grantedBy: 'PAYMENT',
        grantReason: `Verified Gateway Payment for ${enrollment.courseId?.title || 'Program'}`,
      },
      { upsert: true, new: true }
    );

    // Update seats & counts safely
    if (enrollment.courseId?._id) {
      const courseUpdate = { $inc: { enrolledStudentsCount: 1 } };
      if (typeof enrollment.courseId.availableSeats === 'number' && enrollment.courseId.availableSeats > 0) {
        courseUpdate.$inc.availableSeats = -1;
      }
      await Course.findByIdAndUpdate(enrollment.courseId._id, courseUpdate);
    }

    // Audit log
    await AuditLog.create({
      action: 'ENROLLMENT_VERIFIED',
      resource: 'Enrollment',
      resourceId: enrollment._id.toString(),
      category: 'FINANCIAL',
      isImmutable: true,
      userId: studentId,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || '127.0.0.1',
      details: {
        enrollmentId,
        courseId: enrollment.courseId?._id,
        paymentId: razorpay_payment_id,
        amount: enrollment.finalAmount,
      },
    });

    // In-app Notification
    await Notification.create({
      recipientId: studentId,
      title: 'Payment Successful & Enrolled!',
      message: `Your enrollment for ${enrollment.courseId?.title || 'Program'} is confirmed. Receipt: ${receiptNumber}`,
      type: 'PAYMENT',
      link: '/student/enrollments',
    });

    emitEnrollmentChange(studentId, {
      type: 'ENROLLMENT_VERIFIED',
      enrollmentId,
      amount: enrollment.finalAmount,
    });
    emitNewOrderPlaced(order);
    emitAdminStatsUpdate({ reason: 'ENROLLMENT_VERIFIED' });

    return sendSuccess(res, 'Payment verified and enrollment completed successfully', {
      enrollmentId,
      receiptNumber,
      enrollmentStatus: 'ENROLLED',
      paymentStatus: 'PAID',
      transactionRef: razorpay_payment_id,
      amount: enrollment.finalAmount,
      courseTitle: enrollment.courseId?.title,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return sendError(res, error.message || 'Payment verification failed', 500);
  }
};

// Student: Get all my enrollments
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user._id;
    const enrollments = await Enrollment.find({ studentId })
      .populate('courseId', 'title slug thumbnail fee duration mode startDate endDate isPublished')
      .populate('orderId', 'receiptNumber createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const refundRequests = await ApprovalRequest.find({
      requestedBy: studentId,
      requestType: 'REFUND_REQUEST',
    })
      .select('resourceId status reviewedNote createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const refundMap = new Map();
    for (const rr of refundRequests) {
      const key = String(rr.resourceId);
      if (!refundMap.has(key)) {
        refundMap.set(key, rr);
      }
    }

    const enriched = enrollments.map((e) => {
      const rr = refundMap.get(String(e._id));
      return {
        ...e,
        refundRequest: rr
          ? { status: rr.status, reviewedNote: rr.reviewedNote || '', createdAt: rr.createdAt }
          : null,
      };
    });

    return sendSuccess(res, 'Student enrollments retrieved', enriched);
  } catch (error) {
    console.error('Error fetching my enrollments:', error);
    return sendError(res, 'Failed to retrieve enrollments', 500);
  }
};

// Student: Get single enrollment details
const getMyEnrollmentById = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { id } = req.params;

    const enrollment = await Enrollment.findOne({
      $or: [{ _id: id, studentId }, { enrollmentId: id, studentId }],
    })
      .populate('courseId')
      .populate('paymentId')
      .populate('orderId')
      .lean();

    if (!enrollment) {
      return sendError(res, 'Enrollment not found', 404);
    }

    return sendSuccess(res, 'Enrollment details retrieved', enrollment);
  } catch (error) {
    console.error('Error fetching enrollment by id:', error);
    return sendError(res, 'Failed to retrieve enrollment details', 500);
  }
};

// Admin: Get all enrollments with search, filters, pagination
const getAdminEnrollments = async (req, res) => {
  try {
    const { search, programId, enrollmentStatus, paymentStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    if (programId && programId !== 'ALL') {
      query.courseId = programId;
    }

    if (enrollmentStatus && enrollmentStatus !== 'ALL') {
      query.enrollmentStatus = enrollmentStatus;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      query.paymentStatus = paymentStatus;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { studentName: regex },
        { studentEmail: regex },
        { studentPhone: regex },
        { enrollmentId: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [enrollments, total] = await Promise.all([
      Enrollment.find(query)
        .populate('courseId', 'title slug fee duration mode')
        .populate('studentId', 'name email phone')
        .populate('paymentId', 'razorpayPaymentId status createdAt')
        .populate('orderId', 'receiptNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Enrollment.countDocuments(query),
    ]);

    return sendSuccess(res, 'Admin enrollments retrieved', {
      enrollments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching admin enrollments:', error);
    return sendError(res, 'Failed to fetch enrollments for admin', 500);
  }
};

// Admin: Update enrollment status
const updateAdminEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { enrollmentStatus, notes } = req.body;

    const validStatuses = [
      'ACTIVE',
      'ENROLLED',
      'PENDING_PAYMENT',
      'PAYMENT_PENDING_VERIFICATION',
      'SUSPENDED',
      'CANCELLED',
      'REFUNDED',
      'EXPIRED',
      'REJECTED',
    ];
    if (!validStatuses.includes(enrollmentStatus)) {
      return sendError(res, 'Invalid enrollment status', 400);
    }

    const enrollment = await Enrollment.findById(id).populate('courseId', 'title');
    if (!enrollment) {
      return sendError(res, 'Enrollment not found', 404);
    }

    // Refunds require Maker-Checker Approval unless executed directly by SUPER_ADMIN
    if (enrollmentStatus === 'REFUNDED' && req.user.role !== 'SUPER_ADMIN') {
      const approval = await ApprovalRequest.create({
        requestType: 'REFUND_REQUEST',
        resourceModel: 'Enrollment',
        resourceId: enrollment._id,
        targetTitle: `${enrollment.enrollmentId} (${enrollment.courseId?.title || 'Course'})`,
        payload: { enrollmentId: enrollment.enrollmentId, refundAmount: enrollment.finalAmount },
        reason: notes?.trim() || 'Refund request initiated from Enrollments Manager',
        requestedBy: req.user._id,
        requestedRole: req.user.role,
        status: 'PENDING',
      });

      await AuditLog.create({
        action: 'REFUND_APPROVAL_QUEUED',
        resource: 'Enrollment',
        resourceId: enrollment._id.toString(),
        category: 'FINANCIAL',
        isImmutable: true,
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip || '127.0.0.1',
        details: `Refund request for ${enrollment.enrollmentId} queued for approval`,
      });

      return sendSuccess(
        res,
        'Refund request submitted for Super Admin / Checker approval.',
        { approval, approvalPending: true },
        202
      );
    }

    const oldStatus = enrollment.enrollmentStatus;
    enrollment.enrollmentStatus = enrollmentStatus;
    if (notes !== undefined) enrollment.notes = notes;

    // Synchronize access entitlement with administrative status change
    if (enrollmentStatus === 'SUSPENDED') {
      enrollment.suspendedReason = notes || 'Suspended by administration';
      await Entitlement.updateMany(
        { studentId: enrollment.studentId, itemId: enrollment.courseId },
        { isActive: false, status: 'SUSPENDED', suspendedReason: notes || '' }
      );
    } else if (enrollmentStatus === 'CANCELLED' || enrollmentStatus === 'REJECTED') {
      enrollment.cancelledAt = new Date();
      await Entitlement.updateMany(
        { studentId: enrollment.studentId, itemId: enrollment.courseId },
        { isActive: false, status: 'CANCELLED', cancelledAt: new Date() }
      );
      if (enrollmentStatus === 'CANCELLED') {
        await reverseReferralReward(enrollment.orderId, enrollment.studentId, 'Enrollment cancelled');
      }
    } else if (enrollmentStatus === 'REFUNDED') {
      enrollment.paymentStatus = 'REFUNDED';
      enrollment.refundedAt = new Date();
      await Entitlement.updateMany(
        { studentId: enrollment.studentId, itemId: enrollment.courseId },
        { isActive: false, status: 'REFUNDED', refundedAt: new Date() }
      );
      await reverseReferralReward(enrollment.orderId, enrollment.studentId, 'Enrollment refunded');
    } else if (enrollmentStatus === 'EXPIRED') {
      await Entitlement.updateMany(
        { studentId: enrollment.studentId, itemId: enrollment.courseId },
        { isActive: false, status: 'EXPIRED' }
      );
    } else if (enrollmentStatus === 'ENROLLED' || enrollmentStatus === 'ACTIVE') {
      enrollment.paymentStatus = 'PAID';
      await Entitlement.updateMany(
        { studentId: enrollment.studentId, itemId: enrollment.courseId },
        { isActive: true, status: 'ACTIVE' }
      );
    }

    await enrollment.save();

    await AuditLog.create({
      action: 'ENROLLMENT_STATUS_UPDATED',
      resource: 'Enrollment',
      resourceId: enrollment._id.toString(),
      category: 'FINANCIAL',
      isImmutable: true,
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || '127.0.0.1',
      details: `Enrollment ${enrollment.enrollmentId} status changed from ${oldStatus} to ${enrollmentStatus}`,
    });

    return sendSuccess(res, `Enrollment status updated to ${enrollmentStatus}`, enrollment);
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    return sendError(res, error.message || 'Failed to update enrollment status', 500);
  }
};

// Admin: Get enrollment summary stats
const getAdminEnrollmentStats = async (req, res) => {
  try {
    const [total, enrolled, pending, cancelled, revenueResult] = await Promise.all([
      Enrollment.countDocuments({}),
      Enrollment.countDocuments({ enrollmentStatus: 'ENROLLED' }),
      Enrollment.countDocuments({ enrollmentStatus: { $in: ['PENDING_PAYMENT', 'PAYMENT_PENDING_VERIFICATION'] } }),
      Enrollment.countDocuments({ enrollmentStatus: { $in: ['CANCELLED', 'REJECTED'] } }),
      Enrollment.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return sendSuccess(res, 'Enrollment statistics retrieved', {
      total,
      enrolled,
      pending,
      cancelled,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching enrollment stats:', error);
    return sendError(res, 'Failed to fetch enrollment statistics', 500);
  }
};

// Student: Request refund / cancellation for a paid enrollment
const requestEnrollmentRefund = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !String(reason).trim()) {
      return sendError(res, 'Please provide a reason for your refund / cancellation request.', 400);
    }

    const enrollment = await Enrollment.findOne({ _id: id, studentId }).populate('courseId', 'title');
    if (!enrollment) {
      return sendError(res, 'Enrollment not found', 404);
    }

    if (!['ENROLLED', 'ACTIVE'].includes(enrollment.enrollmentStatus) || enrollment.paymentStatus !== 'PAID') {
      return sendError(res, 'Only active paid enrollments are eligible for a refund / cancellation request.', 400);
    }

    const existingPending = await ApprovalRequest.findOne({
      requestType: 'REFUND_REQUEST',
      resourceId: enrollment._id,
      status: 'PENDING',
    });
    if (existingPending) {
      return sendError(res, 'A refund / cancellation request is already pending review for this enrollment.', 409);
    }

    const approvalRequest = await ApprovalRequest.create({
      requestType: 'REFUND_REQUEST',
      resourceModel: 'Enrollment',
      resourceId: enrollment._id,
      targetTitle: `${enrollment.courseId?.title || 'Course'} (${enrollment.enrollmentId})`,
      payload: {
        enrollmentId: enrollment.enrollmentId,
        orderId: enrollment.orderId,
        amountPaid: enrollment.amountPaid,
        paymentMode: enrollment.paymentMode,
        enrolledAt: enrollment.enrolledAt,
      },
      reason: String(reason).trim(),
      requestedBy: studentId,
      requestedRole: req.user.role || 'STUDENT',
    });

    await AuditLog.create({
      userId: studentId,
      userEmail: req.user.email,
      userRole: req.user.role || 'STUDENT',
      action: 'REFUND_REQUEST_SUBMITTED',
      resource: 'Enrollment',
      resourceId: enrollment._id.toString(),
      category: 'FINANCIAL',
      details: {
        enrollmentId: enrollment.enrollmentId,
        amountPaid: enrollment.amountPaid,
        reason: String(reason).trim(),
      },
    });

    return sendSuccess(res, 'Refund / cancellation request submitted for Admin review.', approvalRequest, 201);
  } catch (error) {
    console.error('Error submitting refund request:', error);
    return sendError(res, 'Failed to submit refund request', 500);
  }
};

module.exports = {
  createEnrollmentIntent,
  verifyEnrollmentPayment,
  getMyEnrollments,
  getMyEnrollmentById,
  requestEnrollmentRefund,
  getAdminEnrollments,
  updateAdminEnrollmentStatus,
  getAdminEnrollmentStats,
};
