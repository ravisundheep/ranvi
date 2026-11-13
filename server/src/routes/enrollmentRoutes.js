const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { paymentLimiter } = require('../middleware/rateLimiter');

// Student endpoints
router.post('/intent', authenticate, paymentLimiter, enrollmentController.createEnrollmentIntent);
router.post('/verify', authenticate, paymentLimiter, enrollmentController.verifyEnrollmentPayment);
router.get('/my', authenticate, enrollmentController.getMyEnrollments);
router.get('/my/:id', authenticate, enrollmentController.getMyEnrollmentById);
router.post('/:id/refund-request', authenticate, enrollmentController.requestEnrollmentRefund);

// Admin / Support / Finance endpoints
router.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF', 'FINANCE_STAFF'), enrollmentController.getAdminEnrollments);
router.get('/admin/stats', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF', 'FINANCE_STAFF'), enrollmentController.getAdminEnrollmentStats);
router.put('/admin/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'), enrollmentController.updateAdminEnrollmentStatus);

module.exports = router;
