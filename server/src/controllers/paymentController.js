const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Entitlement = require('../models/Entitlement');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const MockTest = require('../models/MockTest');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const env = require('../config/env');
const {
  razorpayInstance,
  isRazorpayConfigured,
  verifySignature,
  verifyWebhookSignature,
} = require('../config/razorpay');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const {
  emitEnrollmentChange,
  emitNewOrderPlaced,
  emitAdminStatsUpdate,
} = require('../utils/socketService');
const { sendNotificationEmail } = require('../utils/emailService');

const fulfillPaidOrder = async ({
  order,
  student,
  razorpayPaymentId,
  razorpaySignature,
  paymentMethod = 'ONLINE',
  grantReason,
}) => {
  const existingPayment = await Payment.findOne({ razorpayPaymentId });
  if (existingPayment && existingPayment.orderId.toString() !== order._id.toString()) {
    const conflictError = new Error('This payment reference has already been used for another order');
    conflictError.statusCode = 409;
    throw conflictError;
  }

  let payment = existingPayment;
  if (!payment) {
    payment = await Payment.create({
      orderId: order._id,
      studentId: order.studentId,
      razorpayPaymentId,
      razorpayOrderId: order.razorpayOrderId,
      razorpaySignature: razorpaySignature || 'WEBHOOK_VERIFIED',
      amount: order.amount,
      currency: order.currency || 'INR',
      status: 'SUCCESS',
      paymentMethod,
      transactionRef: razorpayPaymentId,
    });
  }

  order.status = 'PAID';
  order.paymentId = payment._id;
  await order.save();

  let courseDoc = null;
  if (order.itemType === 'COURSE') {
    courseDoc = await Course.findById(order.itemId);
  }

  const now = new Date();
  const months = order.durationMonths || 0;
  let validUntil;
  if (months > 0) {
    validUntil = new Date(now);
    validUntil.setMonth(validUntil.getMonth() + months);
  } else {
    // No duration plan — use course validityDays or default 180
    const validityDays = (courseDoc && courseDoc.validityDays) ? courseDoc.validityDays : 180;
    validUntil = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
  }

  const entitlement = await Entitlement.findOneAndUpdate(
    { studentId: order.studentId, itemId: order.itemId },
    {
      studentId: order.studentId,
      itemType: order.itemType,
      itemId: order.itemId,
      itemModel: order.itemModel,
      orderId: order._id,
      validFrom: now,
      validUntil,
      isActive: true,
      status: 'ACTIVE',
      grantedBy: 'PAYMENT',
      grantReason: grantReason || `Verified Razorpay payment ${razorpayPaymentId}`,
    },
    { upsert: true, new: true }
  );

  if (order.itemType === 'COURSE') {
    const existingActiveEnrollment = await Enrollment.findOne({
      studentId: order.studentId,
      courseId: order.itemId,
      enrollmentStatus: { $in: ['ENROLLED', 'ACTIVE'] },
    });

    if (!existingActiveEnrollment) {
      const courseUpdate = { $inc: { enrolledStudentsCount: 1 } };
      if (courseDoc && typeof courseDoc.availableSeats === 'number' && courseDoc.availableSeats > 0) {
        courseUpdate.$inc.availableSeats = -1;
      }
      await Course.findByIdAndUpdate(order.itemId, courseUpdate);
    }

    const enrollmentId = `ENR-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await Enrollment.findOneAndUpdate(
      { studentId: order.studentId, courseId: order.itemId },
      {
        $setOnInsert: {
          enrollmentId,
          studentId: order.studentId,
          courseId: order.itemId,
          orderId: order._id,
          studentName: student?.name || 'Student',
          studentEmail: student?.email || '',
          studentPhone: student?.phone || '',
          feeAmount: courseDoc ? courseDoc.fee : order.amount,
          finalAmount: order.amount,
          enrolledAt: now,
        },
        $set: {
          paymentId: payment._id,
          enrollmentStatus: 'ENROLLED',
          paymentStatus: 'PAID',
          validFrom: now,
          validUntil,
        },
      },
      { upsert: true, new: true }
    );
  }

  emitEnrollmentChange(order.studentId, { itemType: order.itemType, itemId: order.itemId, validUntil });
  emitNewOrderPlaced(order);
  emitAdminStatsUpdate({ reason: 'PAYMENT_VERIFIED' });

  // Process direct single-level referral reward if eligible
  try {
    const { processReferralReward } = require('./walletController');
    await processReferralReward(order.studentId, order._id, order.amount);
  } catch (refErr) {
    console.error('Non-blocking error awarding referral reward:', refErr);
  }

  // Create in-app notification & send non-blocking confirmation email
  try {
    const itemTitle = courseDoc ? courseDoc.title : (order.itemType === 'MOCK_TEST_PACKAGE' ? 'Mock Test Series' : 'Program');
    const targetUrl = order.itemType === 'COURSE' ? '/student/my-courses' : '/student/mock-tests';
    await Notification.create({
      recipientId: order.studentId,
      isPublic: false,
      title: `Enrollment Confirmed: ${itemTitle}`,
      message: `Payment of ₹${order.amount} (${razorpayPaymentId}) was successful. Access is active until ${validUntil.toLocaleDateString('en-IN')}.`,
      type: 'PAYMENT',
      link: targetUrl,
      status: 'PUBLISHED',
    });

    const recipientUser = student?.email ? student : await User.findById(order.studentId).select('name email');
    if (recipientUser?.email) {
      sendNotificationEmail({
        to: recipientUser.email,
        subject: `Enrollment Confirmed: ${itemTitle} — Ranvi Institutions`,
        title: 'Payment & Enrollment Confirmation',
        message: `Hello ${recipientUser.name || 'Student'},\n\nThank you for enrolling in ${itemTitle}.\nAmount Paid: ₹${order.amount}\nTransaction Ref: ${razorpayPaymentId}\nValid Until: ${validUntil.toLocaleDateString('en-IN')}\n\nStart learning right away from your Student Portal!`,
        actionUrl: `${env.CLIENT_ORIGIN}${targetUrl}`,
        actionLabel: 'Access Your Courses',
      });
    }
  } catch (notifyErr) {
    console.error('Non-blocking enrollment notification error:', notifyErr);
  }

  return { payment, entitlement, validUntil };
};

// Student: Create checkout order
const createCheckoutOrder = async (req, res, next) => {
  try {
    const { itemType, itemId, durationMonths, useWallet } = req.body;
    const studentId = req.user._id;

    if (!itemType || !itemId) {
      return sendError(res, 'Item type and ID are required', 400);
    }

    let item = null;
    let itemModel = '';
    let amount = 0;

    if (itemType === 'COURSE') {
      item = await Course.findById(itemId);
      itemModel = 'Course';
      if (!item || !item.isPublished) return sendError(res, 'Course not found or unavailable', 404);
      // If a durationMonths is provided, find the matching plan price
      if (durationMonths && item.subscriptionPlans && item.subscriptionPlans.length > 0) {
        const plan = item.subscriptionPlans.find((p) => p.durationMonths === Number(durationMonths));
        amount = plan ? plan.price : item.fee;
      } else {
        amount = item.fee;
      }
    } else if (itemType === 'MOCK_TEST_PACKAGE') {
      item = await MockTest.findById(itemId);
      itemModel = 'MockTest';
      if (!item || !item.isPublished) return sendError(res, 'Mock test package not found or unavailable', 404);
      amount = item.price || 0;
    } else {
      return sendError(res, 'Invalid item type', 400);
    }

    const now = new Date();

    // Check if student already has active entitlement or active enrollment
    const existingEntitlement = await Entitlement.findOne({
      studentId,
      itemId,
      isActive: true,
      status: { $in: ['ACTIVE', 'ENROLLED'] },
      validUntil: { $gte: now },
    });
    const existingEnrollment =
      itemType === 'COURSE'
        ? await Enrollment.findOne({
            studentId,
            courseId: itemId,
            enrollmentStatus: { $in: ['ENROLLED', 'ACTIVE'] },
            $or: [{ validUntil: { $gte: now } }, { validUntil: null }, { validUntil: { $exists: false } }],
          })
        : null;

    if (existingEntitlement || existingEnrollment) {
      return sendError(res, 'You already have an active subscription for this program', 400, {
        validUntil: existingEntitlement?.validUntil || existingEnrollment?.validUntil,
      });
    }

    let walletDeducted = 0;
    const currentUser = await User.findById(studentId);
    if (useWallet && currentUser && (currentUser.walletBalance || 0) > 0 && amount > 0) {
      walletDeducted = Math.min(amount, currentUser.walletBalance);
      amount = Math.max(0, amount - walletDeducted);
    }

    // If item fee is 0 (Free access or 100% wallet covered)
    if (amount === 0) {
      const receiptNumber = `FREE-RANVI-${Date.now()}`;
      const validUntil = new Date(Date.now() + (item.validityDays || 180) * 24 * 60 * 60 * 1000);

      const order = await Order.create({
        studentId,
        itemType,
        itemId,
        itemModel,
        amount: 0,
        razorpayOrderId: `free_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        status: 'PAID',
        receiptNumber,
        durationMonths: durationMonths ? Number(durationMonths) : null,
      });

      if (walletDeducted > 0 && currentUser) {
        currentUser.walletBalance = Math.max(0, currentUser.walletBalance - walletDeducted);
        await currentUser.save();
        const WalletTransaction = require('../models/WalletTransaction');
        await WalletTransaction.create({
          transactionId: `WTX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
          userId: studentId,
          type: 'DEBIT',
          source: 'COURSE_PURCHASE',
          amount: walletDeducted,
          balanceAfter: currentUser.walletBalance,
          orderId: order._id,
          description: `Wallet redeemed for ${item.title || 'course'} enrollment`,
          status: 'COMPLETED',
        });
      }

      const entitlement = await Entitlement.findOneAndUpdate(
        { studentId, itemId },
        {
          studentId,
          itemType,
          itemId,
          itemModel,
          orderId: order._id,
          validFrom: now,
          validUntil,
          isActive: true,
          status: 'ACTIVE',
          grantedBy: 'PROMOTION',
          grantReason: walletDeducted > 0 ? 'Full wallet balance redemption' : 'Free program enrolment',
        },
        { upsert: true, new: true }
      );

      if (itemType === 'COURSE') {
        const courseUpdate = { $inc: { enrolledStudentsCount: 1 } };
        if (typeof item.availableSeats === 'number' && item.availableSeats > 0) {
          courseUpdate.$inc.availableSeats = -1;
        }
        await Course.findByIdAndUpdate(itemId, courseUpdate);

        const enrollmentId = `ENR-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await Enrollment.findOneAndUpdate(
          { studentId, courseId: itemId },
          {
            $setOnInsert: {
              enrollmentId,
              studentId,
              courseId: itemId,
              orderId: order._id,
              studentName: req.user.name || 'Student',
              studentEmail: req.user.email,
              studentPhone: req.user.phone || '',
              feeAmount: 0,
              finalAmount: 0,
              enrolledAt: now,
            },
            $set: {
              enrollmentStatus: 'ENROLLED',
              paymentStatus: 'PAID',
              validFrom: now,
              validUntil,
            },
          },
          { upsert: true, new: true }
        );
      }

      emitEnrollmentChange(studentId, { itemType, itemId, validUntil });

      return sendSuccess(res, 'Free enrolment successful', {
        isFree: true,
        orderId: order._id,
        entitlementId: entitlement._id,
      });
    }

    if (!isRazorpayConfigured()) {
      return sendError(
        res,
        'Online payment gateway is not configured. Please contact administration or configure Razorpay keys.',
        503
      );
    }

    // Create Razorpay Order
    const receiptNumber = `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let razorpayOrderId = '';

    try {
      const rzpOrder = await razorpayInstance.orders.create({
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        receipt: receiptNumber,
        notes: {
          studentId: studentId.toString(),
          studentEmail: req.user.email,
          itemType,
          itemId: itemId.toString(),
          itemTitle: item.title,
        },
      });
      razorpayOrderId = rzpOrder.id;
    } catch (rzpErr) {
      console.error('[Razorpay Order Creation Failed]', rzpErr.message);
      return sendError(res, 'Unable to initialize payment gateway order. Please try again shortly.', 502);
    }

    const order = await Order.create({
      studentId,
      itemType,
      itemId,
      itemModel,
      amount,
      currency: 'INR',
      razorpayOrderId,
      status: 'PENDING',
      receiptNumber,
      durationMonths: durationMonths ? Number(durationMonths) : null,
    });

    return sendSuccess(res, 'Checkout order created', {
      orderId: order._id,
      razorpayOrderId,
      amount,
      currency: 'INR',
      item: {
        id: item._id,
        title: item.title,
        itemType,
        thumbnail: item.thumbnail,
      },
      user: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
      keyId: env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

// Student: Authoritative server-side payment verification
const verifyPayment = async (req, res, next) => {
  try {
    const orderId = req.body.orderId || req.body.order_id;
    const razorpayPaymentId = req.body.razorpayPaymentId || req.body.razorpay_payment_id;
    const razorpayOrderId = req.body.razorpayOrderId || req.body.razorpay_order_id;
    const razorpaySignature = req.body.razorpaySignature || req.body.razorpay_signature;
    const studentId = req.user._id;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return sendError(res, 'Payment verification parameters are incomplete', 400);
    }

    let order = null;
    if (orderId) {
      order = await Order.findOne({ _id: orderId, studentId });
    }
    if (!order && razorpayOrderId) {
      order = await Order.findOne({ razorpayOrderId, studentId });
    }

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      return sendError(res, 'Order ID mismatch. Verification rejected.', 400);
    }

    // Check if already processed (Idempotency)
    if (order.status === 'PAID') {
      return sendSuccess(res, 'Payment already verified and processed', { orderId: order._id });
    }

    // Always verify cryptographic HMAC-SHA256 signature
    const isSignatureValid = verifySignature(order.razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isSignatureValid) {
      order.status = 'FAILED';
      await order.save();
      await AuditLog.create({
        userId: studentId,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'PAYMENT_SIGNATURE_FAILED',
        resource: 'Order',
        resourceId: order._id.toString(),
        category: 'FINANCIAL',
        isImmutable: true,
        ipAddress: req.ip || '',
        details: { razorpayOrderId, razorpayPaymentId },
      });
      return sendError(res, 'Invalid payment signature. Transaction failed verification.', 400);
    }

    const { entitlement, validUntil } = await fulfillPaidOrder({
      order,
      student: req.user,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod: 'ONLINE',
    });

    // Create notification
    await Notification.create({
      recipientId: studentId,
      title: 'Payment Successful! Enrolment Activated',
      message: `Your payment of ₹${order.amount} was verified. You now have full access to your program materials.`,
      type: 'PAYMENT',
      link: '/student/my-courses',
    });

    // Audit log (immutable financial trail)
    await AuditLog.create({
      userId: studentId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'PAYMENT_VERIFIED',
      resource: 'Payment',
      resourceId: order.paymentId?.toString() || order._id.toString(),
      category: 'FINANCIAL',
      isImmutable: true,
      ipAddress: req.ip || '',
      details: { amount: order.amount, orderId: order._id, paymentId: razorpayPaymentId },
    });

    return sendSuccess(res, 'Payment verified and course access granted successfully', {
      orderId: order._id,
      receiptNumber: order.receiptNumber,
      amount: order.amount,
      validUntil,
      entitlementId: entitlement._id,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

// Razorpay Webhook Handler (Raw body signature verification)
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn('[Razorpay Webhook] Invalid webhook signature');
      return res.status(400).json({ status: 'invalid_signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if ((event === 'payment.captured' || event === 'order.paid') && payload && payload.payment?.entity) {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      const order = await Order.findOne({ razorpayOrderId });
      if (order && order.status !== 'PAID') {
        const expectedPaise = Math.round(order.amount * 100);
        if (typeof paymentEntity.amount === 'number' && paymentEntity.amount < expectedPaise) {
          console.warn(`[Razorpay Webhook] Amount mismatch for order ${razorpayOrderId}: got ${paymentEntity.amount}, expected ${expectedPaise}`);
          return res.status(400).json({ status: 'amount_mismatch' });
        }

        const student = await User.findById(order.studentId);
        if (student) {
          await fulfillPaidOrder({
            order,
            student,
            razorpayPaymentId,
            razorpaySignature: signature,
            paymentMethod: paymentEntity.method ? String(paymentEntity.method).toUpperCase() : 'ONLINE',
            grantReason: `Razorpay webhook ${event} (${razorpayPaymentId})`,
          });

          await Notification.create({
            recipientId: student._id,
            title: 'Payment Confirmed! Enrolment Activated',
            message: `Your payment of ₹${order.amount} has been confirmed. Your program access is now active.`,
            type: 'PAYMENT',
            link: '/student/my-courses',
          });

          await AuditLog.create({
            userId: student._id,
            userEmail: student.email,
            userRole: student.role,
            action: 'PAYMENT_WEBHOOK_CAPTURED',
            resource: 'Order',
            resourceId: order._id.toString(),
            category: 'FINANCIAL',
            isImmutable: true,
            details: { event, razorpayOrderId, razorpayPaymentId, amount: order.amount },
          });
        }
      }
    } else if (event === 'payment.failed' && payload && payload.payment?.entity) {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const order = await Order.findOne({ razorpayOrderId });
      if (order && order.status === 'PENDING') {
        order.status = 'FAILED';
        await order.save();
        await Enrollment.updateMany(
          { orderId: order._id, paymentStatus: 'PENDING' },
          { paymentStatus: 'FAILED', notes: paymentEntity.error_description || 'Payment failed via gateway webhook' }
        );
        await AuditLog.create({
          userId: order.studentId,
          action: 'PAYMENT_WEBHOOK_FAILED',
          resource: 'Order',
          resourceId: order._id.toString(),
          category: 'FINANCIAL',
          isImmutable: true,
          details: { razorpayOrderId, reason: paymentEntity.error_description || 'payment.failed' },
        });
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[Razorpay Webhook Error]', err.message);
    return res.status(500).json({ status: 'error' });
  }
};

// Student: Get personal payment history
const getStudentPayments = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const orders = await Order.find({ studentId })
      .populate('itemId')
      .populate('paymentId')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Student payment history retrieved', orders);
  } catch (error) {
    next(error);
  }
};

// Admin: Get all transactions
const getAllPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('studentId', 'name email phone')
      .populate('itemId')
      .populate('paymentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return sendSuccess(res, 'All payments retrieved', {
      orders,
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

// Admin: Grant manual course entitlement
const grantManualEntitlement = async (req, res, next) => {
  try {
    const { studentId, itemType, itemId, durationDays, durationMonths: grantDurationMonths, reason } = req.body;

    if (!studentId || !itemType || !itemId) {
      return sendError(res, 'Student, item type, and item ID are required', 400);
    }

    const student = await User.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const now = new Date();
    let validUntil;
    if (grantDurationMonths && Number(grantDurationMonths) > 0) {
      validUntil = new Date(now);
      validUntil.setMonth(validUntil.getMonth() + Number(grantDurationMonths));
    } else {
      validUntil = new Date(now.getTime() + (durationDays || 180) * 24 * 60 * 60 * 1000);
    }

    const entitlement = await Entitlement.findOneAndUpdate(
      { studentId, itemId },
      {
        studentId,
        itemType,
        itemId,
        itemModel: itemType === 'COURSE' ? 'Course' : 'MockTest',
        validFrom: now,
        validUntil,
        isActive: true,
        status: 'ACTIVE',
        grantedBy: 'ADMIN_MANUAL',
        grantReason: reason || 'Manual grant by administrator',
      },
      { upsert: true, new: true }
    );

    if (itemType === 'COURSE') {
      const course = await Course.findById(itemId);
      const existingEnrollment = await Enrollment.findOne({
        studentId,
        courseId: itemId,
        enrollmentStatus: { $in: ['ENROLLED', 'ACTIVE'] },
      });
      if (!existingEnrollment && course) {
        const courseUpdate = { $inc: { enrolledStudentsCount: 1 } };
        if (typeof course.availableSeats === 'number' && course.availableSeats > 0) {
          courseUpdate.$inc.availableSeats = -1;
        }
        await Course.findByIdAndUpdate(itemId, courseUpdate);
      }

      const enrollmentId = `ENR-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await Enrollment.findOneAndUpdate(
        { studentId, courseId: itemId },
        {
          $setOnInsert: {
            enrollmentId,
            studentId,
            courseId: itemId,
            studentName: student.name || 'Student',
            studentEmail: student.email,
            studentPhone: student.phone || '',
            feeAmount: course ? course.fee : 0,
            finalAmount: 0,
            enrolledAt: now,
          },
          $set: {
            enrollmentStatus: 'ENROLLED',
            paymentStatus: 'PAID',
            validFrom: now,
            validUntil,
            notes: reason || 'Manual grant by administrator',
          },
        },
        { upsert: true, new: true }
      );
    }

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'MANUAL_ENTITLEMENT_GRANT',
      resource: 'Entitlement',
      resourceId: entitlement._id.toString(),
      category: 'FINANCIAL',
      isImmutable: true,
      details: { studentEmail: student.email, itemType, itemId, reason },
    });

    await Notification.create({
      recipientId: studentId,
      title: 'Course Access Granted by Admin',
      message: `You have been granted access to your requested course/test series by Ranvi Institutions administration.`,
      type: 'SYSTEM',
      link: '/student/my-courses',
    });

    emitEnrollmentChange(studentId, { itemType, itemId, validUntil, grantedBy: 'ADMIN_MANUAL' });
    emitAdminStatsUpdate({ reason: 'MANUAL_ENTITLEMENT_GRANT' });

    return sendSuccess(res, 'Manual access granted successfully', entitlement, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckoutOrder,
  verifyPayment,
  handleWebhook,
  getStudentPayments,
  getAllPayments,
  grantManualEntitlement,
};
