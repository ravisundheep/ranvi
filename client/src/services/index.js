import api from './api';
export { authService } from './authService';
export { entranceExamService } from './entranceExamService';

// Lightweight in-memory cache & in-flight request deduplicator
const clientCache = new Map();
const inFlightRequests = new Map();

export const clearClientCache = (pattern) => {
  if (!pattern) {
    clientCache.clear();
    return;
  }
  for (const key of clientCache.keys()) {
    if (key.includes(pattern)) {
      clientCache.delete(key);
    }
  }
};

export const cachedGet = async (url, params = {}, ttlMs = 45000) => {
  const queryStr = new URLSearchParams(params).toString();
  const key = queryStr ? `${url}?${queryStr}` : url;
  const now = Date.now();

  const cached = clientCache.get(key);
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const promise = api.get(url, { params })
    .then((res) => {
      if (res && res.success) {
        clientCache.set(key, { data: res, timestamp: Date.now() });
      }
      inFlightRequests.delete(key);
      return res;
    })
    .catch((err) => {
      inFlightRequests.delete(key);
      throw err;
    });

  inFlightRequests.set(key, promise);
  return promise;
};

const DEFAULT_AVAILABLE_STATES = [
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
  'West Bengal',
  'Gujarat',
  'Rajasthan',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Odisha',
];

export const courseService = {
  getCourses: async (params = {}) => {
    return cachedGet('/courses', params, 60000);
  },
  getCategories: async (params = {}) => {
    return cachedGet('/courses/categories', params, 120000);
  },
  createCategory: async (data) => {
    clearClientCache('/courses/categories');
    return api.post('/courses/categories', data);
  },
  updateCategory: async (id, data) => {
    clearClientCache('/courses/categories');
    return api.put(`/courses/categories/${id}`, data);
  },
  deleteCategory: async (id) => {
    clearClientCache('/courses/categories');
    return api.delete(`/courses/categories/${id}`);
  },
  getAvailableStates: async () => {
    try {
      const res = await cachedGet('/courses/states', {}, 300000);
      if (res && res.success && Array.isArray(res.data)) {
        return res;
      }
      return {
        success: true,
        data: DEFAULT_AVAILABLE_STATES,
      };
    } catch (err) {
      // Graceful fallback when remote backend does not have /states route deployed yet
      return {
        success: true,
        data: DEFAULT_AVAILABLE_STATES,
      };
    }
  },
  getCourseBySlug: async (slug) => {
    return api.get(`/courses/${slug}`);
  },
  getCourseLessons: async (courseId) => {
    return api.get(`/lessons/course/${courseId}`);
  },
  getLessonPlayback: async (lessonId) => {
    return api.get(`/lessons/playback/${lessonId}`);
  },
};

export const facultyService = {
  getFacultyList: async (params = {}) => {
    return api.get('/faculty', { params });
  },
  getFacultyById: async (id) => {
    return api.get(`/faculty/${id}`);
  },
  createFaculty: async (data) => {
    return api.post('/faculty', data);
  },
  updateFaculty: async (id, data) => {
    return api.put(`/faculty/${id}`, data);
  },
  deleteFaculty: async (id) => {
    return api.delete(`/faculty/${id}`);
  },
};

export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadVideo: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const liveClassService = {
  getPublicSchedule: async () => {
    return api.get('/live-classes/public-schedule');
  },
  getStudentLiveClasses: async () => {
    return api.get('/live-classes/student');
  },
  getAllLiveClasses: async (params = {}) => {
    return api.get('/live-classes', { params });
  },
  createLiveClass: async (data) => {
    return api.post('/live-classes', data);
  },
  updateLiveClass: async (id, data) => {
    return api.put(`/live-classes/${id}`, data);
  },
  cancelLiveClass: async (id) => {
    return api.put(`/live-classes/${id}/cancel`);
  },
  deleteLiveClass: async (id) => {
    return api.delete(`/live-classes/${id}`);
  },
};

export const examService = {
  getMockTests: async (params = {}) => {
    return api.get('/mock-tests', { params });
  },
  getMockTestBySlug: async (slug) => {
    return api.get(`/mock-tests/${slug}`);
  },
  startExam: async (mockTestId) => {
    return api.post(`/exam-attempts/start/${mockTestId}`);
  },
  saveResponse: async (attemptId, data) => {
    return api.post(`/exam-attempts/save-response/${attemptId}`, data);
  },
  submitExam: async (attemptId, data = {}) => {
    return api.post(`/exam-attempts/submit/${attemptId}`, data);
  },
  getAttemptResult: async (attemptId) => {
    return api.get(`/exam-attempts/result/${attemptId}`);
  },
  getLeaderboard: async (mockTestId) => {
    return api.get(`/exam-attempts/leaderboard/${mockTestId}`);
  },
  getMyExamHistory: async () => {
    return api.get('/exam-attempts/my-history');
  },
  getMockTestLeaderboard: (mockTestId) => api.get(`/mock-tests/${mockTestId}/leaderboard`),
};

export const paymentService = {
  createCheckoutOrder: async (data) => {
    return api.post('/payments/checkout', data);
  },
  verifyPayment: async (data) => {
    clearClientCache('/courses');
    return api.post('/payments/verify', data);
  },
  getMyPaymentHistory: async () => {
    return api.get('/payments/my-history');
  },
};

export const enquiryService = {
  submitEnquiry: async (data) => {
    return api.post('/enquiries', data);
  },
  getMyRequests: async () => {
    return api.get('/enquiries/my-requests');
  },
};

export const adminService = {
  getDashboardStats: async () => {
    return api.get('/admin/dashboard-stats');
  },
  getReportsData: async () => {
    return api.get('/admin/reports');
  },
  getStudents: async (params = {}) => {
    return api.get('/admin/students', { params });
  },
  resetStudentDevice: async (studentId, reason) => {
    return api.post(`/admin/students/${studentId}/reset-device`, { reason });
  },
  toggleStudentStatus: async (studentId) => {
    return api.put(`/admin/students/${studentId}/toggle-status`);
  },
  getAuditLogs: async (params = {}) => {
    return api.get('/admin/audit-logs', { params });
  },
  cleanupAuditLogs: async () => {
    return api.post('/admin/audit-logs/cleanup');
  },
  getAllPayments: async (params = {}) => {
    return api.get('/payments/admin/all', { params });
  },
  grantManualAccess: async (data) => {
    clearClientCache('/courses');
    return api.post('/payments/admin/grant-manual', data);
  },
  getEnquiries: async (params = {}) => {
    return api.get('/enquiries/admin', { params });
  },
  updateEnquiryStatus: async (id, data) => {
    return api.put(`/enquiries/admin/${id}`, data);
  },
  assignEnquiry: async (id, data) => {
    return api.put(`/enquiries/admin/${id}/assign`, data);
  },
  getSiteSettings: async () => {
    return cachedGet('/site-settings', {}, 60000);
  },
  updateSiteSettings: async (data) => {
    clearClientCache('/site-settings');
    return api.put('/site-settings', data);
  },
  // Course management
  createCourse: async (data) => {
    clearClientCache('/courses');
    return api.post('/courses', data);
  },
  updateCourse: async (id, data) => {
    clearClientCache('/courses');
    return api.put(`/courses/${id}`, data);
  },
  deleteCourse: async (id) => {
    clearClientCache('/courses');
    return api.delete(`/courses/${id}`);
  },
  // Lessons
  createLesson: async (data) => {
    clearClientCache('/courses');
    clearClientCache('/lessons');
    return api.post('/lessons', data);
  },
  updateLesson: async (id, data) => {
    clearClientCache('/courses');
    clearClientCache('/lessons');
    return api.put(`/lessons/${id}`, data);
  },
  deleteLesson: async (id) => {
    clearClientCache('/courses');
    clearClientCache('/lessons');
    return api.delete(`/lessons/${id}`);
  },
  // Mock Tests & Questions
  createMockTest: async (data) => {
    return api.post('/mock-tests', data);
  },
  uploadMockTestPaper: async (data) => {
    return api.post('/mock-tests/upload-paper', data);
  },
  updateMockTest: async (id, data) => {
    return api.put(`/mock-tests/${id}`, data);
  },
  deleteMockTest: async (id) => {
    return api.delete(`/mock-tests/${id}`);
  },
  addQuestion: async (mockTestId, data) => {
    return api.post(`/mock-tests/${mockTestId}/questions`, data);
  },
  bulkUploadQuestions: async (mockTestId, questions) => {
    return api.post(`/mock-tests/${mockTestId}/bulk-questions`, { questions });
  },
  getAdminQuestions: async (mockTestId) => {
    return api.get(`/mock-tests/${mockTestId}/admin-questions`);
  },
  updateQuestion: async (questionId, data) => {
    return api.put(`/mock-tests/questions/${questionId}`, data);
  },
  deleteQuestion: async (questionId) => {
    return api.delete(`/mock-tests/questions/${questionId}`);
  },
};

export const latestUpdateService = {
  getPublishedUpdates: async (params = {}) => {
    return cachedGet('/latest-updates/public', params, 30000);
  },
  getUpdateById: async (id) => {
    return api.get(`/latest-updates/public/${id}`);
  },
  getAdminUpdates: async (params = {}) => {
    return api.get('/latest-updates/admin', { params });
  },
  createUpdate: async (data) => {
    clearClientCache('/latest-updates');
    return api.post('/latest-updates/admin', data);
  },
  updateUpdate: async (id, data) => {
    clearClientCache('/latest-updates');
    return api.put(`/latest-updates/admin/${id}`, data);
  },
  deleteUpdate: async (id) => {
    clearClientCache('/latest-updates');
    return api.delete(`/latest-updates/admin/${id}`);
  },
  toggleUpdateStatus: async (id) => {
    clearClientCache('/latest-updates');
    return api.patch(`/latest-updates/admin/${id}/toggle-status`);
  },
};

export const publicNotificationService = {
  getPublicNotifications: async (params = {}) => {
    return cachedGet('/notifications/public', params, 30000);
  },
  getPublicNotificationById: async (id) => {
    return api.get(`/notifications/public/${id}`);
  },
  getAdminNotifications: async (params = {}) => {
    return api.get('/notifications/admin', { params });
  },
  createAdminNotification: async (data) => {
    clearClientCache('/notifications');
    return api.post('/notifications/admin', data);
  },
  updateAdminNotification: async (id, data) => {
    clearClientCache('/notifications');
    return api.put(`/notifications/admin/${id}`, data);
  },
  deleteAdminNotification: async (id) => {
    clearClientCache('/notifications');
    return api.delete(`/notifications/admin/${id}`);
  },
  toggleNotificationStatus: async (id) => {
    clearClientCache('/notifications');
    return api.patch(`/notifications/admin/${id}/toggle-status`);
  },
  toggleNotificationPinned: async (id) => {
    clearClientCache('/notifications');
    return api.patch(`/notifications/admin/${id}/toggle-pinned`);
  },
  getMyNotifications: async () => {
    return api.get('/notifications/my');
  },
  markAsRead: async (id = 'all') => {
    return api.put(`/notifications/mark-read/${id}`);
  },
};

export const notificationService = publicNotificationService;

export const enrollmentService = {
  createIntent: async (data) => {
    return api.post('/enrollments/intent', data);
  },
  verifyPayment: async (data) => {
    clearClientCache('/courses');
    return api.post('/enrollments/verify', data);
  },
  getMyEnrollments: async () => {
    return api.get('/enrollments/my');
  },
  getMyEnrollmentById: async (id) => {
    return api.get(`/enrollments/my/${id}`);
  },
  requestRefund: async (id, reason) => {
    return api.post(`/enrollments/${id}/refund-request`, { reason });
  },
  getAdminEnrollments: async (params = {}) => {
    return api.get('/enrollments/admin', { params });
  },
  getAdminStats: async () => {
    return api.get('/enrollments/admin/stats');
  },
  updateAdminStatus: async (id, data) => {
    return api.put(`/enrollments/admin/${id}/status`, data);
  },
};

export const tuitionService = {
  getTuitionPrograms: async (params = {}) => {
    return cachedGet('/courses', { ...params, division: 'TUITIONS' }, 30000);
  },
  getPublishedPrograms: async (params = {}) => {
    return cachedGet('/courses', { ...params, division: 'TUITIONS' }, 30000);
  },
  getTuitionProgramBySlug: async (slug) => {
    return api.get(`/courses/${slug}`);
  },
  getProgramBySlug: async (slug) => {
    return api.get(`/courses/${slug}`);
  },
  createTuitionProgram: async (data) => {
    clearClientCache('/courses');
    return api.post('/courses', { ...data, division: 'TUITIONS' });
  },
  updateTuitionProgram: async (id, data) => {
    clearClientCache('/courses');
    return api.put(`/courses/${id}`, data);
  },
  deleteTuitionProgram: async (id) => {
    clearClientCache('/courses');
    return api.delete(`/courses/${id}?permanent=true`);
  },
};

export const staffService = {
  getStaff: async (params = {}) => {
    return api.get('/admin/staff', { params });
  },
  createStaff: async (data) => {
    return api.post('/admin/staff', data);
  },
  updateStaff: async (staffId, data) => {
    return api.put(`/admin/staff/${staffId}`, data);
  },
  resetStaffPassword: async (staffId, newPassword) => {
    return api.post(`/admin/staff/${staffId}/reset-password`, { newPassword });
  },
  getApprovals: async (params = {}) => {
    return api.get('/admin/approvals', { params });
  },
  createApproval: async (data) => {
    return api.post('/admin/approvals', data);
  },
  reviewApproval: async (id, decision, reviewedNote = '') => {
    clearClientCache('/courses');
    return api.put(`/admin/approvals/${id}/review`, { decision, reviewedNote });
  },
  getReportsData: () => api.get('/admin/reports'),
};

export const walletService = {
  getMyWallet: async () => {
    return api.get('/wallet/my-wallet');
  },
  requestPayout: async (data) => {
    return api.post('/wallet/payout-request', data);
  },
  getAdminPayouts: async (params = {}) => {
    return api.get('/wallet/admin/payouts', { params });
  },
  processAdminPayout: async (id, data) => {
    return api.put(`/wallet/admin/payouts/${id}`, data);
  },
  getAdminReferralRewards: async (params = {}) => {
    return api.get('/wallet/admin/referral-rewards', { params });
  },
  releaseReferralReward: async (id) => {
    return api.put(`/wallet/admin/referral-rewards/${id}/release`);
  },
};

