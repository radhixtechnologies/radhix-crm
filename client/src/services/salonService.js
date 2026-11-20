import api from './api';

export const salonService = {
  getSummary: () => api.get('/salon/summary'),
  getServices: (params) => api.get('/salon/services', { params }),
  createService: (data) => api.post('/salon/services', data),
  updateService: (id, data) => api.put(`/salon/services/${id}`, data),
  getStaff: (params) => api.get('/salon/staff', { params }),
  createStaff: (data) => api.post('/salon/staff', data),
  updateStaff: (id, data) => api.put(`/salon/staff/${id}`, data),
  getClients: (params) => api.get('/salon/clients', { params }),
  createClient: (data) => api.post('/salon/clients', data),
  updateClient: (id, data) => api.put(`/salon/clients/${id}`, data),
  getProducts: (params) => api.get('/salon/products', { params }),
  createProduct: (data) => api.post('/salon/products', data),
  updateProduct: (id, data) => api.put(`/salon/products/${id}`, data),
  getAppointments: (params) => api.get('/salon/appointments', { params }),
  createAppointment: (data) => api.post('/salon/appointments', data),
  updateAppointment: (id, data) => api.put(`/salon/appointments/${id}`, data),
  deleteAppointment: (id) => api.delete(`/salon/appointments/${id}`),
};
