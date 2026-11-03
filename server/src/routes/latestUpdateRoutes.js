const express = require('express');
const router = express.Router();
const latestUpdateController = require('../controllers/latestUpdateController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Public routes
router.get('/public', latestUpdateController.getPublishedUpdates);
router.get('/public/:id', latestUpdateController.getUpdateById);

// Admin-only routes
router.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), latestUpdateController.getAdminUpdates);
router.post('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), latestUpdateController.createUpdate);
router.put('/admin/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), latestUpdateController.updateUpdate);
router.delete('/admin/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), latestUpdateController.deleteUpdate);
router.patch('/admin/:id/toggle-status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), latestUpdateController.toggleUpdateStatus);

module.exports = router;
