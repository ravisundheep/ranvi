const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Entitlement = require('../models/Entitlement');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { attachMediaTokenIfLocal } = require('../middleware/protectedMedia');

// Get all lessons of a course with locked/unlocked statuses
const getCourseLessons = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    let isEnrolled = false;
    if (req.user) {
      if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
        isEnrolled = true;
      } else if (req.user.role === 'FACULTY') {
        if (!assertFacultyCourseAccess(req.user, courseId)) {
          return sendError(res, 'Forbidden: Faculty may only access lessons for their assigned courses.', 403);
        }
        isEnrolled = true;
      } else {
        const activeEntitlement = await Entitlement.findOne({
          studentId: req.user._id,
          itemId: course._id,
          isActive: true,
          status: { $in: ['ACTIVE', 'ENROLLED'] },
          validUntil: { $gte: new Date() },
        });
        if (activeEntitlement) {
          isEnrolled = true;
        }
      }
    }

    const lessons = await Lesson.find({ courseId, isPublished: true }).sort({ sortOrder: 1, createdAt: 1 });

    // Sanitize URLs for locked lessons
    const sanitizedLessons = lessons.map(lesson => {
      const isUnlocked = isEnrolled || lesson.isPreview;
      return {
        _id: lesson._id,
        courseId: lesson.courseId,
        moduleTitle: lesson.moduleTitle,
        subject: lesson.subject || '',
        chapter: lesson.chapter || '',
        title: lesson.title,
        description: lesson.description,
        durationMinutes: lesson.durationMinutes,
        sortOrder: lesson.sortOrder,
        isPreview: lesson.isPreview,
        studyMaterialName: lesson.studyMaterialName,
        isUnlocked,
        // Only provide videoUrl and material if unlocked
        videoUrl: isUnlocked ? lesson.videoUrl : null,
        studyMaterialUrl: isUnlocked ? lesson.studyMaterialUrl : null,
      };
    });

    return sendSuccess(res, 'Lessons retrieved', {
      course: {
        id: course._id,
        title: course.title,
        fee: course.fee,
        demoLessonsCount: course.demoLessonsCount,
      },
      isEnrolled,
      lessons: sanitizedLessons,
    });
  } catch (error) {
    next(error);
  }
};

// Stream single lesson with access authorization
const getLessonPlayback = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId).populate('courseId');
    if (!lesson) {
      return sendError(res, 'Lesson not found', 404);
    }

    let hasAccess = false;
    let accessType = 'LOCKED';

    if (req.user) {
      // Check if admin
      if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
        hasAccess = true;
        accessType = 'ADMIN';
      } else {
        // Check active entitlement with status validation
        const entitlement = await Entitlement.findOne({
          studentId: req.user._id,
          itemId: lesson.courseId._id,
          isActive: true,
          status: { $in: ['ACTIVE', 'ENROLLED'] },
          validUntil: { $gte: new Date() },
        });

        if (entitlement) {
          hasAccess = true;
          accessType = 'PURCHASED_ENROLMENT';
        } else if (lesson.isPreview) {
          // Free demo lesson
          hasAccess = true;
          accessType = 'FREE_DEMO';

          // Track demo usage
          await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { 'demoUsage.recordedClasses': lesson._id },
          });
        }
      }
    } else if (lesson.isPreview) {
      // Public preview allowed
      hasAccess = true;
      accessType = 'PUBLIC_PREVIEW';
    }

    if (!hasAccess) {
      return sendError(res, 'This lesson requires an active course enrolment. Please enrol to unlock.', 403, {
        code: 'PAYMENT_REQUIRED',
        courseId: lesson.courseId._id,
        courseFee: lesson.courseId.fee,
      });
    }

    const mediaSubject = req.user ? req.user._id : 'public';
    return sendSuccess(res, 'Lesson playback authorized', {
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        moduleTitle: lesson.moduleTitle,
        subject: lesson.subject || '',
        chapter: lesson.chapter || '',
        description: lesson.description,
        videoUrl: attachMediaTokenIfLocal(lesson.videoUrl, mediaSubject),
        durationMinutes: lesson.durationMinutes,
        studyMaterialUrl: attachMediaTokenIfLocal(lesson.studyMaterialUrl, mediaSubject),
        studyMaterialName: lesson.studyMaterialName,
        course: {
          _id: lesson.courseId._id,
          title: lesson.courseId.title,
        },
      },
      accessType,
    });
  } catch (error) {
    next(error);
  }
};

const assertFacultyCourseAccess = (user, courseId) => {
  if (!user || user.role !== 'FACULTY') return true;
  const assigned = Array.isArray(user.assignedCourses) ? user.assignedCourses.map(String) : [];
  if (assigned.length === 0 || !courseId) return false;
  return assigned.includes(String(courseId));
};

// Admin / Assigned Faculty: Create lesson
const createLesson = async (req, res, next) => {
  try {
    const {
      courseId,
      moduleTitle,
      subject,
      chapter,
      title,
      description,
      videoUrl,
      durationMinutes,
      sortOrder,
      isPreview,
      studyMaterialUrl,
      studyMaterialName,
    } = req.body;

    if (!assertFacultyCourseAccess(req.user, courseId)) {
      return sendError(res, 'Forbidden: Faculty may only manage lessons for their assigned courses.', 403);
    }

    const lesson = await Lesson.create({
      courseId,
      moduleTitle,
      subject: subject || '',
      chapter: chapter || '',
      title,
      description,
      videoUrl,
      durationMinutes: durationMinutes || 45,
      sortOrder: sortOrder || 0,
      isPreview: isPreview || false,
      studyMaterialUrl: studyMaterialUrl || '',
      studyMaterialName: studyMaterialName || '',
    });

    return sendSuccess(res, 'Lesson created successfully', lesson, 201);
  } catch (error) {
    next(error);
  }
};

// Admin / Assigned Faculty: Update lesson
const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Lesson.findById(id);
    if (!existing) {
      return sendError(res, 'Lesson not found', 404);
    }
    const targetCourseId = req.body.courseId || existing.courseId;
    if (!assertFacultyCourseAccess(req.user, existing.courseId) || !assertFacultyCourseAccess(req.user, targetCourseId)) {
      return sendError(res, 'Forbidden: Faculty may only update lessons in their assigned courses.', 403);
    }
    const lesson = await Lesson.findByIdAndUpdate(id, req.body, { new: true });
    return sendSuccess(res, 'Lesson updated successfully', lesson);
  } catch (error) {
    next(error);
  }
};

// Admin / Assigned Faculty: Delete lesson
const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Lesson.findById(id);
    if (!existing) {
      return sendError(res, 'Lesson not found', 404);
    }
    if (!assertFacultyCourseAccess(req.user, existing.courseId)) {
      return sendError(res, 'Forbidden: Faculty may only delete lessons in their assigned courses.', 403);
    }
    await Lesson.findByIdAndDelete(id);
    return sendSuccess(res, 'Lesson deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourseLessons,
  getLessonPlayback,
  createLesson,
  updateLesson,
  deleteLesson,
};
