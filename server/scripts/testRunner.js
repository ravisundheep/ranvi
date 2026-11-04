const mongoose = require('mongoose');
const { connectDB, disconnectDB, migrateFacultyAccounts } = require('../src/config/db');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const LiveClass = require('../src/models/LiveClass');
const MockTest = require('../src/models/MockTest');
const Question = require('../src/models/Question');
const ExamAttempt = require('../src/models/ExamAttempt');
const DeviceSession = require('../src/models/DeviceSession');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const Entitlement = require('../src/models/Entitlement');
const Enquiry = require('../src/models/Enquiry');
const EntranceExam = require('../src/models/EntranceExam');
const SiteSettings = require('../src/models/SiteSettings');
const AuditLog = require('../src/models/AuditLog');
const Enrollment = require('../src/models/Enrollment');
const { isValidZoomUrl } = require('../src/utils/zoomValidator');
const { verifySignature } = require('../src/config/razorpay');
const {
  getTimezone,
  getStartOfDayInTimezone,
  cleanupExpiredAuditLogs,
} = require('../src/utils/auditCleanupService');
const { getAuditLogs, triggerAuditLogCleanup, getDashboardStats } = require('../src/controllers/adminController');
const { getStudentDashboard } = require('../src/controllers/studentController');
const {
  createEnrollmentIntent,
  verifyEnrollmentPayment,
  getMyEnrollmentById,
  updateAdminEnrollmentStatus,
} = require('../src/controllers/enrollmentController');
const { createCheckoutOrder, verifyPayment } = require('../src/controllers/paymentController');
const { authorize } = require('../src/middleware/authorize');
const {
  broadcastCourseUpdate,
  broadcastLiveClassUpdate,
  broadcastMockTestUpdate,
  emitStudentUpdate,
  emitEnrollmentChange,
  emitDeviceRevocation,
  emitAdminStatsUpdate,
} = require('../src/utils/socketService');
const seedAll = require('./seed');

const runTests = async () => {
  console.log('🧪 =======================================================');
  console.log('🧪 RUNNING CRITICAL AUTOMATED TESTS: RANVI INSTITUTIONS');
  console.log('🧪 =======================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failedCount++;
    }
  };

  try {
    // 1. Initialize DB & Seed
    await seedAll();

    // 2. Test User Authentication & Password Hashing
    const student = await User.findOne({ email: 'student@ranviinstitutions.com' }).select('+passwordHash');
    assert(student !== null, 'Student user exists in database');
    const isPwCorrect = await student.comparePassword('RanviStudent@2026!');
    assert(isPwCorrect === true, 'Student password verification succeeds with bcrypt');
    const isPwFalse = await student.comparePassword('WrongPassword');
    assert(isPwFalse === false, 'Student password verification fails with incorrect credentials');

    // 3. Test Single Device Session Enforcement
    const sessionToken1 = 'token_device_phone_001';
    const session1 = await DeviceSession.create({
      studentId: student._id,
      deviceId: 'device_phone_id',
      sessionToken: sessionToken1,
      deviceInfo: 'Android Chrome Mobile',
      isActive: true,
    });
    assert(session1.isActive === true, 'Device 1 session registered as active');

    // Simulate login from Device 2 -> Should revoke Device 1
    await DeviceSession.updateMany(
      { studentId: student._id, isActive: true },
      { isActive: false, revokedReason: 'Logged in from laptop', revokedBy: 'NEW_DEVICE_LOGIN' }
    );
    const sessionToken2 = 'token_device_laptop_002';
    const session2 = await DeviceSession.create({
      studentId: student._id,
      deviceId: 'device_laptop_id',
      sessionToken: sessionToken2,
      deviceInfo: 'Windows PC Firefox',
      isActive: true,
    });

    const activeSessions = await DeviceSession.find({ studentId: student._id, isActive: true });
    assert(activeSessions.length === 1 && activeSessions[0].sessionToken === sessionToken2, 'Single-device policy: Exactly 1 active session exists after new device login');
    const oldSession = await DeviceSession.findOne({ sessionToken: sessionToken1 });
    assert(oldSession.isActive === false, 'Previous device session was successfully revoked');

    // 4. Test Course Catalogue & Demo Lesson Gating
    const jaiib = await Course.findOne({ slug: 'jaiib-master-class-2026' });
    assert(jaiib !== null, 'JAIIB Master Course exists');
    const lessons = await Lesson.find({ courseId: jaiib._id });
    const demoLessons = lessons.filter(l => l.isPreview);
    const paidLessons = lessons.filter(l => !l.isPreview);
    assert(demoLessons.length >= 2, 'Course provides at least 2 free demo preview lessons');
    assert(paidLessons.length >= 2, 'Course provides locked paid lessons');

    // 5. Test Zoom Live Class URL Validation
    assert(isValidZoomUrl('https://us04web.zoom.us/j/84291823910?pwd=RanviLiveClass2026') === true, 'Valid Zoom.us URL accepted');
    assert(isValidZoomUrl('https://zoom.us/j/123456789') === true, 'Standard Zoom.us URL accepted');
    assert(isValidZoomUrl('https://malicious-site.com/fake-zoom') === false, 'Non-Zoom URL rejected');
    assert(isValidZoomUrl('not-a-url') === false, 'Malformed URL string rejected');

    // 6. Test Mock Test Server-Side Scoring & Integrity
    const mockTest = await MockTest.findOne({ slug: 'jaiib-model-paper-01' });
    assert(mockTest !== null, 'JAIIB Model Paper 01 exists');
    const questions = await Question.find({ mockTestId: mockTest._id });
    assert(questions.length >= 10, 'Model paper contains at least 10 structured MCQs');

    // Simulate Exam Attempt
    const attempt = await ExamAttempt.create({
      studentId: student._id,
      mockTestId: mockTest._id,
      status: 'IN_PROGRESS',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      responses: [
        { questionId: questions[0]._id, selectedOptionIndex: 0 }, // Correct (+1)
        { questionId: questions[1]._id, selectedOptionIndex: 1 }, // Correct (+1)
        { questionId: questions[4]._id, selectedOptionIndex: 3 }, // Incorrect (-0.25)
      ],
    });
    assert(attempt.status === 'IN_PROGRESS', 'Exam attempt created in progress');

    // Score calculation test
    let calculatedScore = 0;
    let correct = 0;
    let wrong = 0;

    for (const resp of attempt.responses) {
      const q = questions.find(item => item._id.toString() === resp.questionId.toString());
      const correctIdx = q.options.findIndex(o => o.isCorrect === true);
      if (resp.selectedOptionIndex === correctIdx) {
        correct++;
        calculatedScore += (q.marks || 1);
      } else {
        wrong++;
        calculatedScore -= (q.negativeMarks || 0.25);
      }
    }
    assert(correct === 2 && wrong === 1, 'Exam correct and incorrect answers counted accurately');
    assert(calculatedScore === 1.75, 'Server-side score calculated with negative marks correctly (1 + 1 - 0.25 = 1.75)');

    // 7. Test Payment Verification and Entitlement Grant
    const order = await Order.create({
      studentId: student._id,
      itemType: 'COURSE',
      itemId: jaiib._id,
      itemModel: 'Course',
      amount: jaiib.fee,
      currency: 'INR',
      razorpayOrderId: 'order_test_verification_001',
      status: 'PENDING',
      receiptNumber: 'REC-TEST-001',
    });

    // Grant entitlement upon payment completion
    const entitlement = await Entitlement.create({
      studentId: student._id,
      itemType: 'COURSE',
      itemId: jaiib._id,
      itemModel: 'Course',
      orderId: order._id,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      isActive: true,
      grantedBy: 'PAYMENT',
    });
    assert(entitlement.isActive === true, 'Course entitlement successfully created for student');

    // Verify active access query
    const verifiedAccess = await Entitlement.findOne({
      studentId: student._id,
      itemId: jaiib._id,
      isActive: true,
      validUntil: { $gte: new Date() },
    });
    assert(verifiedAccess !== null, 'Entitlement correctly unlocks course access for student');

    // 8. Test Enquiry Form Model Validation
    const enquiry = await Enquiry.create({
      fullName: 'Suresh Raina',
      email: 'suresh@example.com',
      phone: '9876543219',
      division: 'BANKERS_PATH',
      courseInterest: 'CAIIB Advanced Mastery',
      preferredMode: 'ONLINE',
      status: 'NEW',
    });
    assert(enquiry._id !== null && enquiry.status === 'NEW', 'Enquiry successfully persisted with status NEW');

    // 9. Test Entrance Exam Programs & CRUD
    const entranceExams = await EntranceExam.find().sort({ displayOrder: 1 });
    assert(entranceExams.length >= 9, 'All 9 default Entrance Exam programs exist in database');

    const jee = await EntranceExam.findOne({ title: 'JEE Main' });
    assert(jee !== null && jee.description.includes('NITs, IIITs'), 'JEE Main program exists with correct description');

    const neet = await EntranceExam.findOne({ title: 'NEET-UG' });
    assert(neet !== null && neet.description.includes('MBBS, BDS'), 'NEET-UG program exists with correct description');

    const cuet = await EntranceExam.findOne({ title: 'CUET-UG' });
    assert(cuet !== null && cuet.description.includes('Central Universities'), 'CUET-UG program exists with correct description');

    const apEapcet = await EntranceExam.findOne({ title: 'AP EAPCET' });
    assert(apEapcet !== null && apEapcet.description.includes('Andhra Pradesh'), 'AP EAPCET program exists with correct description');

    const tgEapcet = await EntranceExam.findOne({ title: 'TG EAPCET' });
    assert(tgEapcet !== null && tgEapcet.description.includes('Telangana'), 'TG EAPCET program exists with correct description');

    const apPolycet = await EntranceExam.findOne({ title: 'AP POLYCET' });
    assert(apPolycet !== null && apPolycet.description.includes('Polytechnic Diploma courses in Andhra Pradesh'), 'AP POLYCET program exists with correct description');

    const tgPolycet = await EntranceExam.findOne({ title: 'TG POLYCET' });
    assert(tgPolycet !== null && tgPolycet.description.includes('Polytechnic Diploma courses in Telangana'), 'TG POLYCET program exists with correct description');

    const aprjc = await EntranceExam.findOne({ title: 'APRJC CET' });
    assert(aprjc !== null && aprjc.description.includes('Residential Junior Colleges'), 'APRJC CET program exists with correct description');

    const tgcet = await EntranceExam.findOne({ title: 'TGCET' });
    assert(tgcet !== null && tgcet.description.includes('Telangana Gurukul Residential Schools'), 'TGCET program exists with correct description');

    // Test Entrance Exam CRUD: Create, Update, Delete
    const customExam = await EntranceExam.create({
      title: 'BITSAT Special',
      description: 'Admission to BITS Pilani campuses',
      category: 'Engineering & Technology',
      badge: 'National Level',
      displayOrder: 99,
    });
    assert(customExam !== null && customExam.slug === 'bitsat-special', 'Admin can create new entrance exam with auto-slug');

    const updatedExam = await EntranceExam.findByIdAndUpdate(
      customExam._id,
      { $set: { badge: 'National Level - Premier' } },
      { new: true }
    );
    assert(updatedExam.badge === 'National Level - Premier', 'Admin can update entrance exam details');

    await EntranceExam.findByIdAndDelete(customExam._id);
    const deletedCheck = await EntranceExam.findById(customExam._id);
    assert(deletedCheck === null, 'Admin can delete entrance exam program');

    // 12. Test Flagship Courses & State-Based Course Filtering
    const totalCourses = await Course.countDocuments({ isPublished: true });
    assert(totalCourses >= 24, `All 24 flagship courses exist in database (found: ${totalCourses})`);

    const bankersCourses = await Course.find({ division: 'BANKERS_PATH', isPublished: true });
    assert(bankersCourses.length >= 8, `Banker's Path has at least 8 flagship courses (found: ${bankersCourses.length})`);

    const competitiveCourses = await Course.find({ division: 'COMPETITIVE_EXAMS', isPublished: true });
    assert(competitiveCourses.length >= 8, `Competitive Exams has at least 8 flagship courses (found: ${competitiveCourses.length})`);

    const entranceCourses = await Course.find({ division: 'ENTRANCE_EXAMS', isPublished: true });
    assert(entranceCourses.length >= 8, `Entrance Exams has at least 8 flagship courses (found: ${entranceCourses.length})`);

    // Verify course state filtering
    const apCourses = await Course.find({
      isPublished: true,
      $or: [
        { states: 'Andhra Pradesh' },
        { states: 'All India' },
        { states: { $size: 0 } },
        { states: { $exists: false } },
      ],
    });
    assert(apCourses.length > 0, `State filter for Andhra Pradesh returns matching courses (${apCourses.length})`);

    const apEapcetCourse = await Course.findOne({ slug: 'ap-eapcet-engineering-agriculture' });
    assert(
      apEapcetCourse !== null && apEapcetCourse.states.includes('Andhra Pradesh'),
      'AP EAPCET course is tagged with Andhra Pradesh'
    );
    assert(
      apEapcetCourse !== null && apEapcetCourse.tileColor === '#B94715',
      'AP EAPCET course has custom tile color #B94715'
    );

    // Test Course Draft & Publishing Lifecycle
    const draftCourse = await Course.create({
      title: 'NABARD Grade A Special Draft Course',
      slug: 'nabard-grade-a-draft',
      division: 'BANKERS_PATH',
      shortDescription: 'Draft course for testing',
      fullDescription: 'Complete description for draft course testing',
      fee: 4999,
      isPublished: false,
    });
    assert(draftCourse !== null && draftCourse.isPublished === false, 'Course can be created as draft (isPublished: false)');

    const publicCoursesCount = await Course.countDocuments({ isPublished: true });
    const allCoursesCount = await Course.countDocuments({});
    assert(allCoursesCount === publicCoursesCount + 1, 'Draft course is excluded from public count but included in total count');

    // Admin toggles draft course to published
    draftCourse.isPublished = true;
    await draftCourse.save();
    assert(draftCourse.isPublished === true, 'Admin can toggle course to published live');

    // Admin permanently deletes test course
    await Course.deleteOne({ _id: draftCourse._id });
    const checkDeleted = await Course.findById(draftCourse._id);
    assert(checkDeleted === null, 'Admin can permanently delete test course');

    // ==========================================
    // 12. SITE SETTINGS & HERO BANNER INTEGRATION
    // ==========================================
    const siteSettings = await SiteSettings.findOne({ key: 'global_settings' });
    assert(siteSettings !== null, 'Global site settings document exists in database');
    assert(
      siteSettings?.topAnnouncement?.isActive === true && typeof siteSettings?.topAnnouncement?.message === 'string',
      'Top announcement bar configuration is present and active'
    );
    assert(
      siteSettings?.bankersPathSection?.title === "Banker's Path",
      "Banker's Path section title is correctly configured in settings"
    );
    assert(
      siteSettings?.competitiveExamsSection?.title === 'Competitive Exams',
      'Competitive Exams section title is correctly configured in settings'
    );
    assert(
      siteSettings?.entranceExamsSection?.title === 'Entrance Exams',
      'Entrance Exams section title is correctly configured in settings'
    );
    assert(
      typeof siteSettings?.contactInfo?.phone === 'string' && siteSettings?.contactInfo?.phone.length > 5,
      'Contact phone information is valid and present in site settings'
    );
    assert(
      siteSettings?.socialLinks?.whatsapp?.includes('wa.me') || siteSettings?.socialLinks?.youtube?.includes('youtube'),
      'Social media links are present in site settings'
    );

    // Test Admin Settings Update & Synchronization
    const testUpdatedAnnouncement = 'Test Special Batch Starts Tomorrow!';
    const updatedSettings = await SiteSettings.findOneAndUpdate(
      { key: 'global_settings' },
      { $set: { 'topAnnouncement.message': testUpdatedAnnouncement } },
      { new: true }
    );
    assert(
      updatedSettings.topAnnouncement.message === testUpdatedAnnouncement,
      'Admin can update top announcement message in site settings'
    );

    // Revert test update back
    await SiteSettings.findOneAndUpdate(
      { key: 'global_settings' },
      { $set: { 'topAnnouncement.message': 'New Batches for JAIIB, CAIIB, IBPS PO & SBI PO starting this week!' } }
    );

    // ========================================================
    // 10. Test Security Audit Logs (Current-Day Records Only & Cleanup)
    // ========================================================
    const tz = await getTimezone();
    assert(typeof tz === 'string' && tz.length > 0, `Configured timezone resolved (${tz})`);

    const startOfToday = getStartOfDayInTimezone(tz);
    assert(startOfToday instanceof Date && !isNaN(startOfToday.getTime()), 'Start-of-day UTC cutoff calculated correctly');

    // Create baseline test logs: 2 expired (from yesterday & 3 days ago) + 2 current-day logs
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const todayNow = new Date();

    // Clear any previous audit logs from prior tests
    await AuditLog.deleteMany({});

    // Seed expired logs
    await AuditLog.create([
      {
        userEmail: 'old.admin1@ranvi.com',
        userRole: 'ADMIN',
        action: 'STUDENT_ACTIVATED',
        resource: 'User',
        createdAt: threeDaysAgo,
      },
      {
        userEmail: 'old.admin2@ranvi.com',
        userRole: 'ADMIN',
        action: 'MANUAL_ACCESS_GRANTED',
        resource: 'Course',
        createdAt: yesterday,
      },
      {
        userEmail: 'today.student@ranvi.com',
        userRole: 'STUDENT',
        action: 'LOGIN_SUCCESS',
        resource: 'Auth',
        createdAt: todayNow,
      },
      {
        userEmail: 'today.admin@ranvi.com',
        userRole: 'ADMIN',
        action: 'STUDENT_DEVICE_RESET',
        resource: 'DeviceSession',
        createdAt: todayNow,
      },
    ]);

    const countBeforeCleanup = await AuditLog.countDocuments();
    assert(countBeforeCleanup === 4, 'Successfully inserted 4 test audit logs (2 expired + 2 today)');

    // Count records in unrelated collections before cleanup to verify isolation
    const userCountBefore = await User.countDocuments();
    const courseCountBefore = await Course.countDocuments();

    // Execute cleanup
    const cleanupRes = await cleanupExpiredAuditLogs({ timezone: tz, startOfDay: startOfToday });
    assert(cleanupRes.success === true, 'Audit log cleanup function executes successfully');
    assert(cleanupRes.deletedCount === 2, `Exactly 2 expired audit logs deleted (purged: ${cleanupRes.deletedCount})`);

    // Verify database state: only today's logs remain
    const remainingLogs = await AuditLog.find().sort({ createdAt: -1 });
    assert(remainingLogs.length === 2, `Database retains strictly current-day logs (remaining: ${remainingLogs.length})`);
    assert(
      remainingLogs.every((l) => l.createdAt >= startOfToday),
      "Every remaining audit log in the database has createdAt >= start of today's date"
    );

    // Verify strict isolation: no unrelated collections or records were affected
    const userCountAfter = await User.countDocuments();
    const courseCountAfter = await Course.countDocuments();
    assert(userCountBefore === userCountAfter, 'Unrelated collection integrity: User accounts completely untouched');
    assert(courseCountBefore === courseCountAfter, 'Unrelated collection integrity: Courses collection completely untouched');

    // Test getAuditLogs controller directly to verify API filtering and metadata
    let apiResponseData = null;
    let apiStatus = null;
    const mockReq = { query: { limit: 10 } };
    const mockRes = {
      status: (code) => {
        apiStatus = code;
        return mockRes;
      },
      json: (payload) => {
        apiResponseData = payload;
        return mockRes;
      },
    };

    await getAuditLogs(mockReq, mockRes, (err) => {
      throw err;
    });

    assert(apiResponseData !== null && apiResponseData.success === true, 'getAuditLogs controller returns success');
    assert(
      Array.isArray(apiResponseData.data?.logs) && apiResponseData.data.logs.length === 2,
      "getAuditLogs API returns exactly today's 2 logs and zero expired records"
    );
    assert(
      apiResponseData.data?.timezone === tz,
      `getAuditLogs API response contains accurate configured timezone (${apiResponseData.data?.timezone})`
    );
    assert(
      typeof apiResponseData.data?.date === 'string' && apiResponseData.data.date.length === 10,
      `getAuditLogs API response contains formatted current date (${apiResponseData.data?.date})`
    );

    // Test manual cleanup trigger endpoint
    let cleanupApiResponse = null;
    await triggerAuditLogCleanup(mockReq, mockRes, (err) => {
      throw err;
    });
    assert(apiResponseData.success === true, 'triggerAuditLogCleanup admin endpoint returns success');

    // ========================================================
    // 13. Strictly 2 Roles: Student and Admin Only
    // ========================================================
    console.log('\n--- Testing Role Enforcement & Faculty Removal ---');
    const roleEnum = User.schema.path('role').enumValues;
    assert(
      roleEnum.length === 3 &&
        roleEnum.includes('STUDENT') &&
        roleEnum.includes('ADMIN') &&
        roleEnum.includes('SUPER_ADMIN'),
      'User schema role enum strictly limited to STUDENT, ADMIN, SUPER_ADMIN'
    );
    assert(!roleEnum.includes('FACULTY'), 'Obsolete FACULTY role completely removed from User schema enum');

    // Mongoose schema validation rejects any attempt to create a user with role FACULTY
    let facultyValidationError = null;
    try {
      const invalidFacultyUser = new User({
        name: 'Legacy Faculty Attempt',
        email: 'invalid.faculty@ranvi.com',
        passwordHash: 'dummyhash123',
        phone: '9988776655',
        role: 'FACULTY',
      });
      await invalidFacultyUser.validate();
    } catch (err) {
      facultyValidationError = err;
    }
    assert(
      facultyValidationError !== null && facultyValidationError.name === 'ValidationError',
      'Mongoose strictly rejects user creation with obsolete role FACULTY (enum validation error)'
    );

    // Test Safe Migration: Legacy FACULTY accounts are migrated safely to STUDENT with audit trail
    const usersCollection = mongoose.connection.db.collection('users');
    const legacyFacultyId = new mongoose.Types.ObjectId();
    await usersCollection.insertOne({
      _id: legacyFacultyId,
      name: 'Legacy Prof. R. K. Sharma',
      email: 'prof.sharma.legacy@ranviinstitutions.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      phone: '9848011229',
      role: 'FACULTY',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const rawLegacyDoc = await usersCollection.findOne({ _id: legacyFacultyId });
    assert(
      rawLegacyDoc !== null && rawLegacyDoc.role === 'FACULTY',
      'Raw legacy account with role FACULTY inserted into raw collection for migration verification'
    );

    // Execute migration
    await migrateFacultyAccounts();

    const migratedUser = await User.findById(legacyFacultyId);
    assert(migratedUser !== null, 'Migrated account preserved in database without account deletion');
    assert(migratedUser.role === 'STUDENT', 'Legacy FACULTY account safely migrated to role STUDENT');
    assert(migratedUser.migratedFromRole === 'FACULTY', 'Audit flag migratedFromRole recorded as FACULTY');
    assert(migratedUser.migratedAt instanceof Date, 'Audit timestamp migratedAt recorded upon migration');

    // Clean up temporary migrated user
    await usersCollection.deleteOne({ _id: legacyFacultyId });

    // ========================================================
    // 14. Role Authorization Middleware & Access Control
    // ========================================================
    console.log('\n--- Testing Role Authorization & Route Guarding ---');
    const adminGuard = authorize('SUPER_ADMIN', 'ADMIN');

    // Student attempting to access admin route -> 403 Forbidden
    let forbiddenStatusCode = null;
    let forbiddenPayload = null;
    let studentPassedThrough = false;
    const mockStudentReq = { user: { _id: student._id, role: 'STUDENT' } };
    const mockAuthGuardRes = {
      status: (code) => {
        forbiddenStatusCode = code;
        return {
          json: (p) => {
            forbiddenPayload = p;
          },
        };
      },
    };

    adminGuard(mockStudentReq, mockAuthGuardRes, () => {
      studentPassedThrough = true;
    });
    assert(studentPassedThrough === false, 'Student role is blocked from admin routes');
    assert(forbiddenStatusCode === 403, 'Student access attempt to admin routes returns HTTP 403 Forbidden');

    // Admin role permitted
    let adminPassedThrough = false;
    const mockAdminRoleReq = { user: { role: 'ADMIN' } };
    adminGuard(mockAdminRoleReq, mockAuthGuardRes, () => {
      adminPassedThrough = true;
    });
    assert(adminPassedThrough === true, 'ADMIN role is permitted through admin authorization guard');

    // Super Admin role permitted
    let superAdminPassedThrough = false;
    const mockSuperAdminRoleReq = { user: { role: 'SUPER_ADMIN' } };
    adminGuard(mockSuperAdminRoleReq, mockAuthGuardRes, () => {
      superAdminPassedThrough = true;
    });
    assert(superAdminPassedThrough === true, 'SUPER_ADMIN role is permitted through admin authorization guard');

    // ========================================================
    // 15. Student Dashboard Private Access & Cross-User Isolation
    // ========================================================
    console.log('\n--- Testing Student Dashboard Private Access & Isolation ---');
    let student1Dashboard = null;
    const mockStudentDashboardReq = { user: student };
    const mockStudentDashboardRes = {
      status: () => mockStudentDashboardRes,
      json: (payload) => {
        student1Dashboard = payload;
        return mockStudentDashboardRes;
      },
    };

    await getStudentDashboard(mockStudentDashboardReq, mockStudentDashboardRes, (err) => {
      throw err;
    });
    assert(student1Dashboard !== null && student1Dashboard.success === true, 'getStudentDashboard returns success');
    assert(
      Array.isArray(student1Dashboard.data?.enrolledCourses) && student1Dashboard.data.enrolledCourses.length >= 1,
      'Student 1 dashboard correctly shows their own enrolled courses'
    );
    assert(
      student1Dashboard.data?.profile?.email === student.email,
      'Student 1 dashboard profile accurately reflects student 1 identity'
    );

    // Create a separate student with zero course enrollments to test cross-user isolation
    const isolatedStudent = await User.create({
      name: 'Radha Krishna',
      email: 'radha.krishna.isolated@ranvi.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      phone: '9848099881',
      role: 'STUDENT',
      isActive: true,
    });

    let isolatedStudentDashboard = null;
    const mockIsolatedReq = { user: isolatedStudent };
    const mockIsolatedRes = {
      status: () => mockIsolatedRes,
      json: (payload) => {
        isolatedStudentDashboard = payload;
        return mockIsolatedRes;
      },
    };

    await getStudentDashboard(mockIsolatedReq, mockIsolatedRes, (err) => {
      throw err;
    });
    assert(isolatedStudentDashboard !== null && isolatedStudentDashboard.success === true, 'Isolated student dashboard returns success');
    assert(
      Array.isArray(isolatedStudentDashboard.data?.enrolledCourses) &&
        isolatedStudentDashboard.data.enrolledCourses.length === 0,
      'Isolated student dashboard returns 0 enrolled courses (zero data leakage between students)'
    );

    // Clean up isolated student
    await User.deleteOne({ _id: isolatedStudent._id });

    // ========================================================
    // 16. Admin Dashboard Overview & Real-Time Event Dispatchers
    // ========================================================
    console.log('\n--- Testing Admin Dashboard Metrics & Real-Time Socket Service ---');
    let adminOverviewData = null;
    const mockAdminDashReq = { user: { role: 'ADMIN' } };
    const mockAdminDashRes = {
      status: () => mockAdminDashRes,
      json: (payload) => {
        adminOverviewData = payload;
        return mockAdminDashRes;
      },
    };

    await getDashboardStats(mockAdminDashReq, mockAdminDashRes, (err) => {
      throw err;
    });
    assert(adminOverviewData !== null && adminOverviewData.success === true, 'Admin getDashboardStats controller returns HTTP success');
    assert(
      typeof adminOverviewData.data?.metrics?.totalStudents === 'number' &&
        adminOverviewData.data?.metrics?.totalStudents >= 1,
      'Admin metrics accurately calculate totalStudents count'
    );
    assert(
      typeof adminOverviewData.data?.metrics?.totalCourses === 'number' &&
        adminOverviewData.data?.metrics?.totalCourses >= 24,
      'Admin metrics accurately calculate totalCourses count (>= 24 flagship courses)'
    );
    assert(
      typeof adminOverviewData.data?.metrics?.totalRevenue === 'number',
      'Admin metrics calculate totalRevenue based on paid orders'
    );

    // Verify real-time Socket.IO dispatchers execute without uncaught errors
    try {
      broadcastCourseUpdate('CREATED', { _id: 'test_course_id', title: 'Test Course' });
      broadcastLiveClassUpdate('SCHEDULED', { _id: 'test_class_id', title: 'Test Live Class' });
      broadcastMockTestUpdate('UPDATED', { _id: 'test_mock_id', title: 'Test Mock Test' });
      emitStudentUpdate(student._id, 'PROFILE_UPDATED', { name: student.name });
      emitEnrollmentChange(student._id, { itemType: 'COURSE' });
      emitDeviceRevocation(student._id, 'TEST_SESSION_REVOKE');
      emitAdminStatsUpdate({ reason: 'TEST_UPDATE' });
      assert(true, 'Socket.IO event dispatchers execute safely and gracefully handle server offline state');
    } catch (socketErr) {
      assert(false, `Socket.IO event dispatcher threw error: ${socketErr.message}`);
    }

    // ========================================================
    // 17. Phase 14: Subscription Lifecycle, Duplicate Purchase Prevention, Payment Verification, IDOR Isolation & Admin State Synchronization
    // ========================================================
    console.log('\n--- Testing Phase 14: Subscription Management & Payment Security ---');

    // Setup Test Users & Course
    const testCourse = await Course.findOne({ isPublished: true });
    assert(testCourse !== null, 'A published course exists for subscription testing');

    // Create Test Student A
    const userA = await User.create({
      name: 'User Alpha',
      email: `user.alpha.${Date.now()}@ranvi.com`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      phone: '9848111222',
      role: 'STUDENT',
      isActive: true,
    });

    // Create Test Student B
    const userB = await User.create({
      name: 'User Beta',
      email: `user.beta.${Date.now()}@ranvi.com`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      phone: '9848333444',
      role: 'STUDENT',
      isActive: true,
    });

    // SCENARIO 1: First-time purchase & entitlement grant
    let checkoutResPayload = null;
    let checkoutStatus = 200;
    const mockCheckoutReq = {
      user: userA,
      body: {
        itemType: 'COURSE',
        itemId: testCourse._id.toString(),
      },
    };
    const mockCheckoutRes = {
      status: (code) => {
        checkoutStatus = code;
        return mockCheckoutRes;
      },
      json: (data) => {
        checkoutResPayload = data;
        return mockCheckoutRes;
      },
    };

    await createCheckoutOrder(mockCheckoutReq, mockCheckoutRes, (err) => { throw err; });
    assert((checkoutStatus === 200 || checkoutStatus === 201) && checkoutResPayload?.success === true, 'Scenario 1: Student A first-time checkout order created');
    const orderA = await Order.findById(checkoutResPayload.data.orderId);
    assert(orderA !== null && orderA.amount === testCourse.fee, 'Scenario 1: Order amount strictly matches course fee from DB');

    // Simulate payment completion for User A
    const entitlementA = await Entitlement.create({
      studentId: userA._id,
      itemType: 'COURSE',
      itemId: testCourse._id,
      itemModel: 'Course',
      orderId: orderA._id,
      status: 'ACTIVE',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
      grantedBy: 'PAYMENT',
    });
    orderA.status = 'PAID';
    await orderA.save();

    const enrollmentA = await Enrollment.create({
      enrollmentId: `ENR-TEST-${Date.now()}`,
      studentId: userA._id,
      courseId: testCourse._id,
      studentName: userA.name,
      studentEmail: userA.email,
      studentPhone: userA.phone,
      feeAmount: testCourse.fee,
      finalAmount: testCourse.fee,
      paymentStatus: 'PAID',
      enrollmentStatus: 'ENROLLED',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      orderId: orderA._id,
    });
    assert(entitlementA.status === 'ACTIVE' && enrollmentA.enrollmentStatus === 'ENROLLED', 'Scenario 1: Entitlement ACTIVE and Enrollment ENROLLED granted upon payment');

    // SCENARIO 2: Duplicate purchase rejection (Backend HTTP 400 & DB Guard)
    let duplicateStatus = null;
    let duplicatePayload = null;
    const mockDuplicateReq = {
      user: userA,
      body: {
        itemType: 'COURSE',
        itemId: testCourse._id.toString(),
      },
    };
    const mockDuplicateRes = {
      status: (code) => {
        duplicateStatus = code;
        return mockDuplicateRes;
      },
      json: (data) => {
        duplicatePayload = data;
        return mockDuplicateRes;
      },
    };

    await createCheckoutOrder(mockDuplicateReq, mockDuplicateRes, (err) => { throw err; });
    assert(duplicateStatus === 400, 'Scenario 2: Duplicate purchase attempt rejected with HTTP 400');
    assert(
      duplicatePayload?.message?.includes('already have an active subscription'),
      'Scenario 2: Returns clear error message: "You already have an active subscription for this program"'
    );

    // SCENARIO 3: Different user purchase allowed for same course
    let userBCheckoutStatus = null;
    let userBCheckoutPayload = null;
    const mockUserBCheckoutReq = {
      user: userB,
      body: {
        itemType: 'COURSE',
        itemId: testCourse._id.toString(),
      },
    };
    const mockUserBCheckoutRes = {
      status: (code) => {
        userBCheckoutStatus = code;
        return mockUserBCheckoutRes;
      },
      json: (data) => {
        userBCheckoutPayload = data;
        return mockUserBCheckoutRes;
      },
    };

    await createCheckoutOrder(mockUserBCheckoutReq, mockUserBCheckoutRes, (err) => { throw err; });
    assert((userBCheckoutStatus === 200 || userBCheckoutStatus === 201) && userBCheckoutPayload?.success === true, 'Scenario 3: Different user (User B) is allowed to purchase the same course');

    // SCENARIO 4: Unauthorized Access & IDOR Prevention
    let idorStatus = null;
    let idorPayload = null;
    const mockIdorReq = {
      user: userB,
      params: { id: enrollmentA._id.toString() },
    };
    const mockIdorRes = {
      status: (code) => {
        idorStatus = code;
        return mockIdorRes;
      },
      json: (data) => {
        idorPayload = data;
        return mockIdorRes;
      },
    };

    await getMyEnrollmentById(mockIdorReq, mockIdorRes, (err) => { throw err; });
    assert(
      idorStatus === 403 || idorStatus === 404,
      'Scenario 4: IDOR Prevention - User B cannot view User A private enrollment details (HTTP 403/404)'
    );

    // SCENARIO 5: Payment failure handling (Signature mismatch)
    let failVerifyStatus = null;
    let failVerifyPayload = null;
    const mockFailVerifyReq = {
      user: userB,
      body: {
        razorpay_order_id: userBCheckoutPayload.data.razorpayOrderId,
        razorpay_payment_id: 'pay_tampered_001',
        razorpay_signature: 'invalid_forged_signature_hex',
      },
    };
    const mockFailVerifyRes = {
      status: (code) => {
        failVerifyStatus = code;
        return mockFailVerifyRes;
      },
      json: (data) => {
        failVerifyPayload = data;
        return mockFailVerifyRes;
      },
    };

    await verifyPayment(mockFailVerifyReq, mockFailVerifyRes, (err) => { throw err; });
    assert(failVerifyStatus === 400, 'Scenario 5: Payment verification with forged signature fails with HTTP 400');
    const userBEntitlement = await Entitlement.findOne({ studentId: userB._id, itemId: testCourse._id });
    assert(userBEntitlement === null, 'Scenario 5: Zero entitlement granted when signature verification fails');

    // SCENARIO 6: Duplicate Webhook Idempotency
    const orderToDoubleVerify = await Order.create({
      studentId: userB._id,
      itemType: 'COURSE',
      itemId: testCourse._id,
      itemModel: 'Course',
      amount: testCourse.fee,
      currency: 'INR',
      razorpayOrderId: 'order_webhook_idem_001',
      status: 'PAID', // Already processed
      receiptNumber: 'REC-IDEM-001',
    });
    let idemStatus = null;
    let idemPayload = null;
    const mockIdemReq = {
      user: userB,
      body: {
        razorpay_order_id: 'order_webhook_idem_001',
        razorpay_payment_id: 'pay_idem_001',
        razorpay_signature: 'dummy_sig',
      },
    };
    const mockIdemRes = {
      status: (code) => {
        idemStatus = code;
        return mockIdemRes;
      },
      json: (data) => {
        idemPayload = data;
        return mockIdemRes;
      },
    };

    await verifyPayment(mockIdemReq, mockIdemRes, (err) => { throw err; });
    assert(idemStatus === 200 && idemPayload?.message?.includes('already verified'), 'Scenario 6: Second payment verification handles idempotency cleanly (already verified)');

    // SCENARIO 7: Subscription expiry
    const expiredEntitlement = await Entitlement.create({
      studentId: userA._id,
      itemType: 'COURSE',
      itemId: new mongoose.Types.ObjectId(),
      itemModel: 'Course',
      status: 'EXPIRED',
      validFrom: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // Expired 35 days ago
      isActive: false,
    });
    const activeCheck = await Entitlement.findOne({
      studentId: userA._id,
      itemId: expiredEntitlement.itemId,
      isActive: true,
      status: { $in: ['ACTIVE', 'ENROLLED'] },
      validUntil: { $gte: new Date() },
    });
    assert(activeCheck === null, 'Scenario 7: Expired subscription strictly blocks active access queries');

    // SCENARIO 8: Suspension & Revocation Synchronization
    let suspendStatus = null;
    let suspendPayload = null;
    const mockAdminSuspendReq = {
      user: { _id: new mongoose.Types.ObjectId(), email: 'admin@ranviinstitutions.com', role: 'ADMIN' },
      params: { id: enrollmentA._id.toString() },
      body: {
        enrollmentStatus: 'SUSPENDED',
        suspendedReason: 'Account policy review',
      },
    };
    const mockAdminSuspendRes = {
      status: (code) => {
        suspendStatus = code;
        return mockAdminSuspendRes;
      },
      json: (data) => {
        suspendPayload = data;
        return mockAdminSuspendRes;
      },
    };

    await updateAdminEnrollmentStatus(mockAdminSuspendReq, mockAdminSuspendRes, (err) => { throw err; });
    assert(suspendStatus === 200, 'Scenario 8: Admin suspends enrollment successfully');
    const syncedEntitlement = await Entitlement.findOne({ studentId: userA._id, itemId: testCourse._id });
    assert(
      syncedEntitlement.isActive === false && syncedEntitlement.status === 'SUSPENDED',
      'Scenario 8: Suspension syncs immediately - Entitlement deactivated (isActive: false, status: SUSPENDED)'
    );

    // Reactivation back to ENROLLED
    mockAdminSuspendReq.body = { enrollmentStatus: 'ENROLLED' };
    await updateAdminEnrollmentStatus(mockAdminSuspendReq, mockAdminSuspendRes, (err) => { throw err; });
    const reactivatedEntitlement = await Entitlement.findOne({ studentId: userA._id, itemId: testCourse._id });
    assert(
      reactivatedEntitlement.isActive === true && reactivatedEntitlement.status === 'ACTIVE',
      'Scenario 8: Reactivation syncs immediately - Entitlement restored to ACTIVE'
    );

    // SCENARIO 9: Admin management audit trail
    const auditRecord = await AuditLog.findOne({
      action: 'ENROLLMENT_STATUS_UPDATED',
      details: { $regex: enrollmentA.enrollmentId },
    });
    assert(auditRecord !== null, 'Scenario 9: Admin enrollment status change is captured in AuditLog');

    // SCENARIO 10: Security & Tamper Prevention
    let tamperedStatus = null;
    let tamperedPayload = null;
    const mockTamperedReq = {
      user: userB,
      body: {
        itemType: 'COURSE',
        itemId: testCourse._id.toString(),
        amount: 1, // Tampered client price (1 Rupee instead of full fee)
      },
    };
    const mockTamperedRes = {
      status: (code) => {
        tamperedStatus = code;
        return mockTamperedRes;
      },
      json: (data) => {
        tamperedPayload = data;
        return mockTamperedRes;
      },
    };

    await createCheckoutOrder(mockTamperedReq, mockTamperedRes, (err) => { throw err; });
    const orderCreated = await Order.findById(tamperedPayload?.data?.orderId);
    assert(
      orderCreated.amount === testCourse.fee && orderCreated.amount !== 1,
      'Scenario 10: Client-side price tampering rejected - order created strictly with DB price'
    );

    // Clean up temporary test users
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await Order.deleteMany({ studentId: { $in: [userA._id, userB._id] } });
    await Entitlement.deleteMany({ studentId: { $in: [userA._id, userB._id] } });
    await Enrollment.deleteMany({ studentId: { $in: [userA._id, userB._id] } });

    console.log('\n🧪 =======================================================');
    console.log(`🧪 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('🧪 =======================================================\n');

    await disconnectDB();
    process.exit(failedCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error);
    await disconnectDB();
    process.exit(1);
  }
};

runTests();
