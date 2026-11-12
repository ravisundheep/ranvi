const express = require('express');
const router = express.Router();
const mockTestController = require('../controllers/mockTestController');
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Public / Student
router.get('/', optionalAuth, mockTestController.getMockTests);
router.get('/:mockTestId/leaderboard', authenticate, mockTestController.getMockTestLeaderboard);
router.get('/:slug', optionalAuth, mockTestController.getMockTestBySlug);

// Admin & Faculty Questions (Specific routes first)
router.put('/questions/:questionId', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), mockTestController.updateQuestion);
router.delete('/questions/:questionId', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), mockTestController.deleteQuestion);
router.get('/:mockTestId/admin-questions', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), mockTestController.getAdminMockTestQuestions);
router.post('/:mockTestId/questions', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), mockTestController.addQuestion);
router.post('/:mockTestId/bulk-questions', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), mockTestController.bulkUploadQuestions);

// Admin & Faculty Mock Tests (delete restricted to Admin/SuperAdmin)
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), mockTestController.createMockTest);
router.post('/upload-paper', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), mockTestController.uploadMockTestPaper);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), mockTestController.updateMockTest);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), mockTestController.deleteMockTest);

module.exports = router;

