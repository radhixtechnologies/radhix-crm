import api from './api';

export const branchService = {
  getBranches: (params) => api.get('/branches', { params }),
  createBranch: (data) => api.post('/branches', data),
  updateBranch: (id, data) => api.put(`/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/branches/${id}`),
};
