import api from './api';

export const leadFormService = {
  getForms: () => api.get('/lead-forms'),
  createForm: (data) => api.post('/lead-forms', data),
  deleteForm: (id) => api.delete(`/lead-forms/${id}`),
  getPublicForm: (id) => api.get(`/lead-forms/public/${id}`),
  submitPublicForm: (id, data) => api.post(`/lead-forms/public/${id}/submit`, data),
};

