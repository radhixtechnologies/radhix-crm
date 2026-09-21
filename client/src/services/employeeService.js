import api from './api';

export const employeeService = {
  getEmployees: (params) => api.get('/employees', { params }),
  getEmployee: (id) => api.get(`/employees/${id}`),
  createEmployee: async (data) => {
    console.log('Creating employee with data:', data);
    try {
      const response = await api.post('/employees', data);
      return response;
    } catch (error) {
      console.error('Error in createEmployee service:', error);
      throw error;
    }
  },
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/employees/${id}`),

  // Documents
  addDocument: (id, data) => api.post(`/employees/${id}/documents`, data),
  deleteDocument: (id, docId) => api.delete(`/employees/${id}/documents/${docId}`),

  // Skills
  addSkill: (id, data) => api.post(`/employees/${id}/skills`, data),
  updateSkill: (id, skillId, data) => api.put(`/employees/${id}/skills/${skillId}`, data),
  deleteSkill: (id, skillId) => api.delete(`/employees/${id}/skills/${skillId}`),

  checkIn: (id) => api.post(`/employees/${id}/attendance/checkin`),
  checkOut: (id) => api.post(`/employees/${id}/attendance/checkout`),
  getAttendance: (id, params) => api.get(`/employees/${id}/attendance`, { params }),
  // Self-attendance routes (for current user - automatically finds employee record)
  checkInSelf: (data) => api.post('/attendance/checkin', data),
  checkOutSelf: (data) => api.post('/attendance/checkout', data),
  getAttendanceSelf: (params) => api.get('/attendance', { params }),
  getTodayStatusSelf: () => api.get('/attendance/today'),
  getAllAttendance: (params) => api.get('/employees/attendance/all', { params }),

  createLeave: (data) => {
    // Format payload to prevent 400 errors
    const payload = {
      ...data,
      type: data.type ? data.type.toLowerCase() : '',
    };
    return api.post('/employees/leaves', payload);
  },
  getLeaves: (params) => api.get('/employees/leaves', { params }),
  updateLeave: (id, data) => api.put(`/employees/leaves/${id}`, data),

  // Leave Balance & Reports
  // employeeId: employee ID string (required)
  // params: query parameters object (optional - e.g., { year: 2024 })
  getLeaveBalance: (employeeId, params = {}) => {
    if (!employeeId || typeof employeeId !== 'string') {
      throw new Error('Employee ID is required and must be a string');
    }
    return api.get(`/employees/leave-balance/${employeeId}`, { params });
  },
  updateLeaveBalance: (id, data) => api.put(`/employees/leave-balance/${id}`, data),
  resetLeaveBalance: (id, data) => api.post(`/employees/leave-balance/${id}/reset`, data),
  deductLeave: (id, data) => api.post(`/employees/leave-balance/${id}/deduct`, data),
  getLeaveBalanceSummary: (params) => api.get('/employees/leaves/summary', { params }),
  getLeaveReports: (params) => api.get('/employees/leave-reports', { params }),

  // Leave Reports
  getLeaveSummary: (params) => api.get('/reports/leaves/summary', { params }),
  getAllLeaves: (params) => api.get('/reports/leaves/all', { params }),
  getMonthlyLeaveReport: (params) => api.get('/reports/leaves/monthly', { params }),
  getDepartmentLeaveReport: (params) => api.get('/reports/leaves/department', { params }),
  getEmployeeLeaveReport: (params) => api.get('/reports/leaves/employee', { params }),
  getYearlyTrend: (params) => api.get('/reports/leaves/yearly-trend', { params }),
  getPersonalLeaveReport: (employeeId, params) => api.get(`/reports/leaves/${employeeId}`, { params }),

  // Leave Allocation
  allocateLeaveToEmployee: (employeeId, data) => api.post(`/employees/${employeeId}/leave-allocation`, data),
  allocateLeaveToDepartment: (department, data) => api.post(`/employees/department/${department}/leave-allocation`, data),
  resetYearlyLeaves: (data) => api.post('/employees/leave-allocation/reset', data),

  // Performance & Appraisal
  getGoals: (employeeId) => api.get(`/performance/goals/${employeeId}`),
  getAllGoals: (params) => api.get('/performance/goals', { params }),
  createGoal: (data) => api.post('/performance/goals', data),
  updateGoal: (id, data) => api.put(`/performance/goals/${id}`, data),

  getReviews: (employeeId) => api.get(`/performance/reviews/${employeeId}`),
  getAllReviews: (params) => api.get('/performance/reviews', { params }),
  submitSelfReview: (data) => api.post('/performance/self-review', data),
  submitManagerReview: (data) => api.post('/performance/manager-review', data),

  getCycles: () => api.get('/performance/cycles'),
  createCycle: (data) => api.post('/performance/cycles', data),

  getTasks: (params) => api.get('/employees/tasks', { params }),
  getTask: (id) => api.get(`/employees/tasks/${id}`),
  createTask: (data) => api.post('/employees/tasks', data),
  updateTask: (id, data) => api.put(`/employees/tasks/${id}`, data),
  submitTask: (id) => api.post(`/employees/tasks/${id}/submit`),
  approveTask: (id) => api.post(`/employees/tasks/${id}/approve`),
  rejectTask: (id, reason) => api.post(`/employees/tasks/${id}/reject`, { rejectionReason: reason }),

  // Timesheets
  getTimesheets: (params) => api.get('/employees/timesheets', { params }),
  getTimesheet: (id) => api.get(`/employees/timesheets/${id}`),
  createTimesheet: (data) => api.post('/employees/timesheets', data),
  updateTimesheet: (id, data) => api.put(`/employees/timesheets/${id}`, data),
  deleteTimesheet: (id) => api.delete(`/employees/timesheets/${id}`),

  // Performance & Appraisal - Old endpoints (for backward compatibility with Performance.jsx)
  // These are deprecated - use the new /api/performance endpoints instead
  getPerformanceReviews: (params) => {
    // Note: Performance.jsx expects appraisal cycles, not reviews
    // So we call the cycles endpoint instead
    return api.get('/performance/cycles', { params });
  },
  getPerformanceReview: (id) => {
    // Note: This doesn't match new API structure - keeping for compatibility
    // The new API uses /performance/reviews/:employeeId, not /performance/reviews/:id
    return api.get(`/performance/reviews/${id}`);
  },
  createPerformanceReview: (data) => {
    // This doesn't match new API - new API uses cycles, not reviews directly
    // Keeping for compatibility - may need to create a cycle first
    return api.post('/performance/cycles', data);
  },
  updatePerformanceReview: (id, data) => {
    // This doesn't match new API structure
    return api.put(`/performance/reviews/${id}`, data);
  },
  addGoal: (employeeId, data) => api.post('/performance/goals', { ...data, employeeId }),
  updateEmployeeGoal: (employeeId, goalId, data) => api.put(`/performance/goals/${goalId}`, data),
  deleteGoal: (employeeId, goalId) => api.delete(`/performance/goals/${goalId}`),

  // Payroll
  getSalarySlips: (params) => api.get('/employees/salary-slips', { params }),
  getSalarySlip: (id) => api.get(`/employees/salary-slips/${id}`),
  downloadSalarySlip: (pdfUrl) => {
    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://radhix-crm.onrender.com/api' : 'http://localhost:5000/api');
    window.open(`${API_URL}${pdfUrl}`, '_blank');
  },
  getReimbursements: (params) => api.get('/employees/reimbursements', { params }),
  getReimbursement: (id) => api.get(`/employees/reimbursements/${id}`),
  createReimbursement: (data) => api.post('/employees/reimbursements', data),
  updateReimbursement: (id, data) => api.put(`/employees/reimbursements/${id}`, data),
  deleteReimbursement: (id) => api.delete(`/employees/reimbursements/${id}`),

  // Assets
  getAssets: (params) => api.get('/employees/assets', { params }),
  getAsset: (id) => api.get(`/employees/assets/${id}`),
  createAsset: (data) => api.post('/employees/assets', data),
  updateAsset: (id, data) => api.put(`/employees/assets/${id}`, data),
  deleteAsset: (id) => api.delete(`/employees/assets/${id}`),
  assignAsset: (id, data) => api.post(`/employees/assets/${id}/assign`, data),
  returnAsset: (id) => api.post(`/employees/assets/${id}/return`),
  addMaintenance: (id, data) => api.post(`/employees/assets/${id}/maintenance`, data),
  updateAssetStatus: (id, data) => api.put(`/employees/assets/${id}/status`, data),

  // Dashboard
  getEmployeeDashboard: () => api.get('/employees/dashboard'),

  // Exit Process
  submitResignation: (id, data) => api.post(`/employees/${id}/resignation`, data),
  getExitProcess: (id) => api.get(`/employees/${id}/exit-process`),
  updateExitChecklist: (id, data) => api.put(`/employees/${id}/exit-checklist`, data),
  calculateSettlement: (id) => api.post(`/employees/${id}/calculate-settlement`),
  cancelResignation: (id) => api.post(`/employees/${id}/cancel-resignation`),

  // Activity Logs
  getActivityLogs: (id, params) => id ? api.get(`/employees/${id}/activity-logs`, { params }) : api.get('/employees/activity-logs', { params }),
  getLoginHistory: (id, params) => id ? api.get(`/employees/${id}/login-history`, { params }) : api.get('/employees/login-history', { params }),
  getActivityTimeline: (id) => api.get(`/employees/${id}/timeline`),
  getActivityStats: (id) => api.get(`/employees/${id}/activity-stats`),

  // Import/Export
  exportEmployeesCSV: (params) => {
    return api.get('/employees/export/csv', {
      params,
      responseType: 'blob',
    });
  },
  exportEmployeesExcel: (params) => {
    return api.get('/employees/export/excel', {
      params,
      responseType: 'blob',
    });
  },
  exportEmployeesPDF: (params) => {
    return api.get('/employees/export/pdf', {
      params,
      responseType: 'blob',
    });
  },
  downloadImportTemplate: () => {
    return api.get('/employees/import/template', {
      responseType: 'blob',
    });
  },
  previewImport: (file) => {
    const formData = new FormData();
    formData.append('import', file);
    return api.post('/employees/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  importEmployees: (file) => {
    const formData = new FormData();
    formData.append('import', file);
    return api.post('/employees/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getImportLogs: () => api.get('/employees/import/logs'),

  // Statistics
  getEmployeeStatistics: (params) => api.get('/employees/statistics', { params }),

  // Avatar Upload
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post(`/employees/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Document Upload (updated to support file upload)
  addDocumentWithFile: (id, file, documentData) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('name', documentData.name || file.name);
    formData.append('type', documentData.type || 'other');
    if (documentData.expiryDate) {
      formData.append('expiryDate', documentData.expiryDate);
    }
    return api.post(`/employees/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

