import api from './api';

export const reportService = {
    // Sales Reports
    getSalesPerformance: () => api.get('/reports/sales/performance'),

    // Lead Reports
    getLeadConversion: () => api.get('/reports/leads/conversion'),

    // Marketing Reports
    getMarketingROI: () => api.get('/reports/marketing/roi'),

    // Existing Leave Reports (if migrated or referenced)
    getLeaveSummary: () => api.get('/reports/leaves/summary'),
    getMonthlyLeaveReport: (year, month) => api.get(`/reports/leaves/monthly?year=${year}&month=${month}`),
};
