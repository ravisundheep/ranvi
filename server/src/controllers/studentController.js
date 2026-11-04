const Entitlement = require('../models/Entitlement');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');
const MockTest = require('../models/MockTest');
const ExamAttempt = require('../models/ExamAttempt');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const DeviceSession = require('../models/DeviceSession');
const User = require('../models/User');
const { sendSuccess } = require('../utils/responseHelper');

const getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // 1. Fetch active course entitlements
    const entitlements = await Entitlement.find({
      studentId,
      itemType: 'COURSE',
      isActive: true,
      status: { $in: ['ACTIVE', 'ENROLLED'] },
      validUntil: { $gte: new Date() },
    }).populate({
      path: 'itemId',
      select: 'title slug division thumbnail fee mode duration batchSchedule',
    });

    const enrolledCourseIds = entitlements.map(e => e.itemId?._id).filter(Boolean);

    // 2. Fetch upcoming live classes for enrolled courses
    const upcomingLiveClasses = await LiveClass.find({
      courseId: { $in: enrolledCourseIds },
      status: { $in: ['SCHEDULED', 'LIVE'] },
      isPublished: true,
    })
      .populate('courseId', 'title slug')
      .sort({ scheduledDate: 1, startTime: 1 })
      .limit(5);

    // 3. Fetch recent exam attempts
    const recentAttempts = await ExamAttempt.find({
      studentId,
      status: 'SUBMITTED',
    })
      .populate('mockTestId', 'title slug division totalMarks passMarks')
      .sort({ submittedAt: -1 })
      .limit(5);

    // 4. Calculate overall performance metrics
    const totalAttemptsCount = await ExamAttempt.countDocuments({ studentId, status: 'SUBMITTED' });
    let averageAccuracy = 0;
    let averageScore = 0;
    if (recentAttempts.length > 0) {
      averageAccuracy = Math.round(recentAttempts.reduce((acc, a) => acc + (a.accuracyPercentage || 0), 0) / recentAttempts.length);
      averageScore = Math.round((recentAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / recentAttempts.length) * 10) / 10;
    }

    // 5. Fetch free demo mock tests
    const availableDemoTests = await MockTest.find({
      isDemoFree: true,
      isPublished: true,
    }).limit(4);

    // 6. Active device session info
    const activeDevice = await DeviceSession.findOne({
      studentId,
      isActive: true,
    }).select('deviceInfo ipAddress lastActiveAt registeredAt');

    // 7. Unread notifications count
    const unreadNotificationsCount = await Notification.countDocuments({
      recipientId: studentId,
      isRead: false,
    });

    // 8. Demo usage summary
    const user = await User.findById(studentId);
    const demoUsage = user.demoUsage || { recordedClasses: [], mockTests: [] };

    return sendSuccess(res, 'Student dashboard data loaded', {
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        targetExam: user.targetExam,
      },
      profile: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        targetExam: user.targetExam,
      },
      enrolledCourses: entitlements.map(e => ({
        entitlementId: e._id,
        course: e.itemId,
        validUntil: e.validUntil,
        grantedBy: e.grantedBy,
      })),
      upcomingLiveClasses,
      recentAttempts,
      performanceStats: {
        totalAttemptsCount,
        averageAccuracy,
        averageScore,
      },
      availableDemoTests,
      activeDevice,
      unreadNotificationsCount,
      demoUsage: {
        recordedClassesCount: demoUsage.recordedClasses ? demoUsage.recordedClasses.length : 0,
        mockTestsCount: demoUsage.mockTests ? demoUsage.mockTests.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentDashboard,
};
