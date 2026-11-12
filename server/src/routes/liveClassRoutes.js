const express = require('express');
const router = express.Router();
const liveClassController = require('../controllers/liveClassController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { enforceSingleDevice } = require('../middleware/deviceSession');

// Public: sanitized schedule without Zoom URLs/passcodes
router.get('/public-schedule', liveClassController.getPublicLiveClassSchedule);

// Student: get live classes for enrolled courses
router.get('/student', authenticate, enforceSingleDevice, liveClassController.getStudentLiveClasses);

// Staff / Admin: view all live classes
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY', 'SUPPORT_STAFF'), liveClassController.getAllLiveClasses);

// Staff / Admin: manage live classes (delete restricted to Admin/SuperAdmin)
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), liveClassController.createLiveClass);
router.put('/:id/cancel', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), liveClassController.cancelLiveClass);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FACULTY'), liveClassController.updateLiveClass);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), liveClassController.deleteLiveClass);

module.exports = router;
