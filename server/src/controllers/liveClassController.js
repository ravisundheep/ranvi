const LiveClass = require('../models/LiveClass');
const Entitlement = require('../models/Entitlement');
const Notification = require('../models/Notification');
const Course = require('../models/Course');
const { isValidZoomUrl } = require('../utils/zoomValidator');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { broadcastLiveClassUpdate } = require('../utils/socketService');

// Public: Get sanitized live class schedule (no Zoom URL or passcode exposed)
const getPublicLiveClassSchedule = async (req, res, next) => {
  try {
    const classes = await LiveClass.find({
      isPublished: true,
      status: { $in: ['SCHEDULED', 'LIVE'] },
    })
      .select('title subject batchName facultyName scheduledDate startTime durationMinutes status courseId createdAt')
      .populate('courseId', 'title slug division thumbnail')
      .sort({ scheduledDate: 1, startTime: 1 })
      .limit(24)
      .lean();

    return sendSuccess(res, 'Public live class schedule retrieved', classes);
  } catch (error) {
    next(error);
  }
};

// Student: Get upcoming authorized live classes for enrolled courses
const getStudentLiveClasses = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // Find all active course entitlements for this student
    const entitlements = await Entitlement.find({
      studentId,
      itemType: 'COURSE',
      isActive: true,
      status: { $in: ['ACTIVE', 'ENROLLED'] },
      validUntil: { $gte: new Date() },
    });

    const enrolledCourseIds = entitlements.map(e => e.itemId);

    // Get live classes for these courses
    const classes = await LiveClass.find({
      courseId: { $in: enrolledCourseIds },
      isPublished: true,
    })
      .populate('courseId', 'title slug thumbnail')
      .sort({ scheduledDate: 1, startTime: 1 });

    return sendSuccess(res, 'Student live classes retrieved', classes);
  } catch (error) {
    next(error);
  }
};

// Admin: Get all live classes with filtering
const getAllLiveClasses = async (req, res, next) => {
  try {
    const { courseId, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await LiveClass.countDocuments(query);
    const classes = await LiveClass.find(query)
      .populate('courseId', 'title slug')
      .sort({ scheduledDate: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return sendSuccess(res, 'Live classes retrieved', {
      classes,
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

// Admin: Create live class with Zoom URL validation
const createLiveClass = async (req, res, next) => {
  try {
    const {
      title,
      courseId,
      subject,
      batchName,
      facultyName,
      scheduledDate,
      startTime,
      durationMinutes,
      zoomMeetingUrl,
      zoomMeetingId,
      zoomPasscode,
      instructions,
    } = req.body;

    if (!title || !courseId || !facultyName || !scheduledDate || !startTime || !zoomMeetingUrl) {
      return sendError(res, 'Please provide title, course, faculty, scheduled date, time, and Zoom meeting URL', 400);
    }

    if (!isValidZoomUrl(zoomMeetingUrl)) {
      return sendError(res, 'Invalid Zoom meeting URL. Please provide a legitimate zoom.us link.', 400);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Associated course not found', 404);
    }

    const liveClass = await LiveClass.create({
      title,
      courseId,
      subject: subject || 'General',
      batchName: batchName || 'Regular Batch',
      facultyName,
      scheduledDate: new Date(scheduledDate),
      startTime,
      durationMinutes: durationMinutes || 60,
      zoomMeetingUrl,
      zoomMeetingId: zoomMeetingId || '',
      zoomPasscode: zoomPasscode || '',
      instructions: instructions || 'Please join 10 minutes prior with Zoom installed.',
      status: 'SCHEDULED',
      isPublished: true,
    });

    // Notify enrolled students
    const activeEntitlements = await Entitlement.find({
      itemId: courseId,
      itemType: 'COURSE',
      isActive: true,
    });

    for (const ent of activeEntitlements) {
      await Notification.create({
        recipientId: ent.studentId,
        title: `New Live Class: ${title}`,
        message: `A live Zoom session for "${course.title}" is scheduled on ${new Date(scheduledDate).toLocaleDateString()} at ${startTime}.`,
        type: 'LIVE_CLASS',
        link: '/student/live-classes',
      });
    }

    broadcastLiveClassUpdate('CREATE', liveClass);
    return sendSuccess(res, 'Live class scheduled successfully', liveClass, 201);
  } catch (error) {
    next(error);
  }
};

// Admin: Update live class
const updateLiveClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { zoomMeetingUrl } = req.body;

    if (zoomMeetingUrl && !isValidZoomUrl(zoomMeetingUrl)) {
      return sendError(res, 'Invalid Zoom meeting URL. Must be a valid zoom.us link.', 400);
    }

    const liveClass = await LiveClass.findByIdAndUpdate(id, req.body, { new: true });
    if (!liveClass) {
      return sendError(res, 'Live class not found', 404);
    }

    broadcastLiveClassUpdate('UPDATE', liveClass);
    return sendSuccess(res, 'Live class updated successfully', liveClass);
  } catch (error) {
    next(error);
  }
};

// Admin: Cancel live class
const cancelLiveClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const liveClass = await LiveClass.findById(id).populate('courseId');
    if (!liveClass) {
      return sendError(res, 'Live class not found', 404);
    }

    liveClass.status = 'CANCELLED';
    await liveClass.save();

    // Notify students of cancellation
    const activeEntitlements = await Entitlement.find({
      itemId: liveClass.courseId._id,
      itemType: 'COURSE',
      isActive: true,
    });

    for (const ent of activeEntitlements) {
      await Notification.create({
        recipientId: ent.studentId,
        title: `Class Cancelled: ${liveClass.title}`,
        message: `The live class "${liveClass.title}" scheduled for ${liveClass.scheduledDate.toLocaleDateString()} has been cancelled.`,
        type: 'LIVE_CLASS',
        link: '/student/live-classes',
      });
    }

    broadcastLiveClassUpdate('CANCEL', liveClass);
    return sendSuccess(res, 'Live class cancelled and enrolled students notified', liveClass);
  } catch (error) {
    next(error);
  }
};

// Admin: Delete live class
const deleteLiveClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const liveClass = await LiveClass.findByIdAndDelete(id);
    if (!liveClass) {
      return sendError(res, 'Live class not found', 404);
    }
    broadcastLiveClassUpdate('DELETE', liveClass);
    return sendSuccess(res, 'Live class deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicLiveClassSchedule,
  getStudentLiveClasses,
  getAllLiveClasses,
  createLiveClass,
  updateLiveClass,
  cancelLiveClass,
  deleteLiveClass,
};

