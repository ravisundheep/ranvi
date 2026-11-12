import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ScrollManager } from './components/common/ScrollManager';

// Home Page directly imported for instant First Contentful Paint
import { HomePage } from './pages/public/HomePage';

// Lazy-loaded Public Pages
const BankersPathPage = lazy(() => import('./pages/public/BankersPathPage').then((m) => ({ default: m.BankersPathPage })));
const CompetitiveExamsPage = lazy(() => import('./pages/public/CompetitiveExamsPage').then((m) => ({ default: m.CompetitiveExamsPage })));
const CourseDetailsPage = lazy(() => import('./pages/public/CourseDetailsPage').then((m) => ({ default: m.CourseDetailsPage })));
const OnlineClassesPage = lazy(() => import('./pages/public/OnlineClassesPage').then((m) => ({ default: m.OnlineClassesPage })));
const RecordedClassesPage = lazy(() => import('./pages/public/RecordedClassesPage').then((m) => ({ default: m.RecordedClassesPage })));
const MockTestsPage = lazy(() => import('./pages/public/MockTestsPage').then((m) => ({ default: m.MockTestsPage })));
const FacultyPage = lazy(() => import('./pages/public/FacultyPage').then((m) => ({ default: m.FacultyPage })));
const EntranceExamsPage = lazy(() => import('./pages/public/EntranceExamsPage').then((m) => ({ default: m.EntranceExamsPage })));
const AboutPage = lazy(() => import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/public/ContactPage').then((m) => ({ default: m.ContactPage })));
const EnquiryDemoPage = lazy(() => import('./pages/public/EnquiryDemoPage').then((m) => ({ default: m.EnquiryDemoPage })));
const LoginPage = lazy(() => import('./pages/public/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const CheckoutPage = lazy(() => import('./pages/public/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const NotificationsPage = lazy(() => import('./pages/public/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const TuitionProgramsPage = lazy(() => import('./pages/public/TuitionProgramsPage').then((m) => ({ default: m.TuitionProgramsPage })));
const TuitionProgramDetailsPage = lazy(() => import('./pages/public/TuitionProgramDetailsPage').then((m) => ({ default: m.TuitionProgramDetailsPage })));
const TuitionEnrollmentPage = lazy(() => import('./pages/public/TuitionEnrollmentPage').then((m) => ({ default: m.TuitionEnrollmentPage })));

const PrivacyPolicyPage = lazy(() => import('./pages/public/PolicyPages').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/public/PolicyPages').then((m) => ({ default: m.TermsPage })));
const RefundPolicyPage = lazy(() => import('./pages/public/PolicyPages').then((m) => ({ default: m.RefundPolicyPage })));
const FAQPage = lazy(() => import('./pages/public/PolicyPages').then((m) => ({ default: m.FAQPage })));
const NotFoundPage = lazy(() => import('./pages/public/PolicyPages').then((m) => ({ default: m.NotFoundPage })));

// Lazy-loaded Student Portal Pages
const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage })));
const MyCoursesPage = lazy(() => import('./pages/student/MyCoursesPage').then((m) => ({ default: m.MyCoursesPage })));
const CoursePlayerPage = lazy(() => import('./pages/student/CoursePlayerPage').then((m) => ({ default: m.CoursePlayerPage })));
const LiveClassesSchedulePage = lazy(() => import('./pages/student/LiveClassesSchedulePage').then((m) => ({ default: m.LiveClassesSchedulePage })));
const MyMockTestsPage = lazy(() => import('./pages/student/MyMockTestsPage').then((m) => ({ default: m.MyMockTestsPage })));
const ExamTakePage = lazy(() => import('./pages/student/ExamTakePage').then((m) => ({ default: m.ExamTakePage })));
const ExamResultPage = lazy(() => import('./pages/student/ExamResultPage').then((m) => ({ default: m.ExamResultPage })));
const StudentPaymentsPage = lazy(() => import('./pages/student/StudentPaymentsPage').then((m) => ({ default: m.StudentPaymentsPage })));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })));
const AvailableProgramsPage = lazy(() => import('./pages/student/AvailableProgramsPage').then((m) => ({ default: m.AvailableProgramsPage })));
const MyEnrollmentsPage = lazy(() => import('./pages/student/MyEnrollmentsPage').then((m) => ({ default: m.MyEnrollmentsPage })));
const MyProgramsPage = lazy(() => import('./pages/student/MyProgramsPage').then((m) => ({ default: m.MyProgramsPage })));
const StudentWalletPage = lazy(() => import('./pages/student/StudentWalletPage').then((m) => ({ default: m.StudentWalletPage })));

// Lazy-loaded Admin Management Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage').then((m) => ({ default: m.AdminCoursesPage })));
const AdminCourseFormPage = lazy(() => import('./pages/admin/AdminCourseFormPage').then((m) => ({ default: m.AdminCourseFormPage })));
const AdminEntranceExamsPage = lazy(() => import('./pages/admin/AdminEntranceExamsPage').then((m) => ({ default: m.AdminEntranceExamsPage })));
const AdminFacultyPage = lazy(() => import('./pages/admin/AdminFacultyPage').then((m) => ({ default: m.AdminFacultyPage })));
const AdminLessonsPage = lazy(() => import('./pages/admin/AdminLessonsPage').then((m) => ({ default: m.AdminLessonsPage })));
const AdminLiveClassesPage = lazy(() => import('./pages/admin/AdminLiveClassesPage').then((m) => ({ default: m.AdminLiveClassesPage })));
const AdminMockTestsPage = lazy(() => import('./pages/admin/AdminMockTestsPage').then((m) => ({ default: m.AdminMockTestsPage })));
const AdminQuestionsPage = lazy(() => import('./pages/admin/AdminQuestionsPage').then((m) => ({ default: m.AdminQuestionsPage })));
const AdminStudentsPage = lazy(() => import('./pages/admin/AdminStudentsPage').then((m) => ({ default: m.AdminStudentsPage })));
const AdminPaymentsPage = lazy(() => import('./pages/admin/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage })));
const AdminEnquiriesPage = lazy(() => import('./pages/admin/AdminEnquiriesPage').then((m) => ({ default: m.AdminEnquiriesPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage })));
const AdminLatestUpdatesPage = lazy(() => import('./pages/admin/AdminLatestUpdatesPage').then((m) => ({ default: m.AdminLatestUpdatesPage })));
const AdminNotificationsPage = lazy(() => import('./pages/admin/AdminNotificationsPage').then((m) => ({ default: m.AdminNotificationsPage })));
const AdminTuitionProgramsPage = lazy(() => import('./pages/admin/AdminTuitionProgramsPage').then((m) => ({ default: m.AdminTuitionProgramsPage })));
const AdminEnrollmentsPage = lazy(() => import('./pages/admin/AdminEnrollmentsPage').then((m) => ({ default: m.AdminEnrollmentsPage })));
const AdminStaffPage = lazy(() => import('./pages/admin/AdminStaffPage').then((m) => ({ default: m.AdminStaffPage })));
const AdminApprovalsPage = lazy(() => import('./pages/admin/AdminApprovalsPage').then((m) => ({ default: m.AdminApprovalsPage })));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })));
const AdminPayoutsPage = lazy(() => import('./pages/admin/AdminPayoutsPage').then((m) => ({ default: m.AdminPayoutsPage })));

const RouteLoadingSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
    <div className="w-10 h-10 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mb-3"></div>
    <p className="text-xs font-bold text-slate-500">Loading page...</p>
  </div>
);

// Route Guards
const ProtectedStudentRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <RouteLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const ProtectedPortalRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isStaff, hasRole, loading } = useAuth();
  if (loading) return <RouteLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/student/dashboard" replace />;
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

const FacultyRedirect = () => {
  const { isAuthenticated, isStaff, loading } = useAuth();
  if (loading) return <RouteLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isStaff ? '/admin/dashboard' : '/student/dashboard'} replace />;
};

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollManager />
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <SiteSettingsProvider>
              <Suspense fallback={<RouteLoadingSpinner />}>
                <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/bankers-path" element={<BankersPathPage />} />
                  <Route path="/competitive-exams" element={<CompetitiveExamsPage />} />
                  <Route path="/courses" element={<Navigate to="/bankers-path" replace />} />
                  <Route path="/courses/:slug" element={<CourseDetailsPage />} />
                  <Route path="/online-classes" element={<OnlineClassesPage />} />
                  <Route path="/recorded-classes" element={<RecordedClassesPage />} />
                  <Route path="/mock-tests" element={<MockTestsPage />} />
                  <Route path="/entrance-exams" element={<EntranceExamsPage />} />
                  <Route path="/faculty" element={<FacultyPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/enquiry" element={<EnquiryDemoPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/tuition-programs" element={<TuitionProgramsPage />} />
                  <Route path="/tuition-programs/:slug" element={<TuitionProgramDetailsPage />} />
                  <Route path="/tuition-programs/:slug/enroll" element={<TuitionEnrollmentPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/refund-policy" element={<RefundPolicyPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Student Learning Portal */}
                <Route
                  path="/student"
                  element={
                    <ProtectedStudentRoute>
                      <StudentLayout />
                    </ProtectedStudentRoute>
                  }
                >
                  <Route index element={<Navigate to="/student/dashboard" replace />} />
                  <Route path="dashboard" element={<StudentDashboardPage />} />
                  <Route path="my-courses" element={<MyCoursesPage />} />
                  <Route path="available-programs" element={<AvailableProgramsPage />} />
                  <Route path="enrollments" element={<MyEnrollmentsPage />} />
                  <Route path="my-programs" element={<MyProgramsPage />} />
                  <Route path="courses/:courseId/player" element={<CoursePlayerPage />} />
                  <Route path="live-classes" element={<LiveClassesSchedulePage />} />
                  <Route path="mock-tests" element={<MyMockTestsPage />} />
                  <Route path="mock-tests/:mockTestId/take" element={<ExamTakePage />} />
                  <Route path="mock-tests/result/:attemptId" element={<ExamResultPage />} />
                  <Route path="payments" element={<StudentPaymentsPage />} />
                  <Route path="wallet" element={<StudentWalletPage />} />
                  <Route path="profile" element={<StudentProfilePage />} />
                </Route>

                {/* Faculty Route Redirect */}
                <Route path="/faculty/dashboard" element={<FacultyRedirect />} />

                {/* Multi-Role Staff & Admin Management Portal */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedPortalRoute>
                      <AdminLayout />
                    </ProtectedPortalRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="staff" element={<ProtectedPortalRoute allowedRoles={['ADMIN']}><AdminStaffPage /></ProtectedPortalRoute>} />
                  <Route path="approvals" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'FINANCE_STAFF']}><AdminApprovalsPage /></ProtectedPortalRoute>} />
                  <Route path="courses" element={<ProtectedPortalRoute allowedRoles={['ADMIN']}><AdminCoursesPage /></ProtectedPortalRoute>} />
                  <Route path="courses/new" element={<ProtectedPortalRoute allowedRoles={['ADMIN']}><AdminCourseFormPage /></ProtectedPortalRoute>} />
                  <Route path="courses/:courseId/edit" element={<ProtectedPortalRoute allowedRoles={['ADMIN']}><AdminCourseFormPage /></ProtectedPortalRoute>} />
                  <Route path="entrance-exams" element={<ProtectedPortalRoute allowedRoles={['ADMIN']}><AdminEntranceExamsPage /></ProtectedPortalRoute>} />
                  <Route path="faculty" element={<ProtectedPortalRoute allowedRoles={['ADMIN']}><AdminFacultyPage /></ProtectedPortalRoute>} />
                  <Route path="lessons" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'FACULTY']}><AdminLessonsPage /></ProtectedPortalRoute>} />
                  <Route path="live-classes" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'FACULTY', 'SUPPORT_STAFF']}><AdminLiveClassesPage /></ProtectedPortalRoute>} />
                  <Route path="mock-tests" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'FACULTY']}><AdminMockTestsPage /></ProtectedPortalRoute>} />
                  <Route path="mock-tests/:mockTestId/questions" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'FACULTY']}><AdminQuestionsPage /></ProtectedPortalRoute>} />
                  <Route path="students" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'SUPPORT_STAFF']}><AdminStudentsPage /></ProtectedPortalRoute>} />
                  <Route path="payments" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'FINANCE_STAFF']}><AdminPaymentsPage /></ProtectedPortalRoute>} />
                  <Route path="payouts" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'FINANCE_STAFF']}><AdminPayoutsPage /></ProtectedPortalRoute>} />
                  <Route path="reports" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'FINANCE_STAFF']}><AdminReportsPage /></ProtectedPortalRoute>} />
                  <Route path="enquiries" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'SUPPORT_STAFF']}><AdminEnquiriesPage /></ProtectedPortalRoute>} />
                  <Route path="settings" element={<ProtectedPortalRoute allowedRoles={['ADMIN']}><AdminSettingsPage /></ProtectedPortalRoute>} />
                  <Route path="audit-logs" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'FINANCE_STAFF']}><AdminAuditLogsPage /></ProtectedPortalRoute>} />
                  <Route path="updates" element={<ProtectedPortalRoute allowedRoles={['ADMIN']}><AdminLatestUpdatesPage /></ProtectedPortalRoute>} />
                  <Route path="notifications" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'SUPPORT_STAFF']}><AdminNotificationsPage /></ProtectedPortalRoute>} />
                  <Route path="tuitions" element={<ProtectedPortalRoute allowedRoles={['ADMIN']}><AdminTuitionProgramsPage /></ProtectedPortalRoute>} />
                  <Route path="enrollments" element={<ProtectedPortalRoute allowedRoles={['ADMIN', 'SUPPORT_STAFF', 'FINANCE_STAFF']}><AdminEnrollmentsPage /></ProtectedPortalRoute>} />
                </Route>
              </Routes>
            </Suspense>
          </SiteSettingsProvider>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
