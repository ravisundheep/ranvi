const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { enquiryLimiter } = require('../middleware/rateLimiter');

router.post('/', enquiryLimiter, optionalAuth, enquiryController.createEnquiry);
router.get('/my-requests', authenticate, enquiryController.getMyRequests);
router.get('/admin', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPPORT_STAFF', 'FACULTY', 'COUNSELOR'), enquiryController.getEnquiries);
router.put('/admin/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPPORT_STAFF', 'FACULTY', 'COUNSELOR'), enquiryController.updateEnquiryStatus);
router.put('/admin/:id/assign', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPPORT_STAFF'), enquiryController.assignEnquiry);

module.exports = router;
