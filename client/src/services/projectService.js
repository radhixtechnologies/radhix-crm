import api from './api';

export const projectService = {
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  archiveProject: (id) => api.delete(`/projects/${id}`),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (projectId, taskId, data) => api.put(`/projects/${projectId}/tasks/${taskId}`, data),
  archiveTask: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
  addWorkUpdate: (projectId, taskId, data) => api.post(`/projects/${projectId}/tasks/${taskId}/updates`, data),
  addMilestone: (projectId, data) => api.post(`/projects/${projectId}/milestones`, data),
  updateMilestone: (projectId, milestoneId, data) => api.put(`/projects/${projectId}/milestones/${milestoneId}`, data),
  deleteMilestone: (projectId, milestoneId) => api.delete(`/projects/${projectId}/milestones/${milestoneId}`),
};
