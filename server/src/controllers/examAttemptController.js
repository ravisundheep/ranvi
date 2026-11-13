const ExamAttempt = require('../models/ExamAttempt');
const MockTest = require('../models/MockTest');
const Question = require('../models/Question');
const Entitlement = require('../models/Entitlement');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Start an exam or resume active attempt
const startExam = async (req, res, next) => {
  try {
    const { mockTestId } = req.params;
    const studentId = req.user._id;

    const mockTest = await MockTest.findById(mockTestId).populate('courseId');
    if (!mockTest || !mockTest.isPublished) {
      return sendError(res, 'Mock test not found or unavailable', 404);
    }

    // Access check: Free demo, individual test purchase, active course entitlement, or admin role
    let hasAccess = false;
    if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      hasAccess = true;
    } else if (mockTest.isDemoFree) {
      hasAccess = true;
      // Record free demo usage
      await User.findByIdAndUpdate(studentId, {
        $addToSet: { 'demoUsage.mockTests': mockTest._id },
      });
    } else {
      const lookupIds = [mockTest._id];
      if (mockTest.courseId?._id) lookupIds.push(mockTest.courseId._id);
      const entitlement = await Entitlement.findOne({
        studentId,
        itemId: { $in: lookupIds },
        isActive: true,
        status: { $in: ['ACTIVE', 'ENROLLED'] },
        validUntil: { $gte: new Date() },
      });
      if (entitlement) hasAccess = true;
    }

    if (!hasAccess) {
      return sendError(res, 'This mock test requires enrolment or purchase. Please enrol to start testing.', 403, {
        code: 'PAYMENT_REQUIRED',
        courseId: mockTest.courseId ? mockTest.courseId._id : null,
      });
    }

    // Check for an existing in-progress attempt
    let attempt = await ExamAttempt.findOne({
      studentId,
      mockTestId,
      status: 'IN_PROGRESS',
    });

    const now = new Date();

    if (attempt) {
      // Check if time expired
      if (now > attempt.expiresAt) {
        // Auto-finalize
        await finalizeAttempt(attempt._id);
        attempt = null;
      }
    }

    if (!attempt) {
      // Enforce attempt limit (maxAttempts=0 means unlimited)
      if (mockTest.maxAttempts > 0 && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
        const completedAttempts = await ExamAttempt.countDocuments({
          studentId,
          mockTestId,
          status: { $in: ['SUBMITTED', 'EXPIRED'] },
        });
        if (completedAttempts >= mockTest.maxAttempts) {
          return sendError(res, `You have reached the maximum number of attempts (${mockTest.maxAttempts}) for this test.`, 403, { code: 'MAX_ATTEMPTS_REACHED', attemptsUsed: completedAttempts, maxAttempts: mockTest.maxAttempts });
        }
      }

      const expiresAt = new Date(now.getTime() + mockTest.durationMinutes * 60 * 1000);
      attempt = await ExamAttempt.create({
        studentId,
        mockTestId,
        status: 'IN_PROGRESS',
        startedAt: now,
        expiresAt,
        totalMarks: mockTest.totalMarks,
        responses: [],
      });

      // Increment attempt counter on MockTest
      await MockTest.findByIdAndUpdate(mockTestId, { $inc: { attemptsCount: 1 } });
    }

    // Fetch questions and sanitize them (DO NOT expose isCorrect or explanation to client during test)
    const questions = await Question.find({ mockTestId }).sort({ sortOrder: 1, createdAt: 1 });
    const sanitizedQuestions = questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      questionImage: q.questionImage,
      options: q.options.map(opt => ({ text: opt.text })), // text only, no isCorrect
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      subject: q.subject,
      topic: q.topic,
    }));

    const remainingSeconds = Math.max(0, Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000));

    return sendSuccess(res, 'Exam session active', {
      attemptId: attempt._id,
      mockTest: {
        _id: mockTest._id,
        title: mockTest.title,
        durationMinutes: mockTest.durationMinutes,
        totalMarks: mockTest.totalMarks,
        negativeMarkingPerQuestion: mockTest.negativeMarkingPerQuestion,
        instructions: mockTest.instructions,
      },
      remainingSeconds,
      responses: attempt.responses,
      questions: sanitizedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// Autosave question response
const saveResponse = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOptionIndex, isMarkedForReview } = req.body;
    const studentId = req.user._id;

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      studentId,
      status: 'IN_PROGRESS',
    });

    if (!attempt) {
      return sendError(res, 'Active exam attempt not found', 404);
    }

    // Check if time expired
    if (new Date() > attempt.expiresAt) {
      await finalizeAttempt(attempt._id);
      return sendError(res, 'Exam time has expired and your attempt has been submitted automatically.', 400, {
        code: 'EXAM_TIME_EXPIRED',
      });
    }

    const existingIndex = attempt.responses.findIndex(r => r.questionId.toString() === questionId);
    if (existingIndex > -1) {
      if (selectedOptionIndex !== undefined) attempt.responses[existingIndex].selectedOptionIndex = selectedOptionIndex;
      if (isMarkedForReview !== undefined) attempt.responses[existingIndex].isMarkedForReview = isMarkedForReview;
      attempt.responses[existingIndex].savedAt = new Date();
    } else {
      attempt.responses.push({
        questionId,
        selectedOptionIndex: selectedOptionIndex !== undefined ? selectedOptionIndex : null,
        isMarkedForReview: !!isMarkedForReview,
        savedAt: new Date(),
      });
    }

    await attempt.save();
    return sendSuccess(res, 'Response saved', { responsesCount: attempt.responses.length });
  } catch (error) {
    next(error);
  }
};

// Submit and calculate final exam score
const submitExam = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { timeSpentSeconds } = req.body;
    const studentId = req.user._id;

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      studentId,
      status: 'IN_PROGRESS',
    });

    if (!attempt) {
      return sendError(res, 'Active exam attempt not found or already submitted', 400);
    }

    const result = await finalizeAttempt(attempt._id, timeSpentSeconds);
    return sendSuccess(res, 'Exam submitted successfully', result);
  } catch (error) {
    next(error);
  }
};

// Helper to calculate score and finalize attempt
const finalizeAttempt = async (attemptId, clientTimeSpent = null) => {
  const attempt = await ExamAttempt.findById(attemptId).populate('mockTestId');
  if (!attempt) return null;

  const mockTest = attempt.mockTestId;
  const questions = await Question.find({ mockTestId: mockTest._id });
  const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const subjectStats = {};

  // Build evaluated responses
  const evaluatedResponses = [];

  for (const question of questions) {
    const qIdStr = question._id.toString();
    const studentResp = attempt.responses.find(r => r.questionId.toString() === qIdStr);
    const selectedIdx = studentResp ? studentResp.selectedOptionIndex : null;
    const correctIdx = question.options.findIndex(opt => opt.isCorrect === true);

    const subject = question.subject || 'General';
    if (!subjectStats[subject]) {
      subjectStats[subject] = { subject, total: 0, correct: 0, incorrect: 0, unanswered: 0, score: 0 };
    }
    subjectStats[subject].total += 1;

    let isCorrect = null;
    let marksAwarded = 0;

    if (selectedIdx === null || selectedIdx === undefined) {
      unansweredCount += 1;
      subjectStats[subject].unanswered += 1;
    } else if (selectedIdx === correctIdx) {
      isCorrect = true;
      correctCount += 1;
      marksAwarded = question.marks || 1;
      score += marksAwarded;
      subjectStats[subject].correct += 1;
      subjectStats[subject].score += marksAwarded;
    } else {
      isCorrect = false;
      incorrectCount += 1;
      if (mockTest.negativeMarkingEnabled !== false) {
        const penalty = question.negativeMarks !== undefined ? question.negativeMarks : 0.25;
        marksAwarded = -penalty;
        score -= penalty;
        subjectStats[subject].score -= penalty;
      }
      subjectStats[subject].incorrect += 1;
    }

    evaluatedResponses.push({
      questionId: question._id,
      selectedOptionIndex: selectedIdx,
      isMarkedForReview: studentResp ? studentResp.isMarkedForReview : false,
      isCorrect,
      marksAwarded,
      savedAt: studentResp ? studentResp.savedAt : new Date(),
    });
  }

  const attemptedCount = correctCount + incorrectCount;
  const accuracyPercentage = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const finalScore = Math.max(0, Math.round(score * 100) / 100);
  const isPassed = finalScore >= (mockTest.passMarks || 40);

  const totalTimeSeconds = clientTimeSpent || Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

  attempt.status = 'SUBMITTED';
  attempt.submittedAt = new Date();
  attempt.timeSpentSeconds = totalTimeSeconds;
  attempt.responses = evaluatedResponses;
  attempt.score = finalScore;
  attempt.totalMarks = mockTest.totalMarks;
  attempt.correctCount = correctCount;
  attempt.incorrectCount = incorrectCount;
  attempt.unansweredCount = unansweredCount;
  attempt.accuracyPercentage = accuracyPercentage;
  attempt.isPassed = isPassed;
  attempt.subjectAnalysis = Object.values(subjectStats);

  await attempt.save();
  return attempt;
};

// Get result details and solutions
const getAttemptResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user._id;

    const attempt = await ExamAttempt.findById(attemptId)
      .populate('mockTestId', 'title slug totalMarks passMarks durationMinutes showSolutionImmediately examMode resultPublishAt leaderboardEnabled');

    if (!attempt) {
      return sendError(res, 'Exam attempt not found', 404);
    }

    // Verify ownership or staff role
    if (attempt.studentId.toString() !== studentId.toString() && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return sendError(res, 'Unauthorized access to this result', 403);
    }

    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'FACULTY'].includes(req.user.role);
    if (
      !isStaff &&
      attempt.mockTestId?.examMode === 'EXAM' &&
      attempt.mockTestId?.resultPublishAt &&
      new Date() < new Date(attempt.mockTestId.resultPublishAt)
    ) {
      return sendSuccess(res, 'Exam submitted. Results will be published at the scheduled time.', {
        resultPending: true,
        resultPublishAt: attempt.mockTestId.resultPublishAt,
        attempt: {
          _id: attempt._id,
          mockTest: attempt.mockTestId,
          timeSpentSeconds: attempt.timeSpentSeconds,
          submittedAt: attempt.submittedAt,
        },
        questions: [],
      });
    }

    // Fetch questions with explanations
    const questions = await Question.find({ mockTestId: attempt.mockTestId._id });
    const questionDetails = questions.map(q => {
      const resp = attempt.responses.find(r => r.questionId.toString() === q._id.toString());
      return {
        _id: q._id,
        questionText: q.questionText,
        questionImage: q.questionImage,
        options: q.options,
        correctOptionIndex: q.options.findIndex(opt => opt.isCorrect === true),
        userSelectedOptionIndex: resp ? resp.selectedOptionIndex : null,
        isCorrect: resp ? resp.isCorrect : null,
        marksAwarded: resp ? resp.marksAwarded : 0,
        explanation: q.explanation,
        subject: q.subject,
        topic: q.topic,
      };
    });

    return sendSuccess(res, 'Exam result retrieved', {
      attempt: {
        _id: attempt._id,
        mockTest: attempt.mockTestId,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unansweredCount: attempt.unansweredCount,
        accuracyPercentage: attempt.accuracyPercentage,
        isPassed: attempt.isPassed,
        timeSpentSeconds: attempt.timeSpentSeconds,
        subjectAnalysis: attempt.subjectAnalysis,
        submittedAt: attempt.submittedAt,
      },
      questions: questionDetails,
    });
  } catch (error) {
    next(error);
  }
};

// Get student's all past attempts
const getStudentAttempts = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const attempts = await ExamAttempt.find({ studentId, status: 'SUBMITTED' })
      .populate('mockTestId', 'title slug division totalMarks passMarks examMode resultPublishAt leaderboardEnabled')
      .sort({ submittedAt: -1 });

    return sendSuccess(res, 'Student attempts retrieved', attempts);
  } catch (error) {
    next(error);
  }
};

// Get test leaderboard (top scores for a mock test)
const getTestLeaderboard = async (req, res, next) => {
  try {
    const { mockTestId } = req.params;
    const mockTest = await MockTest.findById(mockTestId)
      .select('title totalMarks leaderboardEnabled examMode resultPublishAt')
      .lean();

    if (!mockTest) {
      return sendError(res, 'Mock test not found', 404);
    }

    if (mockTest.leaderboardEnabled === false) {
      return sendSuccess(res, 'Leaderboard is disabled for this test', {
        enabled: false,
        entries: [],
      });
    }

    if (
      mockTest.examMode === 'EXAM' &&
      mockTest.resultPublishAt &&
      new Date() < new Date(mockTest.resultPublishAt)
    ) {
      return sendSuccess(res, 'Leaderboard will be available once results are published', {
        enabled: false,
        resultPending: true,
        resultPublishAt: mockTest.resultPublishAt,
        entries: [],
      });
    }

    const attempts = await ExamAttempt.find({ mockTestId, status: 'SUBMITTED' })
      .populate('studentId', 'name studentId')
      .sort({ score: -1, timeSpentSeconds: 1, submittedAt: 1 })
      .limit(100)
      .lean();

    const seenStudents = new Set();
    const entries = [];
    for (const att of attempts) {
      const sid = att.studentId?._id?.toString();
      if (!sid || seenStudents.has(sid)) continue;
      seenStudents.add(sid);
      entries.push({
        rank: entries.length + 1,
        studentName: att.studentId?.name || 'Student',
        studentCode: att.studentId?.studentId || '',
        score: att.score,
        totalMarks: att.totalMarks,
        accuracyPercentage: att.accuracyPercentage,
        timeSpentSeconds: att.timeSpentSeconds,
        isCurrentUser: sid === req.user._id.toString(),
      });
      if (entries.length >= 20) break;
    }

    return sendSuccess(res, 'Leaderboard retrieved', {
      enabled: true,
      mockTestTitle: mockTest.title,
      totalMarks: mockTest.totalMarks,
      entries,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startExam,
  saveResponse,
  submitExam,
  getAttemptResult,
  getStudentAttempts,
  getTestLeaderboard,
};
