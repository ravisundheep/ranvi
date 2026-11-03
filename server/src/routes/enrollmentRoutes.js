const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Student endpoints
router.post('/intent', authenticate, enrollmentController.createEnrollmentIntent);
router.post('/verify', authenticate, enrollmentController.verifyEnrollmentPayment);
router.get('/my', authenticate, enrollmentController.getMyEnrollments);
router.get('/my/:id', authenticate, enrollmentController.getMyEnrollmentById);

// Admin endpoints
router.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), enrollmentController.getAdminEnrollments);
router.get('/admin/stats', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), enrollmentController.getAdminEnrollmentStats);
router.put('/admin/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), enrollmentController.updateAdminEnrollmentStatus);

module.exports = router;
