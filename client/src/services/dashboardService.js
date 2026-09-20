import api from './api';

export const dashboardService = {
  // Super Admin Dashboard APIs
  getSuperAdminOverview: () => api.get('/dashboard/superadmin/overview'),
  getHRMInsights: () => api.get('/dashboard/superadmin/hrm'),
  getAttendanceOverview: () => api.get('/dashboard/superadmin/attendance'),
  getSalesSummary: () => api.get('/dashboard/superadmin/sales'),
  getFinanceSummary: () => api.get('/dashboard/superadmin/finance'),
  getNotifications: () => api.get('/dashboard/superadmin/notifications'),
  getActivityLog: (params) => api.get('/dashboard/superadmin/activity', { params }),
};

