const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const courseRoutes = require('./courseRoutes');
const facultyRoutes = require('./facultyRoutes');
const uploadRoutes = require('./uploadRoutes');
const lessonRoutes = require('./lessonRoutes');
const liveClassRoutes = require('./liveClassRoutes');
const mockTestRoutes = require('./mockTestRoutes');
const examAttemptRoutes = require('./examAttemptRoutes');
const paymentRoutes = require('./paymentRoutes');
const enquiryRoutes = require('./enquiryRoutes');
const studentRoutes = require('./studentRoutes');
const adminRoutes = require('./adminRoutes');
const siteSettingsRoutes = require('./siteSettingsRoutes');
const notificationRoutes = require('./notificationRoutes');
const entranceExamRoutes = require('./entranceExamRoutes');
const latestUpdateRoutes = require('./latestUpdateRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/faculty', facultyRoutes);
router.use('/upload', uploadRoutes);
router.use('/lessons', lessonRoutes);
router.use('/live-classes', liveClassRoutes);
router.use('/mock-tests', mockTestRoutes);
router.use('/exam-attempts', examAttemptRoutes);
router.use('/payments', paymentRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/students', studentRoutes);
router.use('/admin', adminRoutes);
router.use('/site-settings', siteSettingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/entrance-exams', entranceExamRoutes);
router.use('/latest-updates', latestUpdateRoutes);
router.use('/updates', latestUpdateRoutes);
router.use('/enrollments', enrollmentRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Ranvi Institutions Backend API v1',
  });
});

module.exports = router;
