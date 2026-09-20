import api from './api';

export const marketingService = {
    // Campaign services
    getCampaigns: (params) => api.get('/campaigns', { params }),
    getCampaign: (id) => api.get(`/campaigns/${id}`),
    createCampaign: (data) => api.post('/campaigns', data),
    updateCampaign: (id, data) => api.put(`/campaigns/${id}`, data),
    deleteCampaign: (id) => api.delete(`/campaigns/${id}`),
    updateStatus: (id, status) => api.patch(`/campaigns/${id}/status`, { status }),
    getMetrics: (id) => api.get(`/campaigns/${id}/metrics`),
    getCampaignAnalytics: (id) => api.get(`/campaigns/${id}/analytics`),
    duplicateCampaign: (id) => api.post(`/campaigns/${id}/duplicate`),

    // Email services
    getEmails: (params) => api.get('/marketing/emails', { params }),
    getEmail: (id) => api.get(`/marketing/emails/${id}`),
    createEmail: (data) => api.post('/marketing/emails', data),
    updateEmail: (id, data) => api.put(`/marketing/emails/${id}`, data),
    deleteEmail: (id) => api.delete(`/marketing/emails/${id}`),
    scheduleEmail: (id, data) => api.post(`/marketing/emails/${id}/schedule`, data),
    sendEmail: (id) => api.post(`/marketing/emails/${id}/send`),
    sendTestEmail: (id, testEmail) => api.post(`/marketing/emails/${id}/test`, { testEmail }),
    getEmailAnalytics: (id) => api.get(`/marketing/emails/${id}/analytics`),

    // Segment services
    getSegments: (params) => api.get('/marketing/segments', { params }),
    getSegment: (id) => api.get(`/marketing/segments/${id}`),
    resolveSegment: (id, params) => api.get(`/marketing/segments/${id}/resolve`, { params }),
    refreshSegment: (id) => api.post(`/marketing/segments/${id}/refresh`),
    createSegment: (data) => api.post('/marketing/segments', data),
    updateSegment: (id, data) => api.put(`/marketing/segments/${id}`, data),
    deleteSegment: (id) => api.delete(`/marketing/segments/${id}`),

    // Automation services
    getAutomations: (params) => api.get('/marketing/automations', { params }),
    getAutomation: (id) => api.get(`/marketing/automations/${id}`),
    createAutomation: (data) => api.post('/marketing/automations', data),
    updateAutomation: (id, data) => api.put(`/marketing/automations/${id}`, data),
    deleteAutomation: (id) => api.delete(`/marketing/automations/${id}`),
    toggleAutomationStatus: (id, status) => api.patch(`/marketing/automations/${id}/status`, { status }),
    getAutomationHistory: (id, params) => api.get(`/marketing/automations/${id}/history`, { params }),
    testAutomation: (id, data) => api.post(`/marketing/automations/${id}/test`, data),
    triggerAutomation: (id, data) => api.post(`/marketing/automations/${id}/trigger`, data),
    getAutomationStats: (id) => api.get(`/marketing/automations/${id}/stats`),

    // Reports services
    getMarketingOverview: (params) => api.get('/marketing/reports/overview', { params }),
    getCampaignPerformanceReport: (params) => api.get('/marketing/reports/campaigns', { params }),
    getEmailAnalyticsReport: (params) => api.get('/marketing/reports/emails', { params }),
    getLeadSourceAnalysis: (params) => api.get('/marketing/reports/lead-sources', { params }),
    getConversionFunnel: (params) => api.get('/marketing/reports/funnel', { params }),
    exportMarketingReport: (data) => api.post('/marketing/reports/export', data),
};

