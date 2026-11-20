import api from './api';

export const automotiveService = {
  getSummary: () => api.get('/automotive/summary'),
  getCustomers: (params) => api.get('/automotive/customers', { params }),
  createCustomer: (data) => api.post('/automotive/customers', data),
  updateCustomer: (id, data) => api.put(`/automotive/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/automotive/customers/${id}`),
  getVehicles: (params) => api.get('/automotive/vehicles', { params }),
  createVehicle: (data) => api.post('/automotive/vehicles', data),
  updateVehicle: (id, data) => api.put(`/automotive/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/automotive/vehicles/${id}`),
  getJobs: (params) => api.get('/automotive/jobs', { params }),
  createJob: (data) => api.post('/automotive/jobs', data),
  updateJob: (id, data) => api.put(`/automotive/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/automotive/jobs/${id}`),
  getParts: (params) => api.get('/automotive/parts', { params }),
  createPart: (data) => api.post('/automotive/parts', data),
  updatePart: (id, data) => api.put(`/automotive/parts/${id}`, data),
  deletePart: (id) => api.delete(`/automotive/parts/${id}`),
};
