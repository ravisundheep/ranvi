const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { enforceSingleDevice } = require('../middleware/deviceSession');

// Course lessons list (sanitized for public/enrolled)
router.get('/course/:courseId', optionalAuth, lessonController.getCourseLessons);

// Playback route: authenticated, checks active device session and entitlement
router.get('/playback/:lessonId', optionalAuth, enforceSingleDevice, lessonController.getLessonPlayback);

// Admin & Assigned Faculty routes
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), lessonController.createLesson);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), lessonController.updateLesson);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), lessonController.deleteLesson);

module.exports = router;
