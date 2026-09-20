import api from './api';

export const activityService = {
    getActivities: (params) => api.get('/activities', { params }),
    getUpcomingActivities: (limit = 5) => api.get('/activities/upcoming', { params: { limit } }),
    createActivity: (data) => api.post('/activities', data),
    updateActivity: (id, data) => api.put(`/activities/${id}`, data),
    deleteActivity: (id) => api.delete(`/activities/${id}`),
};
