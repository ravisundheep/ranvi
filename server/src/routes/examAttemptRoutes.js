const express = require('express');
const router = express.Router();
const examAttemptController = require('../controllers/examAttemptController');
const { authenticate } = require('../middleware/authenticate');
const { enforceSingleDevice } = require('../middleware/deviceSession');
const { examActionLimiter } = require('../middleware/rateLimiter');

// Student exam taking endpoints
router.post('/start/:mockTestId', authenticate, enforceSingleDevice, examAttemptController.startExam);
router.post('/save-response/:attemptId', authenticate, enforceSingleDevice, examActionLimiter, examAttemptController.saveResponse);
router.post('/submit/:attemptId', authenticate, enforceSingleDevice, examAttemptController.submitExam);
router.get('/result/:attemptId', authenticate, enforceSingleDevice, examAttemptController.getAttemptResult);
router.get('/my-history', authenticate, enforceSingleDevice, examAttemptController.getStudentAttempts);
router.get('/leaderboard/:mockTestId', authenticate, examAttemptController.getTestLeaderboard);

module.exports = router;
