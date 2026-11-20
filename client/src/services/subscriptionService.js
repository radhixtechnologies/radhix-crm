import api from './api';

export const subscriptionService = {
  getPlans: () => api.get('/subscription/plans'),
  getMySubscription: () => api.get('/subscription/my-subscription'),
  updateCompanySettings: (data) => api.put('/subscription/company-settings', data),
  changePlan: (data) => api.post('/subscription/change-plan', data),
  getAllTenants: () => api.get('/subscription/tenants'),
  createTenant: (data) => api.post('/subscription/tenants', data),
  updateTenantSubscription: (id, data) => api.put(`/subscription/tenants/${id}`, data),
  getTenantDetails: (id) => api.get(`/subscription/tenants/${id}/details`),
  impersonateTenant: (id) => api.post(`/subscription/tenants/${id}/impersonate`),
  resetTenantPassword: (id, data) => api.post(`/subscription/tenants/${id}/reset-password`, data),
  updateTenantCompanyProfile: (id, data) => api.put(`/subscription/tenants/${id}/profile`, data),
};

