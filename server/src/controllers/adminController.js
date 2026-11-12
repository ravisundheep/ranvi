const User = require('../models/User');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');
const MockTest = require('../models/MockTest');
const Order = require('../models/Order');
const Entitlement = require('../models/Entitlement');
const DeviceSession = require('../models/DeviceSession');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const {
  getTimezone,
  getStartOfDayInTimezone,
  cleanupExpiredAuditLogs,
} = require('../utils/auditCleanupService');
const {
  emitDeviceRevocation,
  emitStudentUpdate,
  emitAdminStatsUpdate,
} = require('../utils/socketService');

// Admin Dashboard Summary Metrics
const getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const activeStudents = await User.countDocuments({ role: 'STUDENT', isActive: true });
    const totalCourses = await Course.countDocuments({ isPublished: true });
    const totalMockTests = await MockTest.countDocuments({ isPublished: true });
    const totalLiveClassesUpcoming = await LiveClass.countDocuments({ status: { $in: ['SCHEDULED', 'LIVE'] } });
    const totalEnrollments = await Entitlement.countDocuments({ isActive: true });

    // Revenue calculation
    const paidOrders = await Order.find({ status: 'PAID' });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

    // Recent activity
    const recentStudents = await User.find({ role: 'STUDENT' }).sort({ createdAt: -1 }).limit(5);
    const recentOrders = await Order.find().populate('studentId', 'name email').sort({ createdAt: -1 }).limit(5);

    return sendSuccess(res, 'Admin overview metrics retrieved', {
      metrics: {
        totalStudents,
        activeStudents,
        totalCourses,
        totalMockTests,
        totalLiveClassesUpcoming,
        totalEnrollments,
        totalRevenue,
      },
      recentStudents,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all students with search & pagination
const getStudents = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, isActive } = req.query;
    const query = { role: 'STUDENT' };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await User.countDocuments(query);
    const students = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Attach active device status for each student
    const studentIds = students.map(s => s._id);
    const activeSessions = await DeviceSession.find({
      studentId: { $in: studentIds },
      isActive: true,
    });

    const sessionMap = new Map(activeSessions.map(s => [s.studentId.toString(), s]));

    const enrichedStudents = students.map(student => ({
      ...student.toObject(),
      activeDevice: sessionMap.get(student._id.toString()) || null,
    }));

    return sendSuccess(res, 'Students retrieved', {
      students: enrichedStudents,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Reset student device session (Unlock / re-bind device)
const resetStudentDevice = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { reason } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // Revoke all active sessions for this student
    const result = await DeviceSession.updateMany(
      { studentId: student._id, isActive: true },
      {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason || 'Administrator reset device registration',
        revokedBy: 'ADMIN_RESET',
      }
    );

    // Record audit log
    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'DEVICE_SESSION_RESET',
      resource: 'User',
      resourceId: student._id.toString(),
      details: { studentEmail: student.email, reason: reason || 'Admin reset', sessionsRevoked: result.modifiedCount },
      ipAddress: req.ip || '',
    });

    emitDeviceRevocation(student._id, reason || 'Administrator reset device registration');
    emitStudentUpdate(student._id, 'DEVICE_RESET', { studentEmail: student.email });

    return sendSuccess(res, `Device sessions reset successfully. Student ${student.name} can now register their new device upon next login.`);
  } catch (error) {
    next(error);
  }
};

// Admin: Toggle student status (Suspend / Reactivate)
const toggleStudentStatus = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    student.isActive = !student.isActive;
    await student.save();

    if (!student.isActive) {
      await DeviceSession.updateMany(
        { studentId: student._id, isActive: true },
        {
          isActive: false,
          revokedAt: new Date(),
          revokedBy: 'ADMIN_SUSPEND',
          revokedReason: 'Account suspended by administration',
        }
      );
      emitDeviceRevocation(student._id, 'Your account has been suspended by administration.');
    }

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: student.isActive ? 'STUDENT_ACTIVATED' : 'STUDENT_SUSPENDED',
      resource: 'User',
      resourceId: student._id.toString(),
      details: { studentEmail: student.email, newStatus: student.isActive },
    });

    emitStudentUpdate(student._id, 'STATUS_TOGGLED', { isActive: student.isActive });
    emitAdminStatsUpdate();

    return sendSuccess(res, `Student account ${student.isActive ? 'activated' : 'suspended'} successfully`, student);
  } catch (error) {
    next(error);
  }
};

// Admin: Get Security Audit Logs (Current-Day Records Only)
const getAuditLogs = async (req, res, next) => {
  try {
    const timezone = await getTimezone();
    const startOfDay = getStartOfDayInTimezone(timezone);

    // 1. Permanently delete all logs created before today's start in the database
    const cleanupResult = await cleanupExpiredAuditLogs({ timezone, startOfDay });

    // 2. Query today's logs only
    const { action, resource, search, page = 1, limit = 50 } = req.query;
    const query = {
      createdAt: { $gte: startOfDay },
    };
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Today's formatted date string in configured timezone
    const todayFormatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    return sendSuccess(res, "Today's security audit logs retrieved", {
      logs,
      date: todayFormatted,
      timezone,
      startOfDay: startOfDay.toISOString(),
      purgedCount: cleanupResult.deletedCount || 0,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Trigger manual audit log cleanup of records prior to current day
const triggerAuditLogCleanup = async (req, res, next) => {
  try {
    const timezone = await getTimezone();
    const result = await cleanupExpiredAuditLogs({ timezone });
    return sendSuccess(
      res,
      `Audit logs cleanup executed. Purged ${result.deletedCount} expired record(s) older than start of day.`,
      result
    );
  } catch (error) {
    next(error);
  }
};

// Admin: Analytics & Reports Data
const getReportsData = async (req, res, next) => {
  try {
    const Enrollment = require('../models/Enrollment');
    const ExamAttempt = require('../models/ExamAttempt');

    const now = new Date();
    // Build 6-month date range
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      });
    }

    const rangeStart = new Date(months[0].year, months[0].month - 1, 1);

    // Monthly revenue from PAID orders
    const revenueByMonth = await Order.aggregate([
      { $match: { status: 'PAID', createdAt: { $gte: rangeStart } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$amount' } } },
    ]);

    // Monthly enrollments
    const enrollmentsByMonth = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    ]);

    // Division breakdown
    const divisionBreakdown = await Enrollment.aggregate([
      { $group: { _id: '$division', count: { $sum: 1 } } },
    ]);

    // Map months to chart data
    const revenueMap = {};
    revenueByMonth.forEach(r => { revenueMap[`${r._id.year}-${r._id.month}`] = r.total; });
    const enrollMap = {};
    enrollmentsByMonth.forEach(e => { enrollMap[`${e._id.year}-${e._id.month}`] = e.count; });

    const monthlyRevenue = months.map(m => ({
      label: m.label,
      revenue: revenueMap[`${m.year}-${m.month}`] || 0,
    }));
    const monthlyEnrollments = months.map(m => ({
      label: m.label,
      enrollments: enrollMap[`${m.year}-${m.month}`] || 0,
    }));

    // Summary stats
    const [totalRevenueAgg, totalEnrollments, activeStudents, totalExamAttempts] = await Promise.all([
      Order.aggregate([{ $match: { status: 'PAID' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Enrollment.countDocuments(),
      User.countDocuments({ role: 'STUDENT', isActive: true }),
      ExamAttempt.countDocuments({ status: 'SUBMITTED' }),
    ]);

    return sendSuccess(res, 'Reports data retrieved', {
      monthlyRevenue,
      monthlyEnrollments,
      divisionBreakdown: divisionBreakdown.map(d => ({ name: d._id || 'Unknown', value: d.count })),
      summary: {
        totalRevenue: totalRevenueAgg[0]?.sum || 0,
        totalEnrollments,
        activeStudents,
        totalExamAttempts,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getStudents,
  resetStudentDevice,
  toggleStudentStatus,
  getAuditLogs,
  triggerAuditLogCleanup,
  getReportsData,
};
