import api from './api';

export const instituteService = {
  // Courses
  getCourses: (params) => api.get('/institute/courses', { params }),
  getCourse: (id) => api.get(`/institute/courses/${id}`),
  createCourse: (data) => api.post('/institute/courses', data),
  updateCourse: (id, data) => api.put(`/institute/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/institute/courses/${id}`),

  // Batches
  getBatches: (params) => api.get('/institute/batches', { params }),
  getBatch: (id) => api.get(`/institute/batches/${id}`),
  createBatch: (data) => api.post('/institute/batches', data),
  updateBatch: (id, data) => api.put(`/institute/batches/${id}`, data),
  deleteBatch: (id) => api.delete(`/institute/batches/${id}`),

  // Follow-ups
  getFollowUps: (params) => api.get('/institute/followups', { params }),
  scheduleFollowUp: (data) => api.post('/institute/followups', data),
  updateFollowUp: (id, data) => api.put(`/institute/followups/${id}`, data),
  deleteFollowUp: (id) => api.delete(`/institute/followups/${id}`),

  // Students & Enrollment
  getStudents: (params) => api.get('/institute/students', { params }),
  getStudent: (id) => api.get(`/institute/students/${id}`),
  enrollStudent: (data) => api.post('/institute/students/enroll', data),
  updateStudent: (id, data) => api.put(`/institute/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/institute/students/${id}`),

  // Fees & Payments
  getFees: (params) => api.get('/institute/fees', { params }),
  getFee: (id) => api.get(`/institute/fees/${id}`),
  recordPayment: (id, data) => api.post(`/institute/fees/${id}/payments`, data),

  // Attendance
  getBatchRoster: (batchId, date) => api.get(`/institute/attendance/roster/${batchId}`, { params: { date } }),
  saveBatchAttendance: (data) => api.post('/institute/attendance', data),
  getAttendanceHistory: (params) => api.get('/institute/attendance/history', { params }),

  // Reports
  getOverviewReports: (params) => api.get('/institute/reports/overview', { params }),
};

export default instituteService;
