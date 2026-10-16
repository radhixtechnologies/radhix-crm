import api from './api';

export const dailyUpdateService = {
  getDailyUpdates: (params) => api.get('/daily-updates', { params }),
  getSubmissionTracker: (params) => api.get('/daily-updates/tracker', { params }),
  getTodayUpdate: () => api.get('/daily-updates/today'),
  saveDailyUpdate: (data) => api.post('/daily-updates', data),
  getDailyUpdate: (id) => api.get(`/daily-updates/${id}`),
  submitFeedback: (id, data) => api.post(`/daily-updates/${id}/feedback`, data),
  deleteDailyUpdate: (id) => api.delete(`/daily-updates/${id}`),
};
