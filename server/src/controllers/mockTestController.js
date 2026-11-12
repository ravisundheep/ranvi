const mongoose = require('mongoose');
const MockTest = require('../models/MockTest');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const Entitlement = require('../models/Entitlement');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { attachMediaTokenIfLocal } = require('../middleware/protectedMedia');

// Public/Student: Get list of mock tests
const getMockTests = async (req, res, next) => {
  try {
    const { division, courseId, isDemoFree, search, page = 1, limit = 20 } = req.query;
    const isAdmin = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    const query = isAdmin && req.query.includeUnpublished === 'true' ? {} : { isPublished: true };

    if (division && division !== 'ALL') query.division = division.toUpperCase();
    if (courseId) query.courseId = courseId;
    if (isDemoFree !== undefined) query.isDemoFree = isDemoFree === 'true';
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await MockTest.countDocuments(query);
    const rawTests = await MockTest.find(query)
      .populate('courseId', 'title slug thumbnail')
      .sort({ paperNumber: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    let unlockedItemIds = new Set();
    if (req.user && !isAdmin) {
      const entitlements = await Entitlement.find({
        studentId: req.user._id,
        isActive: true,
        status: { $in: ['ACTIVE', 'ENROLLED'] },
        validUntil: { $gte: new Date() },
      }).select('itemId').lean();
      unlockedItemIds = new Set(entitlements.map((e) => e.itemId.toString()));
    }

    const tests = rawTests.map((t) => {
      const testCourseId = t.courseId?._id ? t.courseId._id.toString() : t.courseId ? t.courseId.toString() : null;
      const isUnlocked = Boolean(
        isAdmin ||
        t.isDemoFree ||
        unlockedItemIds.has(t._id.toString()) ||
        (testCourseId && unlockedItemIds.has(testCourseId))
      );
      return {
        ...t,
        isUnlocked,
        paperPdfUrl: isUnlocked ? attachMediaTokenIfLocal(t.paperPdfUrl, req.user?._id || 'public') : '',
        solutionPdfUrl: isUnlocked ? attachMediaTokenIfLocal(t.solutionPdfUrl, req.user?._id || 'public') : '',
      };
    });

    return sendSuccess(res, 'Mock tests retrieved', {
      tests,
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

// Public/Student: Get mock test overview by slug or ID
const getMockTestBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const isAdmin = req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    const idOrSlug = isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug };
    const query = isAdmin ? idOrSlug : { ...idOrSlug, isPublished: true };
    const test = await MockTest.findOne(query)
      .populate('courseId', 'title slug fee thumbnail')
      .lean();

    if (!test) {
      return sendError(res, 'Mock test not found', 404);
    }

    let isUnlocked = Boolean(test.isDemoFree);
    if (req.user) {
      if (isAdmin) {
        isUnlocked = true;
      } else {
        const lookupIds = [test._id];
        if (test.courseId?._id) lookupIds.push(test.courseId._id);
        const entitlement = await Entitlement.findOne({
          studentId: req.user._id,
          itemId: { $in: lookupIds },
          isActive: true,
          status: { $in: ['ACTIVE', 'ENROLLED'] },
          validUntil: { $gte: new Date() },
        });
        if (entitlement) isUnlocked = true;
      }
    }

    const sanitizedTest = {
      ...test,
      isUnlocked,
      paperPdfUrl: isUnlocked ? attachMediaTokenIfLocal(test.paperPdfUrl, req.user?._id || 'public') : '',
      solutionPdfUrl: isUnlocked ? attachMediaTokenIfLocal(test.solutionPdfUrl, req.user?._id || 'public') : '',
    };

    return sendSuccess(res, 'Mock test details retrieved', {
      test: sanitizedTest,
      isUnlocked,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create Mock Test
const createMockTest = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      paperNumber,
      courseId,
      division,
      description,
      durationMinutes,
      totalMarks,
      passMarks,
      negativeMarkingPerQuestion,
      marksPerQuestion,
      isDemoFree,
      price,
      instructions,
      maxAttempts,
      negativeMarkingEnabled,
    } = req.body;

    const testSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await MockTest.findOne({ slug: testSlug });
    if (existing) {
      return sendError(res, 'A mock test with this slug already exists', 400);
    }

    const mockTest = await MockTest.create({
      title,
      slug: testSlug,
      paperNumber: paperNumber || 1,
      courseId: courseId || null,
      division,
      description: description || '',
      durationMinutes: durationMinutes || 60,
      totalMarks: totalMarks || 100,
      passMarks: passMarks || 40,
      negativeMarkingPerQuestion: negativeMarkingPerQuestion !== undefined ? negativeMarkingPerQuestion : 0.25,
      marksPerQuestion: marksPerQuestion || 1,
      isDemoFree: isDemoFree || false,
      price: price || 0,
      paperPdfUrl: req.body.paperPdfUrl || '',
      paperPdfName: req.body.paperPdfName || '',
      solutionPdfUrl: req.body.solutionPdfUrl || '',
      solutionPdfName: req.body.solutionPdfName || '',
      maxAttempts: maxAttempts !== undefined ? Number(maxAttempts) : 0,
      negativeMarkingEnabled: negativeMarkingEnabled !== undefined ? Boolean(negativeMarkingEnabled) : true,
      instructions: instructions || [
        'Each question has four options with only one correct response.',
        'Negative marks apply for incorrect answers.',
        'Click on Question Palette to jump between questions directly.',
        'You can change your responses anytime before the timer ends.',
      ],
    });

    return sendSuccess(res, 'Mock test created successfully', mockTest, 201);
  } catch (error) {
    next(error);
  }
};

// Admin: Add single question
const addQuestion = async (req, res, next) => {
  try {
    const { mockTestId } = req.params;
    const { questionText, questionImage, options, marks, negativeMarks, explanation, subject, topic, sortOrder } = req.body;

    if (!questionText || !options || options.length < 2) {
      return sendError(res, 'Question text and at least 2 options are required', 400);
    }

    const hasCorrectOption = options.some(opt => opt.isCorrect === true);
    if (!hasCorrectOption) {
      return sendError(res, 'At least one option must be marked as correct (isCorrect: true)', 400);
    }

    const question = await Question.create({
      mockTestId,
      questionText,
      questionImage: questionImage || '',
      options,
      marks: marks || 1,
      negativeMarks: negativeMarks !== undefined ? negativeMarks : 0.25,
      explanation: explanation || '',
      subject: subject || 'General',
      topic: topic || '',
      sortOrder: sortOrder || 0,
    });

    // Update total questions count in MockTest
    const count = await Question.countDocuments({ mockTestId });
    await MockTest.findByIdAndUpdate(mockTestId, { totalQuestions: count });

    return sendSuccess(res, 'Question added successfully', question, 201);
  } catch (error) {
    next(error);
  }
};

// Admin: Get questions for a mock test (with answer keys for editing)
const getAdminMockTestQuestions = async (req, res, next) => {
  try {
    const { mockTestId } = req.params;
    const questions = await Question.find({ mockTestId }).sort({ sortOrder: 1, createdAt: 1 });
    return sendSuccess(res, 'Questions retrieved', questions);
  } catch (error) {
    next(error);
  }
};

// Admin: Delete question
const deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findByIdAndDelete(questionId);
    if (!question) {
      return sendError(res, 'Question not found', 404);
    }
    const count = await Question.countDocuments({ mockTestId: question.mockTestId });
    await MockTest.findByIdAndUpdate(question.mockTestId, { totalQuestions: count });
    return sendSuccess(res, 'Question deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Admin: Update Mock Test
const updateMockTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
    const mockTest = await MockTest.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!mockTest) {
      return sendError(res, 'Mock test not found', 404);
    }
    return sendSuccess(res, 'Mock test updated successfully', mockTest);
  } catch (error) {
    next(error);
  }
};

// Admin: Delete Mock Test
const deleteMockTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
    const mockTest = await MockTest.findOneAndDelete(query);
    if (!mockTest) {
      return sendError(res, 'Mock test not found', 404);
    }
    // Remove associated questions
    await Question.deleteMany({ mockTestId: mockTest._id });
    return sendSuccess(res, 'Mock test and its questions deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Admin: Update Question
const updateQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findByIdAndUpdate(questionId, req.body, { new: true, runValidators: true });
    if (!question) {
      return sendError(res, 'Question not found', 404);
    }
    return sendSuccess(res, 'Question updated successfully', question);
  } catch (error) {
    next(error);
  }
};

// Admin: Upload Mock Test Paper (with optional PDF and/or questions dataset)
const uploadMockTestPaper = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      paperNumber,
      courseId,
      division,
      description,
      durationMinutes,
      totalMarks,
      passMarks,
      negativeMarkingPerQuestion,
      marksPerQuestion,
      isDemoFree,
      price,
      instructions,
      paperPdfUrl,
      paperPdfName,
      solutionPdfUrl,
      solutionPdfName,
      questions,
    } = req.body;

    if (!title || !division) {
      return sendError(res, 'Title and division are required for mock test paper', 400);
    }

    const testSlug = slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Date.now().toString().slice(-4)}`;

    const mockTest = await MockTest.create({
      title,
      slug: testSlug,
      paperNumber: paperNumber || 1,
      courseId: courseId || null,
      division,
      description: description || '',
      durationMinutes: durationMinutes || 60,
      totalMarks: totalMarks || 100,
      passMarks: passMarks || 40,
      negativeMarkingPerQuestion: negativeMarkingPerQuestion !== undefined ? negativeMarkingPerQuestion : 0.25,
      marksPerQuestion: marksPerQuestion || 1,
      isDemoFree: isDemoFree || false,
      price: price || 0,
      paperPdfUrl: paperPdfUrl || '',
      paperPdfName: paperPdfName || '',
      solutionPdfUrl: solutionPdfUrl || '',
      solutionPdfName: solutionPdfName || '',
      totalQuestions: Array.isArray(questions) ? questions.length : 0,
      instructions: instructions || [
        'Each question has four options with only one correct response.',
        'Negative marks apply for incorrect answers.',
        'Click on Question Palette to jump between questions directly.',
        'You can change your responses anytime before the timer ends.',
      ],
      isPublished: true,
    });

    // If questions were included in upload payload, insert them automatically
    if (Array.isArray(questions) && questions.length > 0) {
      const questionDocs = questions.map((q, idx) => ({
        mockTestId: mockTest._id,
        questionText: q.questionText || `Question ${idx + 1}`,
        questionImage: q.questionImage || '',
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : [
          { text: 'Option A', isCorrect: true },
          { text: 'Option B', isCorrect: false },
          { text: 'Option C', isCorrect: false },
          { text: 'Option D', isCorrect: false },
        ],
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks !== undefined ? q.negativeMarks : 0.25,
        explanation: q.explanation || '',
        subject: q.subject || 'General Banking',
        topic: q.topic || 'Model Paper',
        sortOrder: q.sortOrder || idx + 1,
      }));

      await Question.insertMany(questionDocs);
    }

    return sendSuccess(res, 'Mock test paper uploaded and stored successfully', mockTest, 201);
  } catch (error) {
    next(error);
  }
};

// Admin: Bulk upload questions into an existing mock test
const bulkUploadQuestions = async (req, res, next) => {
  try {
    const { mockTestId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return sendError(res, 'Please provide an array of questions to import', 400);
    }

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return sendError(res, 'Mock test not found', 404);
    }

    const existingCount = await Question.countDocuments({ mockTestId });
    const questionDocs = questions.map((q, idx) => ({
      mockTestId,
      questionText: q.questionText || `Question ${existingCount + idx + 1}`,
      questionImage: q.questionImage || '',
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : [
        { text: 'Option A', isCorrect: true },
        { text: 'Option B', isCorrect: false },
      ],
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks !== undefined ? q.negativeMarks : 0.25,
      explanation: q.explanation || '',
      subject: q.subject || 'General Banking',
      topic: q.topic || 'Practice',
      sortOrder: existingCount + idx + 1,
    }));

    await Question.insertMany(questionDocs);
    const newCount = await Question.countDocuments({ mockTestId });
    await MockTest.findByIdAndUpdate(mockTestId, { totalQuestions: newCount });

    return sendSuccess(res, `${questionDocs.length} questions imported successfully`, {
      importedCount: questionDocs.length,
      totalQuestions: newCount,
    }, 201);
  } catch (error) {
    next(error);
  }
};

// Public/Student: Get mock test leaderboard
const getMockTestLeaderboard = async (req, res, next) => {
  try {
    const { mockTestId } = req.params;
    const requestingStudentId = req.user._id.toString();
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);

    const mockTest = await MockTest.findById(mockTestId).lean();
    if (!mockTest || !mockTest.isPublished) {
      return sendError(res, 'Mock test not found', 404);
    }

    // Best attempt per student (sort by score desc, time asc, then submittedAt asc before grouping)
    const leaderboard = await ExamAttempt.aggregate([
      { $match: { mockTestId: new mongoose.Types.ObjectId(mockTestId), status: 'SUBMITTED' } },
      { $sort: { score: -1, timeSpentSeconds: 1, submittedAt: 1 } },
      {
        $group: {
          _id: '$studentId',
          bestScore: { $first: '$score' },
          totalMarks: { $first: '$totalMarks' },
          accuracyPercentage: { $first: '$accuracyPercentage' },
          timeSpentSeconds: { $first: '$timeSpentSeconds' },
          submittedAt: { $first: '$submittedAt' },
          attemptId: { $first: '$_id' },
        },
      },
      { $sort: { bestScore: -1, timeSpentSeconds: 1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $project: {
          _id: 0,
          studentId: '$_id',
          name: '$student.name',
          studentIdCode: '$student.studentId',
          bestScore: 1,
          totalMarks: 1,
          accuracyPercentage: 1,
          timeSpentSeconds: 1,
          submittedAt: 1,
        },
      },
    ]);

    // Mask names: show full name only for self and admins
    const ranked = leaderboard.map((entry, index) => {
      const isSelf = entry.studentId.toString() === requestingStudentId;
      const nameParts = (entry.name || 'Student').split(' ');
      const maskedName = isAdmin || isSelf
        ? entry.name
        : `${nameParts[0]} ${'*'.repeat(Math.max(1, (nameParts[1] || '').length) || 3)}`;
      return {
        rank: index + 1,
        name: maskedName,
        studentIdCode: isAdmin || isSelf ? (entry.studentIdCode || '—') : '—',
        bestScore: entry.bestScore,
        totalMarks: entry.totalMarks,
        accuracyPercentage: entry.accuracyPercentage,
        timeSpentSeconds: entry.timeSpentSeconds,
        isSelf,
      };
    });

    // Find requesting student's own rank if not in top 50
    const selfRank = ranked.find(r => r.isSelf);

    const totalParticipants = await ExamAttempt.distinct('studentId', { mockTestId: mockTest._id, status: 'SUBMITTED' }).then(arr => arr.length);

    return sendSuccess(res, 'Leaderboard retrieved', {
      mockTest: { title: mockTest.title, totalMarks: mockTest.totalMarks },
      leaderboard: ranked,
      selfRank: selfRank || null,
      totalParticipants,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMockTests,
  getMockTestBySlug,
  createMockTest,
  uploadMockTestPaper,
  updateMockTest,
  deleteMockTest,
  addQuestion,
  bulkUploadQuestions,
  getAdminMockTestQuestions,
  updateQuestion,
  deleteQuestion,
  getMockTestLeaderboard,
};


