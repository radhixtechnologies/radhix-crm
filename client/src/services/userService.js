import api from './api';

export const userService = {
  getUsers: (params) => api.get('/users', { params }),
  getRoles: () => api.get('/users/roles'),
  getUser: (id) => api.get(`/users/${id}`),
  createAdmin: (data) => api.post('/users/admin', data),
  updateAdminModules: (id, data) => api.put(`/users/${id}/modules`, data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

