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
  getMyExamHistory: async () => {
    return api.get('/exam-attempts/my-history');
  },
};

export const paymentService = {
  createCheckoutOrder: async (data) => {
    return api.post('/payments/checkout', data);
  },
  verifyPayment: async (data) => {
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
};

export const adminService = {
  getDashboardStats: async () => {
    return api.get('/admin/dashboard-stats');
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
    return api.post('/payments/admin/grant-manual', data);
  },
  getEnquiries: async (params = {}) => {
    return api.get('/enquiries/admin', { params });
  },
  updateEnquiryStatus: async (id, data) => {
    return api.put(`/enquiries/admin/${id}`, data);
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
    try {
      return await cachedGet('/latest-updates/public', params, 30000);
    } catch (err) {
      // Graceful fallback if remote server has not yet deployed this endpoint
      return {
        success: true,
        data: {
          updates: [
            {
              _id: 'default-update-1',
              title: 'New Batches for JAIIB, CAIIB, IBPS PO & SBI PO starting this week!',
              badgeText: 'ADMISSIONS OPEN',
              publishedAt: new Date().toISOString(),
            },
            {
              _id: 'default-update-2',
              title: 'Admissions Open 2026: Live Zoom Classes with Senior Ex-Bankers & Daily Doubt Sessions',
              badgeText: 'LIVE CLASSES',
              publishedAt: new Date().toISOString(),
            },
            {
              _id: 'default-update-3',
              title: '10–20 Real Pattern Online Mock Tests with All India Rank & Instant Analysis',
              badgeText: 'MOCK TESTS',
              publishedAt: new Date().toISOString(),
            },
            {
              _id: 'default-update-4',
              title: 'School, Intermediate & Degree Tuitions Admissions Now Open',
              badgeText: 'TUITIONS',
              publishedAt: new Date().toISOString(),
            },
          ],
        },
      };
    }
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
    try {
      return await cachedGet('/notifications/public', params, 30000);
    } catch (err) {
      // Graceful fallback if remote server has not yet deployed this endpoint
      return {
        success: true,
        data: {
          notifications: [
            {
              _id: 'default-notif-1',
              title: 'JAIIB & CAIIB 2026 Batch Admissions Open',
              description: 'Official registration for upcoming JAIIB & CAIIB master batches is currently underway with morning & evening slots.',
              type: 'ADMISSION',
              isPinned: true,
              publishedAt: new Date().toISOString(),
            },
            {
              _id: 'default-notif-2',
              title: 'IBPS PO Prelims 2026 Mock Test Series Activated',
              description: 'Full syllabus mock tests with sectional timings and detailed analytics are now accessible in the student portal.',
              type: 'EXAM_ALERT',
              isPinned: true,
              publishedAt: new Date().toISOString(),
            },
            {
              _id: 'default-notif-3',
              title: 'Live Interactive Zoom Classes Schedule Updated',
              description: 'Check your daily live class timetable and join links from the Live Classes tab in your student dashboard.',
              type: 'ANNOUNCEMENT',
              isPinned: false,
              publishedAt: new Date().toISOString(),
            },
          ],
        },
      };
    }
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
};

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

