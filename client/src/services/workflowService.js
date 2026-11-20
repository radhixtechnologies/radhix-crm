import api from './api';

export const workflowService = {
  getWorkflows: () => api.get('/workflows'),
  createWorkflow: (data) => api.post('/workflows', data),
  toggleWorkflow: (id) => api.put(`/workflows/${id}/toggle`),
  deleteWorkflow: (id) => api.delete(`/workflows/${id}`),
};

export default workflowService;

