import api from './api';

export const reportService = {
    // Sales Reports
    getSalesPerformance: (params) => api.get('/reports/sales/performance', { params }),

    // Lead Reports
    getLeadConversion: (params) => api.get('/reports/leads/conversion', { params }),

    // Marketing Reports
    getMarketingROI: (params) => api.get('/reports/marketing/roi', { params }),

    // Existing Leave Reports (if migrated or referenced)
    getLeaveSummary: () => api.get('/reports/leaves/summary'),
    getMonthlyLeaveReport: (year, month) => api.get(`/reports/leaves/monthly?year=${year}&month=${month}`),
};
