const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Student Personal Notifications
router.get('/my', authenticate, notificationController.getMyNotifications);
router.put('/mark-read/:id', authenticate, notificationController.markAsRead);

// Public Institutional Notifications
router.get('/public', notificationController.getPublicNotifications);
router.get('/public/:id', notificationController.getPublicNotificationById);

// Admin Notifications Management
router.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), notificationController.getAdminNotifications);
router.post('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), notificationController.createAdminNotification);
router.put('/admin/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), notificationController.updateAdminNotification);
router.delete('/admin/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), notificationController.deleteAdminNotification);
router.patch('/admin/:id/toggle-status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), notificationController.toggleNotificationStatus);
router.patch('/admin/:id/toggle-pinned', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), notificationController.toggleNotificationPinned);

module.exports = router;
