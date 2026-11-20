import api from './api';

export const healthcareService = {
  getSummary: () => api.get('/healthcare/summary'),
  getPatients: (params) => api.get('/healthcare/patients', { params }),
  createPatient: (data) => api.post('/healthcare/patients', data),
  updatePatient: (id, data) => api.put(`/healthcare/patients/${id}`, data),
  deletePatient: (id) => api.delete(`/healthcare/patients/${id}`),
  getAppointments: (params) => api.get('/healthcare/appointments', { params }),
  createAppointment: (data) => api.post('/healthcare/appointments', data),
  updateAppointment: (id, data) => api.put(`/healthcare/appointments/${id}`, data),
  deleteAppointment: (id) => api.delete(`/healthcare/appointments/${id}`),
};
