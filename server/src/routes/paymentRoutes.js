const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { paymentLimiter } = require('../middleware/rateLimiter');

// Student checkout
router.post('/checkout', authenticate, paymentLimiter, paymentController.createCheckoutOrder);
router.post('/verify', authenticate, paymentLimiter, paymentController.verifyPayment);
router.get('/my-history', authenticate, paymentController.getStudentPayments);

// Webhook
router.post('/webhook', paymentController.handleWebhook);

// Admin & Finance Staff routes
router.get('/admin/all', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'), paymentController.getAllPayments);
router.post('/admin/grant-manual', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), paymentController.grantManualEntitlement);

module.exports = router;
