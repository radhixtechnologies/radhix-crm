import api from './api';

export const constructionService = {
  getSummary: () => api.get('/construction/summary'),
  getProjects: (params) => api.get('/construction/projects', { params }),
  getProject: (id) => api.get(`/construction/projects/${id}`),
  createProject: (data) => api.post('/construction/projects', data),
  updateProject: (id, data) => api.put(`/construction/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/construction/projects/${id}`),
  addEstimateItem: (id, data) => api.post(`/construction/projects/${id}/estimate`, data),
  updateEstimateItem: (id, itemId, data) => api.put(`/construction/projects/${id}/estimate/${itemId}`, data),
  deleteEstimateItem: (id, itemId) => api.delete(`/construction/projects/${id}/estimate/${itemId}`),
  getVendors: (params) => api.get('/construction/vendors', { params }),
  createVendor: (data) => api.post('/construction/vendors', data),
  updateVendor: (id, data) => api.put(`/construction/vendors/${id}`, data),
  deleteVendor: (id) => api.delete(`/construction/vendors/${id}`),
};
