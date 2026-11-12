const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const staffController = require('../controllers/staffController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// All portal endpoints require authentication
router.use(authenticate);

// Role-scoped overview metrics (Staff + Admin)
router.get(
  '/dashboard-stats',
  authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY', 'SUPPORT_STAFF', 'FINANCE_STAFF'),
  adminController.getDashboardStats
);

// Student Directory & Device Control
router.get('/students', authorize('SUPER_ADMIN', 'ADMIN', 'SUPPORT_STAFF'), adminController.getStudents);
router.post('/students/:studentId/reset-device', authorize('SUPER_ADMIN', 'ADMIN', 'SUPPORT_STAFF'), adminController.resetStudentDevice);
router.put('/students/:studentId/toggle-status', authorize('SUPER_ADMIN', 'ADMIN'), adminController.toggleStudentStatus);

// Security & Immutable Audit Logs
router.get('/audit-logs', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'), adminController.getAuditLogs);
router.post('/audit-logs/cleanup', authorize('SUPER_ADMIN', 'ADMIN'), adminController.triggerAuditLogCleanup);

// Analytics & Reports
router.get('/reports', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'), adminController.getReportsData);

// Multi-Role Staff Management (Admin & Super Admin)
router.get('/staff', authorize('SUPER_ADMIN', 'ADMIN'), staffController.getStaffMembers);
router.post('/staff', authorize('SUPER_ADMIN', 'ADMIN'), staffController.createStaffMember);
router.put('/staff/:staffId', authorize('SUPER_ADMIN', 'ADMIN'), staffController.updateStaffMember);
router.post('/staff/:staffId/reset-password', authorize('SUPER_ADMIN', 'ADMIN'), staffController.resetStaffPassword);

// Maker-Checker Financial & Admin Approvals Queue
router.get('/approvals', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'), staffController.getApprovalRequests);
router.post('/approvals', authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'), staffController.createApprovalRequest);
router.put('/approvals/:id/review', authorize('SUPER_ADMIN', 'ADMIN'), staffController.reviewApprovalRequest);

module.exports = router;
