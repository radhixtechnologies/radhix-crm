import api from './api';

export const gymService = {
  getSummary: () => api.get('/gym/summary'),
  getMembers: (params) => api.get('/gym/members', { params }),
  createMember: (data) => api.post('/gym/members', data),
  updateMember: (id, data) => api.put(`/gym/members/${id}`, data),
  getTrainers: (params) => api.get('/gym/trainers', { params }),
  createTrainer: (data) => api.post('/gym/trainers', data),
  updateTrainer: (id, data) => api.put(`/gym/trainers/${id}`, data),
  getClasses: (params) => api.get('/gym/classes', { params }),
  createClass: (data) => api.post('/gym/classes', data),
  updateClass: (id, data) => api.put(`/gym/classes/${id}`, data),
  enrollMember: (id, data) => api.post(`/gym/classes/${id}/enroll`, data),
  getCheckIns: (params) => api.get('/gym/check-ins', { params }),
  createCheckIn: (data) => api.post('/gym/check-ins', data),
  checkOut: (id) => api.put(`/gym/check-ins/${id}/checkout`),
};
