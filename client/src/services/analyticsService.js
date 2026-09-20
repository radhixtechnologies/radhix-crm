import api from './api';

export const analyticsService = {
  getDashboardAnalytics: () => api.get('/analytics/dashboard'),
};

