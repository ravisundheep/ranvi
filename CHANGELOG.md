# Changelog — Ranvi Institutions

## [Task 1] - 2026-11-10 — Emergency Security & Critical Bug Stabilization

### Security
- Removed payment signature mock/prefix bypasses (`dev_mock_signature_verified`, `order_dev_`, `order_test_`) from server payment/enrollment verification and frontend checkout/enrollment pages.
- Added `isRazorpayConfigured()` check and timing-safe HMAC comparisons (`crypto.timingSafeEqual`) in `server/src/config/razorpay.js`.
- Added strict `order.razorpayOrderId` binding checks and duplicate `razorpayPaymentId` conflict rejection (`409`) in `paymentController.js` and `enrollmentController.js`.
- Added `paymentLimiter` (30 req / 15 min) on payment and enrollment checkout/verify routes.
- Removed hardcoded student/admin quick-fill credentials from `client/src/pages/public/LoginPage.jsx`.
- Enforced authenticated socket identity ownership in `socketService.js` (`register_student`) and fixed 2-argument `emitEnrollmentChange(studentId, ...)` calls.
- Revoked active `DeviceSession` records (`revokedBy: 'ADMIN_SUSPEND'`) and emitted socket revocation when suspending students via `toggleStudentStatus`.
- Replaced open static `/uploads` file serving with public `/uploads/images` plus authenticated/entitled/token-scoped `/uploads/videos/:filename` and `/uploads/papers/:filename` handlers via `protectedMedia.js`.
- Prevented authenticated users from hitting anonymous `courseListCache` in `courseController.js` and cleared client-side caches on login, registration, logout, revocation, payment verify, and manual access grant.

### Fixed
- Added missing `User` model import in `paymentController.js` and reworked `handleWebhook` (`payment.captured`, `order.paid`, `payment.failed`) to create `Payment` records, upsert `Entitlement`/`Enrollment`, update course seat counts idempotently without going negative, and sync manual admin course grants with `Enrollment`.
- Fixed `$or` overwrite bug in `notificationController.getPublicNotifications` so `search` filters preserve `expiresAt` active-notice rules using `$and`.
- Expanded `MockTest.division` enum to include `ENTRANCE_EXAMS` and `TUITIONS`, added standalone `MOCK_TEST_PACKAGE` unlock support in `mockTestController` and `examAttemptController`, and wired real `isUnlocked` flags in `MyMockTestsPage` and `MockTestsPage`.
- Added sanitized public live class schedule endpoint `GET /api/v1/live-classes/public-schedule` (omitting `zoomMeetingUrl` and `zoomPasscode`) for `OnlineClassesPage`.
- Fixed broken frontend service calls and schema mismatches in `AdminTuitionProgramsPage`, `AdminNotificationsPage`, `AdminLatestUpdatesPage`, `AdminEnrollmentsPage`, and `TuitionEnrollmentPage`.
- Updated `AdminPaymentsPage` (`PENDING` status filter, `MOCK_TEST_PACKAGE` manual grant option), `AdminStudentsPage` (pagination), `AdminCoursesPage`/`AdminCourseFormPage` (`TUITIONS` division), and division/status labels in student pages.
- Fixed `ExamTakePage` countdown interval recreation bug, rendered `questionImage` in take/result views, removed live-exam `paperPdfUrl` link, and corrected zero negative-mark display in `ExamCard` & `ExamTakePage`.
- Replaced hardcoded fallback lists in `latestUpdateService`, `publicNotificationService`, `AvailableProgramsPage`, `NotificationsPage`, and `OnlineClassesPage`.
- Replaced duplicated `<video>` tags and `BigBuckBunny.mp4` fallbacks with shared `LessonMediaPlayer.jsx` calling `getLessonPlayback`.
- Fixed `HeroBannerSlider.jsx` state-updater purity, CSS `block`/`flex` conflict, and fallback wrap recovery.
- Removed unused duplicate images (`banner-bankers-path.png`, `banner-entrance-exams.png`) and empty `client/src/pages/faculty` folder.
