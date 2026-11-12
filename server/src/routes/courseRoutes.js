const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Public routes
router.get('/', optionalAuth, courseController.getCourses);
router.get('/categories', courseController.getCategories);
router.get('/states', courseController.getAvailableStates);

// Category Management (Admin & Super Admin)
router.post('/categories', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), courseController.createCategory);
router.put('/categories/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), courseController.updateCategory);
router.delete('/categories/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), courseController.deleteCategory);

router.get('/:slug', optionalAuth, courseController.getCourseBySlug);

// Admin routes
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), courseController.createCourse);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), courseController.updateCourse);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), courseController.deleteCourse);

module.exports = router;
