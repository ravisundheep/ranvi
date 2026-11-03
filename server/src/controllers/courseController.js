const Course = require('../models/Course');
const Category = require('../models/Category');
const Entitlement = require('../models/Entitlement');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { broadcastCourseUpdate } = require('../utils/socketService');

// Fast server-side response cache for public courses listing and states
const courseListCache = new Map();
let cachedStates = null;
let lastStatesFetch = 0;
const cachedCategories = new Map();

const invalidateCourseServerCache = () => {
  courseListCache.clear();
  cachedStates = null;
  lastStatesFetch = 0;
  cachedCategories.clear();
};

// Public: Get all courses with filters and pagination
const getCourses = async (req, res, next) => {
  try {
    const { division, category, search, page = 1, limit = 12, mode, featured, state, includeUnpublished } = req.query;

    // Check fast memory cache for standard public queries
    const cacheKey = JSON.stringify(req.query);
    if (includeUnpublished !== 'true' && !search) {
      const cached = courseListCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) {
        return sendSuccess(res, 'Courses retrieved (cached)', cached.data);
      }
    }

    const conditions = [];

    if (includeUnpublished !== 'true') {
      conditions.push({ isPublished: true });
    }

    if (division) {
      conditions.push({ division: division.toUpperCase() });
    }

    if (category) {
      // Find category by slug or id
      const cat = await Category.findOne({
        $or: [{ slug: category.toLowerCase() }, { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }],
      }).lean();
      if (cat) {
        conditions.push({ categoryId: cat._id });
      }
    }

    if (mode && mode !== 'ALL') {
      conditions.push({ mode: { $in: [mode, 'BOTH'] } });
    }

    if (featured === 'true') {
      conditions.push({ isFeatured: true });
    }

    if (state && state !== 'ALL' && state !== 'All' && state !== 'All India') {
      conditions.push({
        $or: [
          { states: state },
          { states: 'All India' },
          { states: { $size: 0 } },
          { states: { $exists: false } },
        ],
      });
    }

    if (search) {
      conditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { shortDescription: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ],
      });
    }

    const query = conditions.length === 0 ? {} : (conditions.length === 1 ? conditions[0] : { $and: conditions });

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .select('title slug division categoryId thumbnail fee originalPrice mode duration batchSchedule isPublished isFeatured states tileColor tileShortName tileSubtitle shortDescription displayOrder createdAt startDate endDate registrationDeadline totalSeats availableSeats isEnrollmentOpen eligibilityCriteria subject syllabusPdf documents')
      .populate('categoryId', 'name slug icon color division')
      .sort({ displayOrder: 1, isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const responsePayload = {
      courses,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
        limit: parseInt(limit, 10),
      },
    };

    if (includeUnpublished !== 'true' && !search) {
      courseListCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });
    }

    return sendSuccess(res, 'Courses retrieved', responsePayload);
  } catch (error) {
    next(error);
  }
};

// Public: Get course details by slug (with personalized entitlement status if logged in)
const getCourseBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const isObjectId = slug.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug };

    const isAdmin = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    if (!isAdmin && req.query.includeUnpublished !== 'true') {
      query.isPublished = true;
    }

    const course = await Course.findOne(query)
      .populate('categoryId', 'name slug icon color division');

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    let isEnrolled = false;
    let entitlement = null;

    if (req.user) {
      const activeEntitlement = await Entitlement.findOne({
        studentId: req.user._id,
        itemId: course._id,
        isActive: true,
        validUntil: { $gte: new Date() },
      });

      if (activeEntitlement) {
        isEnrolled = true;
        entitlement = activeEntitlement;
      }
    }

    return sendSuccess(res, 'Course details retrieved', {
      course,
      userAccess: {
        isEnrolled,
        entitlement,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Public: Get all active categories by division
const getCategories = async (req, res, next) => {
  try {
    const { division } = req.query;
    const catCacheKey = division ? division.toUpperCase() : 'ALL';
    const cachedCat = cachedCategories.get(catCacheKey);
    if (cachedCat && Date.now() - cachedCat.timestamp < 120000) {
      return sendSuccess(res, 'Categories retrieved (cached)', cachedCat.data);
    }

    const query = { isActive: true };
    if (division) {
      query.division = division.toUpperCase();
    }

    const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 }).lean();
    cachedCategories.set(catCacheKey, { data: categories, timestamp: Date.now() });
    return sendSuccess(res, 'Categories retrieved', categories);
  } catch (error) {
    next(error);
  }
};

// Admin: Create course
const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      division,
      categoryId,
      shortDescription,
      fullDescription,
      thumbnail,
      mode,
      duration,
      batchSchedule,
      fee,
      originalPrice,
      validityDays,
      isDemoEligible,
      demoLessonsCount,
      demoExamsCount,
      syllabus,
      learningObjectives,
      faculty,
      features,
      faqs,
      seoTitle,
      seoDescription,
      tags,
      isFeatured,
      states,
      tileSubtitle,
      tileColor,
      displayOrder,
      isPublished,
      startDate,
      endDate,
      registrationDeadline,
      totalSeats,
      availableSeats,
      isEnrollmentOpen,
      eligibilityCriteria,
      subject,
      syllabusPdf,
      documents,
    } = req.body;

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId) {
      const fallbackCat = await Category.findOne(division ? { division } : {});
      if (fallbackCat) {
        resolvedCategoryId = fallbackCat._id;
      }
    }

    const courseSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = await Course.findOne({ slug: courseSlug });
    if (existing) {
      return sendError(res, 'A course with this slug already exists', 400);
    }

    const course = await Course.create({
      title,
      slug: courseSlug,
      division,
      categoryId: resolvedCategoryId,
      shortDescription,
      fullDescription,
      thumbnail,
      mode: mode || 'BOTH',
      duration: duration || '3 Months',
      batchSchedule: batchSchedule || 'Daily Live & Interactive Batches',
      fee: Number(fee),
      originalPrice: originalPrice ? Number(originalPrice) : fee,
      validityDays: validityDays || 180,
      isDemoEligible: isDemoEligible !== undefined ? isDemoEligible : true,
      demoLessonsCount: demoLessonsCount || 2,
      demoExamsCount: demoExamsCount || 1,
      syllabus: syllabus || [],
      learningObjectives: learningObjectives || [],
      faculty: faculty || [],
      features: features || [],
      faqs: faqs || [],
      seoTitle: seoTitle || `${title} - Ranvi Institutions`,
      seoDescription: seoDescription || shortDescription,
      tags: tags || [],
      isFeatured: isFeatured || false,
      isPublished: isPublished !== undefined ? isPublished : true,
      states: Array.isArray(states) && states.length > 0 ? states : ['All India'],
      tileSubtitle: tileSubtitle || '',
      tileColor: tileColor || '',
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      totalSeats: totalSeats !== undefined ? Number(totalSeats) : 50,
      availableSeats: availableSeats !== undefined ? Number(availableSeats) : (totalSeats !== undefined ? Number(totalSeats) : 50),
      isEnrollmentOpen: isEnrollmentOpen !== undefined ? Boolean(isEnrollmentOpen) : true,
      eligibilityCriteria: eligibilityCriteria || '',
      subject: subject || '',
      syllabusPdf: syllabusPdf || '',
      documents: Array.isArray(documents) ? documents : [],
    });

    invalidateCourseServerCache();
    broadcastCourseUpdate('CREATE', course);

    return sendSuccess(res, 'Course created successfully', course, 201);
  } catch (error) {
    next(error);
  }
};

// Admin: Update course
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
    const course = await Course.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }
    invalidateCourseServerCache();
    broadcastCourseUpdate('UPDATE', course);
    return sendSuccess(res, 'Course updated successfully', course);
  } catch (error) {
    next(error);
  }
};

// Admin: Delete course (permanent or soft-unpublish)
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
    const course = await Course.findOne(query);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }
    if (permanent === 'true') {
      await Course.deleteOne({ _id: course._id });
      invalidateCourseServerCache();
      broadcastCourseUpdate('DELETE', course);
      return sendSuccess(res, 'Course permanently deleted successfully');
    }
    // Soft delete or unpublish
    course.isPublished = false;
    await course.save();
    invalidateCourseServerCache();
    broadcastCourseUpdate('UNPUBLISH', course);
    return sendSuccess(res, 'Course unpublished successfully');
  } catch (error) {
    next(error);
  }
};


// Public: Get list of all states associated with courses
const getAvailableStates = async (req, res, next) => {
  try {
    if (cachedStates && Date.now() - lastStatesFetch < 120000) {
      return sendSuccess(res, 'Available states retrieved (cached)', cachedStates);
    }

    const defaultStates = [
      'All India',
      'Andhra Pradesh',
      'Telangana',
      'Karnataka',
      'Tamil Nadu',
      'Maharashtra',
      'Delhi',
      'Uttar Pradesh',
      'Kerala',
      'Bihar',
      'Rajasthan',
      'Madhya Pradesh',
      'West Bengal',
      'Gujarat',
      'Punjab',
      'Haryana',
      'Odisha',
    ];
    const dbStates = await Course.distinct('states');
    const flatDbStates = (dbStates || []).flat().filter(Boolean);
    const set = new Set(['All India']);
    defaultStates.forEach((s) => set.add(s));
    flatDbStates.forEach((s) => set.add(s));
    cachedStates = Array.from(set);
    lastStatesFetch = Date.now();
    return sendSuccess(res, 'Available states retrieved', cachedStates);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourseBySlug,
  getCategories,
  getAvailableStates,
  createCourse,
  updateCourse,
  deleteCourse,
};
