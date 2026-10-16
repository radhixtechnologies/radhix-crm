import api from './api';

export const announcementService = {
  getAnnouncements: (params = {}) => api.get('/announcements', { params }),
  createAnnouncement: (data) => api.post('/announcements', data),
  toggleLike: (id) => api.post(`/announcements/${id}/like`),
  addComment: (id, comment) => api.post(`/announcements/${id}/comments`, { comment }),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
};

export default announcementService;

